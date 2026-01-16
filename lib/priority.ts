import { isBefore, isSameDay, isThisWeek, parseISO } from "date-fns";

import type { Task } from "@/lib/types";

const CATEGORY_WEIGHTS: Record<string, number> = {
  work: 12,
  school: 10,
  personal: 6,
  health: 8,
};

const importanceWeight = (importance: number) => importance * 20;

const deadlineUrgency = (deadline: string) => {
  const due = parseISO(deadline);
  const now = new Date();

  if (isBefore(due, now) && !isSameDay(due, now)) {
    return 80;
  }

  if (isSameDay(due, now)) {
    return 50;
  }

  if (isThisWeek(due, { weekStartsOn: 1 })) {
    return 30;
  }

  return 10;
};

export const getCompletionRatio = (task: Task) => {
  if (!task.subtasks.length) {
    return task.completed ? 1 : 0;
  }

  const done = task.subtasks.filter((subtask) => subtask.completed).length;
  return done / task.subtasks.length;
};

export const getTaskScore = (task: Task) => {
  const completionRatio = getCompletionRatio(task);
  const effectiveImportance = Math.max(
    0,
    Math.round(task.importance * (1 - completionRatio))
  );

  return (
    importanceWeight(effectiveImportance) +
    deadlineUrgency(task.deadline) +
    (CATEGORY_WEIGHTS[task.category.toLowerCase()] ?? 0)
  );
};

export const getAccentColor = (rank: number, total: number) => {
  if (total <= 1) {
    return "hsl(0 84% 60%)";
  }

  const ratio = rank / (total - 1);
  const hue = 10 + ratio * 40;
  return `hsl(${hue} 85% 60%)`;
};


