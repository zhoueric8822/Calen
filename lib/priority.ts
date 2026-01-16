import { differenceInHours, parseISO } from "date-fns";

import type { Task } from "@/lib/types";

export const getCompletionRatio = (task: Task) => {
  if (!task.subtasks.length) {
    return task.completed ? 1 : 0;
  }

  const done = task.subtasks.filter((subtask) => subtask.completed).length;
  return done / task.subtasks.length;
};

export const getTaskScore = (task: Task) => {
  // If task is completed, give it lowest priority
  if (task.completed) {
    return -1000000;
  }

  // Importance: 1-5 scale, multiply by 200 (so 200-1000 range)
  // This is still the primary factor but not overwhelming
  const importanceScore = task.importance * 200;

  // Deadline urgency: closer deadlines = higher score (0-400 range)
  // This can significantly influence ranking
  const now = new Date();
  const deadline = parseISO(task.deadline);
  const hoursUntilDeadline = differenceInHours(deadline, now);
  
  let deadlineScore: number;
  if (hoursUntilDeadline < 0) {
    // Overdue: very high urgency (300-400+ based on how overdue)
    const hoursOverdue = Math.abs(hoursUntilDeadline);
    deadlineScore = 300 + Math.min(hoursOverdue / 2, 100);
  } else if (hoursUntilDeadline < 24) {
    // Due today: high urgency (250-300)
    deadlineScore = 300 - (hoursUntilDeadline / 24) * 50;
  } else if (hoursUntilDeadline < 168) {
    // Due this week: medium urgency (150-250)
    deadlineScore = 250 - ((hoursUntilDeadline - 24) / 144) * 100;
  } else if (hoursUntilDeadline < 720) {
    // Due this month: low-medium urgency (50-150)
    deadlineScore = 150 - ((hoursUntilDeadline - 168) / 552) * 100;
  } else {
    // Due later: minimal urgency (0-50)
    deadlineScore = Math.max(0, 50 - (hoursUntilDeadline - 720) / 100);
  }

  // Subtask completion: small penalty (max 5% of total score)
  const completionRatio = getCompletionRatio(task);
  const completionPenalty = task.subtasks.length > 0 
    ? completionRatio * (task.importance * 10) 
    : 0;

  return importanceScore + deadlineScore - completionPenalty;
};

export const getAccentColor = (rank: number, total: number) => {
  if (total <= 1) {
    return "hsl(0 84% 60%)";
  }

  const ratio = rank / (total - 1);
  const hue = 10 + ratio * 40;
  return `hsl(${hue} 85% 60%)`;
};


