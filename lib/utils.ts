import {
  format,
  isSameDay,
  parseISO,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";

export const formatDate = (iso: string, pattern = "MMM d") =>
  format(parseISO(iso), pattern);

export const formatTime = (iso: string) =>
  format(parseISO(iso), "h:mm a");

export const formatDateTime = (iso: string) =>
  format(parseISO(iso), "MMM d, h:mm a");

export const formatRange = (start: string, end: string, allDay: boolean) => {
  if (allDay) {
    return `${formatDate(start)} · All day`;
  }

  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (isSameDay(startDate, endDate)) {
    return `${formatDate(start)} · ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};

export const getDaysUntil = (iso: string) =>
  differenceInCalendarDays(startOfDay(parseISO(iso)), startOfDay(new Date()));


