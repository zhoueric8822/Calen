import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { bootstrapDaysMatterSync, bootstrapSync } from "@/lib/sync";
import { useCalenStore } from "@/stores/useCalenStore";

export const useSyncBootstrap = () => {
  const { isSignedIn, isLoaded } = useUser();
  const setSyncStatus = useCalenStore((state) => state.setSyncStatus);
  const replaceTasks = useCalenStore((state) => state.replaceTasks);
  const updateTasks = useCalenStore((state) => state.updateTasks);
  const replaceDaysMatterItems = useCalenStore(
    (state) => state.replaceDaysMatterItems
  );
  const updateDaysMatterItems = useCalenStore(
    (state) => state.updateDaysMatterItems
  );
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (hasBootstrapped.current) return;

    hasBootstrapped.current = true;
    let active = true;

    const run = async () => {
      if (!active) return;
      const { tasks, daysMatterItems } = useCalenStore.getState();

      await bootstrapSync(
        {
          setSyncStatus,
          replaceTasks,
          updateTasks,
        },
        tasks
      );

      await bootstrapDaysMatterSync(
        {
          setSyncStatus,
          replaceDaysMatterItems,
          updateDaysMatterItems,
        },
        daysMatterItems
      );
    };

    run();

    return () => {
      active = false;
    };
  }, [
    isLoaded,
    isSignedIn,
    setSyncStatus,
    replaceTasks,
    updateTasks,
    replaceDaysMatterItems,
    updateDaysMatterItems,
  ]);
};

