"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";

import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/lib/types";

type SortableTaskProps = {
  task: Task;
  accentColor: string;
  variant?: "full" | "compact";
};

export const SortableTask = ({
  task,
  accentColor,
  variant = "full",
}: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task" } });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Drag to reorder"
      onClick={(e) => e.stopPropagation()}
      className="-ml-1 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-zinc-300 transition hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400"
      {...attributes}
      {...listeners}
    >
      <DotsSixVertical className="h-5 w-5" weight="bold" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <TaskCard
        task={task}
        accentColor={accentColor}
        variant={variant}
        dragHandle={handle}
      />
    </div>
  );
};
