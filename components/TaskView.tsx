"use client";

import { List, CalendarBlank, Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { isBefore, parseISO } from "date-fns";
import Fuse from "fuse.js";
import { useMemo } from "react";

import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TimelineView } from "@/components/TimelineView";
import { getAccentColor, getTaskScore } from "@/lib/priority";
import { useCalenStore } from "@/stores/useCalenStore";

export const TaskView = () => {
  const tasks = useCalenStore((state) => state.tasks);
  const filters = useCalenStore((state) => state.filters);
  const viewMode = useCalenStore((state) => state.viewMode);
  const searchQuery = useCalenStore((state) => state.searchQuery);
  const setViewMode = useCalenStore((state) => state.setViewMode);
  const setSearchQuery = useCalenStore((state) => state.setSearchQuery);
  const openModal = useCalenStore((state) => state.openModal);

  // Fuzzy search with Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(tasks, {
        keys: ["title", "description", "categories"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [tasks]
  );

  const searchedTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, tasks, fuse]);

  const filtered = searchedTasks.filter((task) => {
    // Single category filtering
    if (filters.category !== "all" && !task.categories.includes(filters.category)) {
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

  // Split into active and archived (completed) tasks
  const activeTasks = sorted.filter((task) => !task.completed);
  const archivedTasks = sorted.filter((task) => task.completed);

  const deleteTask = useCalenStore((state) => state.deleteTask);

  const handleClearArchived = () => {
    if (archivedTasks.length === 0) return;
    if (confirm(`Delete all ${archivedTasks.length} archived tasks?`)) {
      archivedTasks.forEach((task) => deleteTask(task.id));
    }
  };

  return (
    <section className="flex h-full flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 space-y-4 py-5 bg-white/95 pb-4 backdrop-blur-sm dark:bg-zinc-900/95">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
              Priority tasks
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Todo
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-full border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" weight="bold" />
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition ${
                  viewMode === "timeline"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                aria-label="Timeline view"
              >
                <CalendarBlank className="h-4 w-4" weight="bold" />
              </button>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF] text-white transition hover:bg-[#0066d6]"
              onClick={() => openModal("task")}
              aria-label="Add task"
            >
              <Plus className="h-5 w-5" weight="bold" />
            </button>
          </div>
        </div>

        {/* Search Bar with inline filters on desktop */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-zinc-100 bg-white/80 py-2.5 pl-11 pr-4 text-sm text-zinc-900 outline-none ring-0 transition focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-50 dark:focus:border-white/20"
            />
          </div>
          <FilterBar />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-3 overflow-y-auto py-6 scrollbar-hide">
        {viewMode === "timeline" ? (
          <TimelineView tasks={sorted} />
        ) : (
          <div className="space-y-3">
            {/* Active Tasks */}
            {activeTasks.length ? (
              activeTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  accentColor={getAccentColor(index, activeTasks.length)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-400 dark:border-white/10 dark:bg-zinc-900">
                No tasks yet. Add one to start organizing your week.
              </div>
            )}

            {/* Archived Tasks Section */}
            {archivedTasks.length > 0 && (
              <>
                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <button
                      onClick={handleClearArchived}
                      className="bg-white px-4 text-xs text-zinc-400 transition hover:text-zinc-600 dark:bg-zinc-900 dark:hover:text-zinc-300"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {archivedTasks.map((task, index) => (
                  <div className="grayscale-90" key={task.id}>
                    <TaskCard
                    task={task}
                    accentColor={getAccentColor(index, archivedTasks.length)}
                  />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

