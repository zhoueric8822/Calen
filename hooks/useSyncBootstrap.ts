import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { bootstrapSync } from "@/lib/sync";
import { useCalenStore } from "@/stores/useCalenStore";

export const useSyncBootstrap = () => {
  const { isSignedIn, isLoaded } = useUser();
  const setSyncStatus = useCalenStore((state) => state.setSyncStatus);
  const replaceTasks = useCalenStore((state) => state.replaceTasks);
  const updateTasks = useCalenStore((state) => state.updateTasks);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (hasBootstrapped.current) return;

    hasBootstrapped.current = true;
    let active = true;

    const run = async () => {
      if (!active) return;
      const { tasks } = useCalenStore.getState();

      await bootstrapSync(
        {
          setSyncStatus,
          replaceTasks,
          updateTasks,
        },
        tasks
      );
    };

    run();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, setSyncStatus, replaceTasks, updateTasks]);
};

