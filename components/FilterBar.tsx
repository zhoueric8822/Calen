"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";

import { useCalenStore } from "@/stores/useCalenStore";

export const FilterBar = () => {
  const tasks = useCalenStore((state) => state.tasks);
  const filters = useCalenStore((state) => state.filters);
  const setFilters = useCalenStore((state) => state.setFilters);
  const storeCategories = useCalenStore((state) => state.categories);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      task.categories.forEach((cat) => set.add(cat));
    });
    // Also include store categories even if not in tasks
    storeCategories.forEach((cat) => set.add(cat));
    return Array.from(set).sort();
  }, [tasks, storeCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedCategory = filters.category === "all" ? "All categories" : filters.category;

  return (
    <div className="hidden items-center gap-2 md:flex">
      {/* Custom dropdown for categories */}
      <div ref={categoryRef} className="relative">
        <button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 outline-none transition hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <span className="max-w-[120px] truncate">{selectedCategory}</span>
          <CaretDown className="h-3 w-3" weight="bold" />
        </button>
        
        {categoryOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
            <div className="max-h-64 overflow-y-auto p-2">
              <button
                onClick={() => {
                  setFilters({ category: "all" });
                  setCategoryOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  filters.category === "all"
                    ? "bg-[#007AFF] text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                }`}
              >
                All categories
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setFilters({ category });
                    setCategoryOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    filters.category === category
                      ? "bg-[#007AFF] text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <select
        className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 outline-none transition hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
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

