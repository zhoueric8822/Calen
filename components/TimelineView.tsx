"use client";

import { useMemo } from "react";
import { format, parseISO, startOfDay, differenceInDays } from "date-fns";
import { TaskCard } from "@/components/TaskCard";
import { getAccentColor } from "@/lib/priority";
import type { Task } from "@/lib/types";

type TimelineViewProps = {
  tasks: Task[];
};

export const TimelineView = ({ tasks }: TimelineViewProps) => {
  const today = startOfDay(new Date());
  
  const { overdueTasks, timeline } = useMemo(() => {
    if (!tasks.length) return { overdueTasks: [], timeline: [] };

    // Sort tasks by deadline
    const sorted = [...tasks].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

    // Separate overdue tasks (deadline before today, not completed)
    const overdue: Task[] = [];
    const upcoming: Task[] = [];
    
    sorted.forEach((task) => {
      const taskDate = startOfDay(parseISO(task.deadline));
      if (!task.completed && taskDate < today) {
        overdue.push(task);
      } else if (taskDate >= today) {
        upcoming.push(task);
      }
    });

    // Group upcoming tasks by date (only from today forward)
    const grouped = new Map<string, Task[]>();
    upcoming.forEach((task) => {
      const date = format(parseISO(task.deadline), "yyyy-MM-dd");
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(task);
    });

    // Convert to array and add date info
    const timelineData = Array.from(grouped.entries()).map(([date, tasks]) => ({
      date,
      dateObj: parseISO(date),
      tasks,
    }));
    
    return { overdueTasks: overdue, timeline: timelineData };
  }, [tasks, today]);

  return (
    <div className="relative pl-8 pr-1">
      {/* Vertical timeline line */}
      <div className="absolute left-2 top-0 h-full w-0.5 bg-[#007AFF]/20" />

      {overdueTasks.length > 0 || timeline.length > 0 ? (
        <div className="space-y-8">
          {/* Overdue Tasks Section - Pinned at top */}
          {overdueTasks.length > 0 && (
            <div className="relative">
              {/* Red dot for overdue */}
              <div className="absolute -left-[35px] top-2 h-4 w-4 rounded-full border-2 border-red-500 bg-white dark:bg-zinc-900" />

              {/* Overdue header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-red-500">
                  Overdue
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {overdueTasks.length} {overdueTasks.length === 1 ? "task" : "tasks"}
                </p>
              </div>

              {/* Overdue tasks */}
              <div className="space-y-3">
                {overdueTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    accentColor={getAccentColor(index, overdueTasks.length)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Regular timeline from today onward */}
          {timeline.map(({ date, dateObj, tasks: dateTasks }) => {
            const daysFromToday = differenceInDays(dateObj, today);
            const isToday = daysFromToday === 0;
            const isPast = daysFromToday < 0;
            const isTomorrow = daysFromToday === 1;

            let dateLabel = format(dateObj, "EEEE, MMM d");
            if (isToday) dateLabel = "Today";
            else if (isTomorrow) dateLabel = "Tomorrow";
            else if (isPast) dateLabel = `${format(dateObj, "EEEE, MMM d")}`;

            return (
              <div key={date} className="relative">
                {/* Blue dot on timeline */}
                <div className="absolute -left-[35px] top-2 h-4 w-4 rounded-full border-2 border-[#007AFF] bg-white dark:bg-zinc-900" />

                {/* Date header */}
                <div className="mb-4">
                  <h3
                    className={`text-xl font-bold ${
                      isToday
                        ? "text-[#007AFF]"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {dateLabel}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {dateTasks.length} {dateTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>

                {/* Tasks for this date */}
                <div className="space-y-3">
                  {dateTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      accentColor={getAccentColor(index, dateTasks.length)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-400 dark:border-white/10 dark:bg-zinc-900">
          No tasks yet. Add one to start organizing your week.
        </div>
      )}
    </div>
  );
};
