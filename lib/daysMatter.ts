import { differenceInDays, parseISO } from "date-fns";

import type { DaysMatterItem } from "@/lib/types";

export type DaysDisplay = { number: number; label: string };

export const isCountupPaused = (item: DaysMatterItem) =>
  item.type === "countup" && !!item.pausedAt;

/**
 * Whole days since a count-up started, minus any break days, measured up to
 * `pausedAt` when the count is paused (so the number stays frozen) or `now`
 * while it is running.
 */
export const getCountupDays = (item: DaysMatterItem, now: Date = new Date()) => {
  const end = item.pausedAt ? parseISO(item.pausedAt) : now;
  const elapsed = differenceInDays(end, parseISO(item.targetDate));
  return elapsed - (item.breakDays ?? 0);
};

/** Days between pausing and now — the default break length when restarting. */
export const getDaysPaused = (item: DaysMatterItem, now: Date = new Date()) =>
  item.pausedAt ? Math.max(0, differenceInDays(now, parseISO(item.pausedAt))) : 0;

export const getDaysDisplay = (
  item: DaysMatterItem,
  now: Date = new Date()
): DaysDisplay => {
  if (item.type === "countdown") {
    const daysDiff = differenceInDays(parseISO(item.targetDate), now);
    if (daysDiff === 0) return { number: 0, label: "Today!" };
    if (daysDiff < 0) return { number: Math.abs(daysDiff), label: "days ago" };
    return { number: daysDiff, label: daysDiff === 1 ? "day left" : "days left" };
  }

  const elapsed = getCountupDays(item, now);
  if (elapsed === 0) return { number: 0, label: item.pausedAt ? "days · paused" : "Today!" };
  if (elapsed < 0) return { number: Math.abs(elapsed), label: "days until" };
  const unit = elapsed === 1 ? "day" : "days";
  return { number: elapsed, label: item.pausedAt ? `${unit} · paused` : unit };
};
