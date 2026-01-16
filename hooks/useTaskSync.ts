import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { syncTasks } from "@/lib/sync";
import { useCalenStore } from "@/stores/useCalenStore";

export const useTaskSync = () => {
  const { isSignedIn } = useUser();
  const tasks = useCalenStore((state) => state.tasks);
  const updateTasks = useCalenStore((state) => state.updateTasks);
  const setSyncStatus = useCalenStore((state) => state.setSyncStatus);
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || runningRef.current) {
        return;
      }

      const pending = tasks.filter((task) => task.syncPending);
      if (!pending.length) {
        return;
      }

      runningRef.current = true;
      try {
        setSyncStatus("syncing");
        const synced = await syncTasks(pending);
        updateTasks(
          synced.map((task) => ({
            ...task,
            syncPending: false,
          }))
        );
        setSyncStatus("idle");
      } catch (error) {
        console.error(error);
        setSyncStatus("error", "Task sync failed.");
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [isSignedIn, tasks, updateTasks, setSyncStatus]);
};


