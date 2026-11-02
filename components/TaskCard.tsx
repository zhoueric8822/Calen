"use client";

import { Check, CheckCircle, Circle, Trash } from "@phosphor-icons/react";
import { isBefore, startOfDay, parseISO } from "date-fns";
import type { ReactNode } from "react";

import { getCompletionRatio } from "@/lib/priority";
import type { Task } from "@/lib/types";
import { formatDateTime, formatTime } from "@/lib/utils";
import { useCalenStore } from "@/stores/useCalenStore";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";

type TaskCardProps = {
  task: Task;
  accentColor: string;
  /** "compact" is a one-line row used by the timeline. */
  variant?: "full" | "compact";
  dragHandle?: ReactNode;
};

/** One pip per subtask (or a plain bar when there are many) + "2/5". */
const SubtaskProgress = ({ task }: { task: Task }) => {
  const total = task.subtasks.length;
  if (!total) return null;
  const done = task.subtasks.filter((s) => s.completed).length;

  return (
    <span
      className="flex items-center gap-1.5"
      title={`${done} of ${total} subtasks done`}
    >
      {total <= 8 ? (
        <span className="flex gap-0.5">
          {task.subtasks.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 w-3.5 rounded-full ${
                s.completed
                  ? "bg-[#007AFF]"
                  : "bg-zinc-200 dark:bg-white/15"
              }`}
            />
          ))}
        </span>
      ) : (
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/15">
          <span
            className="block h-full rounded-full bg-[#007AFF]"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </span>
      )}
      <span className="tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
};

export const TaskCard = ({
  task,
  accentColor,
  variant = "full",
  dragHandle,
}: TaskCardProps) => {
  const toggleTaskComplete = useCalenStore((state) => state.toggleTaskComplete);
  const toggleSubtask = useCalenStore((state) => state.toggleSubtask);
  const openEditTask = useCalenStore((state) => state.openEditTask);
  const openDeleteConfirm = useCalenStore((state) => state.openDeleteConfirm);
  const { performDelete } = useTaskDeletion();

  const isOverdue =
    !task.completed && isBefore(parseISO(task.deadline), startOfDay(new Date()));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Shift + click = instant delete
    if (e.shiftKey) {
      performDelete(task.id);
    } else {
      openDeleteConfirm(task.id);
    }
  };

  const surface = isOverdue
    ? "border-red-500 border-dashed bg-red-50 dark:border-red-500/50 dark:bg-red-950/20"
    : "border-zinc-100 bg-white dark:border-white/10 dark:bg-zinc-900";

  const titleClass = task.completed
    ? "text-zinc-400 line-through"
    : "text-zinc-900 dark:text-zinc-50";

  if (variant === "compact") {
    return (
      <div
        onClick={() => openEditTask(task.id)}
        className={`group flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm transition hover:shadow-md ${surface}`}
      >
        {dragHandle}
        <button
          className={`shrink-0 transition ${
            task.completed
              ? "text-[#007AFF]"
              : "text-zinc-300 hover:text-[#007AFF]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          aria-label="Toggle complete"
        >
          {task.completed ? (
            <CheckCircle className="h-5 w-5" weight="fill" />
          ) : (
            <Circle className="h-5 w-5" weight="bold" />
          )}
        </button>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className={`min-w-0 flex-1 truncate text-sm font-semibold ${titleClass}`}>
          {task.title}
        </h3>
        <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <SubtaskProgress task={task} />
          <span className="hidden tabular-nums sm:inline">
            {isOverdue ? formatDateTime(task.deadline) : formatTime(task.deadline)}
          </span>
          <button
            className="rounded-full text-zinc-300 opacity-60 transition hover:text-red-500 group-hover:opacity-100"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            <Trash className="h-4 w-4" weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  const completion = Math.round(getCompletionRatio(task) * 100);

  return (
    <div
      onClick={() => openEditTask(task.id)}
      className={`cursor-pointer rounded-3xl border px-4 py-3.5 shadow-sm transition hover:shadow-md ${surface}`}
    >
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Priority dot sits right beside the title */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <h3 className={`text-base font-semibold leading-6 ${titleClass}`}>
                {task.title}
              </h3>
            </div>
            {task.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[18px] text-xs text-zinc-500 dark:text-zinc-400">
            <span>Due {formatDateTime(task.deadline)}</span>
            <SubtaskProgress task={task} />
            {task.subtasks.length > 0 ? (
              <span className="tabular-nums text-zinc-400">{completion}%</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="rounded-full text-zinc-300 transition hover:text-red-500"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            <Trash className="h-5 w-5" weight="bold" />
          </button>
          <button
            className={`rounded-full transition ${
              task.completed
                ? "text-[#007AFF]"
                : "text-zinc-300 hover:text-[#007AFF]"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
            aria-label="Toggle complete"
          >
            <CheckCircle className="h-5 w-5" weight="bold" />
          </button>
        </div>
      </div>
      {task.subtasks.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[18px]">
          {task.subtasks.map((subtask) => (
            <button
              key={subtask.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleSubtask(task.id, subtask.id);
              }}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                subtask.completed
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20"
              }`}
            >
              {subtask.completed ? <Check className="h-3 w-3" weight="bold" /> : null}
              {subtask.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
