"use client";

import { CheckCircle, Trash } from "@phosphor-icons/react";

import { getCompletionRatio } from "@/lib/priority";
import type { Task } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useCalenStore } from "@/stores/useCalenStore";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";

type TaskCardProps = {
  task: Task;
  accentColor: string;
};

export const TaskCard = ({ task, accentColor }: TaskCardProps) => {
  const toggleTaskComplete = useCalenStore((state) => state.toggleTaskComplete);
  const toggleSubtask = useCalenStore((state) => state.toggleSubtask);
  const openEditTask = useCalenStore((state) => state.openEditTask);
  const openDeleteConfirm = useCalenStore((state) => state.openDeleteConfirm);
  const completion = Math.round(getCompletionRatio(task) * 100);
  const { performDelete } = useTaskDeletion();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Shift + click = instant delete
    if (e.shiftKey) {
      performDelete(task.id);
    } else {
      // Normal click = show confirmation modal
      openDeleteConfirm(task.id);
    }
  };

  return (
    <div
      onClick={() => openEditTask(task.id)}
      className="cursor-pointer rounded-3xl border border-zinc-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <div className="flex flex-wrap items-center gap-1">
              {task.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
          <h3
            className={`text-base font-semibold ${
              task.completed
                ? "text-zinc-400 line-through"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {task.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Due {formatDateTime(task.deadline)}
          </p>
          {/* {task.description ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {task.description}
            </p>
          ) : null} */}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full text-zinc-300 transition hover:text-red-500"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            <Trash className="h-5 w-5" weight="bold" />
          </button>
          <button
            className="rounded-full text-zinc-300 transition hover:text-[#007AFF]"
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
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Completion</span>
          <span>{completion}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-[#007AFF]/60 dark:bg-[#007AFF]"
            style={{ width: `${completion}%` }}
          />
        </div>
        {task.subtasks.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {task.subtasks.map((subtask) => (
              <button
                key={subtask.id}
                onClick={() => toggleSubtask(task.id, subtask.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  subtask.completed
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20"
                }`}
              >
                {subtask.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

