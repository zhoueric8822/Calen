"use client";

import { Plus } from "@phosphor-icons/react";
import { isBefore, parseISO } from "date-fns";

import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { getAccentColor, getTaskScore } from "@/lib/priority";
import { useCalenStore } from "@/stores/useCalenStore";

export const TaskView = () => {
  const tasks = useCalenStore((state) => state.tasks);
  const filters = useCalenStore((state) => state.filters);
  const openModal = useCalenStore((state) => state.openModal);

  const filtered = tasks.filter((task) => {
    if (filters.category !== "all" && task.category !== filters.category) {
      return false;
    }
    if (filters.importance !== "all" && task.importance !== filters.importance) {
      return false;
    }

    if (filters.status === "completed" && !task.completed) {
      return false;
    }

    if (filters.status === "active" && task.completed) {
      return false;
    }

    if (filters.status === "overdue") {
      return isBefore(parseISO(task.deadline), new Date()) && !task.completed;
    }

    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => getTaskScore(b) - getTaskScore(a)
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Priority tasks
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Calen
          </h2>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF] text-white transition hover:bg-[#0066d6]"
          onClick={() => openModal("task")}
          aria-label="Add task"
        >
          <Plus className="h-5 w-5" weight="bold" />
        </button>
      </div>
      <FilterBar />
      <div className="space-y-3">
        {sorted.length ? (
          sorted.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              accentColor={getAccentColor(index, sorted.length)}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-400 dark:border-white/10 dark:bg-zinc-900">
            No tasks yet. Add one to start organizing your week.
          </div>
        )}
      </div>
    </section>
  );
};

