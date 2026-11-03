"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { differenceInDays, format, parseISO, set, startOfDay } from "date-fns";
import { useMemo, useState } from "react";

import { SortableTask } from "@/components/SortableTask";
import { TaskCard } from "@/components/TaskCard";
import { importanceForPosition, sortActiveByScore } from "@/lib/priority";
import type { Task } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

type TimelineViewProps = {
  tasks: Task[];
  colorById: Map<string, string>;
};

type Section = {
  /** Droppable id: "day:yyyy-MM-dd" or "day:overdue" */
  id: string;
  key: string;
  active: Task[];
  done: Task[];
};

const OVERDUE_ID = "day:overdue";
const FALLBACK_COLOR = "hsl(30 85% 60%)";

const DaySection = ({
  section,
  droppable,
  children,
  highlight,
}: {
  section: Section;
  droppable: boolean;
  highlight: boolean;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    disabled: !droppable,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl transition ${
        highlight ? "bg-[#007AFF]/6 p-3 ring-1 ring-[#007AFF]/25 dark:bg-[#007AFF]/10" : ""
      } ${isOver ? "ring-2 ring-[#007AFF]/60" : ""}`}
    >
      {children}
    </div>
  );
};

export const TimelineView = ({ tasks, colorById }: TimelineViewProps) => {
  const updateTask = useCalenStore((state) => state.updateTask);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { overdue, days, today } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayKey = format(todayStart, "yyyy-MM-dd");

    const overdueTasks: Task[] = [];
    const byDay = new Map<string, Task[]>();
    // Today is always present so it's a visible drop target, even when empty
    byDay.set(todayKey, []);

    tasks.forEach((task) => {
      const day = startOfDay(parseISO(task.deadline));
      if (day < todayStart) {
        if (!task.completed) overdueTasks.push(task);
        return;
      }
      const key = format(day, "yyyy-MM-dd");
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(task);
    });

    const toSection = (key: string, id: string, list: Task[]): Section => ({
      id,
      key,
      active: sortActiveByScore(list),
      done: list.filter((t) => t.completed),
    });

    const dayList = Array.from(byDay.keys())
      .sort()
      .map((key) => toSection(key, `day:${key}`, byDay.get(key)!));

    return {
      overdue: overdueTasks.length
        ? toSection("overdue", OVERDUE_ID, overdueTasks)
        : null,
      days: dayList,
      today: todayStart,
    };
  }, [tasks]);

  const sections = useMemo(
    () => (overdue ? [overdue, ...days] : days),
    [overdue, days]
  );

  const findSection = (taskId: string) =>
    sections.find((s) => s.active.some((t) => t.id === taskId));

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;

  // Prefer a task under the pointer over the day container that holds it.
  const collisionDetection: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    if (!hits.length) return closestCenter(args);
    const taskHit = hits.find((h) => !String(h.id).startsWith("day:"));
    return taskHit ? [taskHit] : hits;
  };

  const handleDragStart = ({ active }: DragStartEvent) =>
    setActiveId(String(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const movedId = String(active.id);
    const moved = tasks.find((t) => t.id === movedId);
    const fromSection = findSection(movedId);
    if (!moved || !fromSection) return;

    const overId = String(over.id);
    const overIsDay = overId.startsWith("day:");
    const toSection = overIsDay
      ? sections.find((s) => s.id === overId)
      : findSection(overId);
    if (!toSection) return;

    // Can't drop *into* Overdue — only reorder inside it or drag out of it
    if (toSection.id === OVERDUE_ID && fromSection.id !== OVERDUE_ID) return;

    const sameSection = toSection.id === fromSection.id;
    const target = toSection.active.filter((t) => t.id !== movedId);

    // Where in the target list?
    let index: number;
    if (overIsDay) {
      index = target.length;
    } else {
      const overIndex = target.findIndex((t) => t.id === overId);
      const activeRect = active.rect.current.translated;
      const below =
        !!activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
      if (sameSection) {
        // Same list: land where the dragged card visually ended up
        const oldIndex = toSection.active.findIndex((t) => t.id === movedId);
        const overOriginal = toSection.active.findIndex((t) => t.id === overId);
        index = overOriginal > oldIndex ? overIndex + 1 : overIndex;
      } else {
        index = below ? overIndex + 1 : overIndex;
      }
    }

    // Changing day keeps the time of day, so a 5pm task stays a 5pm task
    let nextDeadline = moved.deadline;
    if (!sameSection && toSection.id !== OVERDUE_ID) {
      const old = parseISO(moved.deadline);
      nextDeadline = set(parseISO(toSection.key), {
        hours: old.getHours(),
        minutes: old.getMinutes(),
      }).toISOString();
    }

    const importance = importanceForPosition(
      { ...moved, deadline: nextDeadline },
      target,
      index
    );

    const updates: Partial<Task> = {};
    if (nextDeadline !== moved.deadline) updates.deadline = nextDeadline;
    if (importance !== moved.importance) updates.importance = importance;
    if (Object.keys(updates).length) updateTask(movedId, updates);
  };

  const renderSection = (section: Section) => {
    const isOverdue = section.id === OVERDUE_ID;
    const dateObj = isOverdue ? today : parseISO(section.key);
    const daysFromToday = differenceInDays(dateObj, today);
    const isToday = !isOverdue && daysFromToday === 0;

    let label = format(dateObj, "EEEE, MMM d");
    if (isOverdue) label = "Overdue";
    else if (isToday) label = "Today";
    else if (daysFromToday === 1) label = "Tomorrow";

    const total = section.active.length + section.done.length;
    const doneCount = section.done.length;

    return (
      <div key={section.id} className="relative">
        <div
          className={`absolute -left-[35px] top-2 h-4 w-4 rounded-full border-2 bg-white dark:bg-zinc-900 ${
            isOverdue ? "border-red-500" : "border-[#007AFF]"
          } ${isToday ? "bg-[#007AFF]! ring-4 ring-[#007AFF]/20" : ""}`}
        />
        <DaySection
          section={section}
          droppable={!isOverdue}
          highlight={isToday}
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3
                className={`font-bold ${isToday ? "text-2xl" : "text-xl"} ${
                  isOverdue
                    ? "text-red-500"
                    : isToday
                      ? "text-[#007AFF]"
                      : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {label}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isToday
                  ? section.active.length
                    ? `${section.active.length} left to do${
                        doneCount ? ` · ${doneCount} done` : ""
                      }`
                    : total
                      ? "All done for today 🎉"
                      : "Nothing due today"
                  : `${total} ${total === 1 ? "task" : "tasks"}`}
              </p>
            </div>
            {isToday && total > 0 ? (
              <div className="flex w-24 flex-col items-end gap-1">
                <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                  {doneCount}/{total}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#007AFF] transition-all"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <SortableContext
            items={section.active.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="min-h-2 space-y-2">
              {section.active.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  variant="compact"
                  accentColor={colorById.get(task.id) ?? FALLBACK_COLOR}
                />
              ))}
              {isToday && total === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#007AFF]/30 px-4 py-6 text-center text-sm text-zinc-400">
                  Drag a task here to do it today
                </div>
              ) : null}
            </div>
          </SortableContext>

          {section.done.length ? (
            <div className="mt-2 space-y-2 opacity-60 grayscale">
              {section.done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="compact"
                  accentColor={colorById.get(task.id) ?? FALLBACK_COLOR}
                />
              ))}
            </div>
          ) : null}
        </DaySection>
      </div>
    );
  };

  return (
    <div className="relative mt-5 pl-8 pr-1">
      {/* Vertical timeline line */}
      <div className="absolute left-2 top-0 h-full w-0.5 bg-[#007AFF]/20" />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="space-y-8">{sections.map(renderSection)}</div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              variant="compact"
              accentColor={colorById.get(activeTask.id) ?? FALLBACK_COLOR}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
