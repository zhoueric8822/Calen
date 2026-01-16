"use client";

import { useMemo } from "react";

import { useCalenStore } from "@/stores/useCalenStore";

export const FilterBar = () => {
  const tasks = useCalenStore((state) => state.tasks);
  const filters = useCalenStore((state) => state.filters);
  const setFilters = useCalenStore((state) => state.setFilters);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      if (task.category) set.add(task.category);
    });
    return Array.from(set).sort();
  }, [tasks]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-100 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      <select
        className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
        value={filters.category}
        onChange={(event) => setFilters({ category: event.target.value })}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
        value={filters.importance}
        onChange={(event) =>
          setFilters({
            importance:
              event.target.value === "all"
                ? "all"
                : Number(event.target.value),
          })
        }
      >
        <option value="all">All importance</option>
        {[5, 4, 3, 2, 1].map((level) => (
          <option key={level} value={level}>
            Priority {level}
          </option>
        ))}
      </select>
      <select
        className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
        value={filters.status}
        onChange={(event) =>
          setFilters({ status: event.target.value as typeof filters.status })
        }
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
      </select>
    </div>
  );
};

