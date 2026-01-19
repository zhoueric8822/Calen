import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { syncDaysMatterItems } from "@/lib/sync";
import { useCalenStore } from "@/stores/useCalenStore";

export const useDaysMatterSync = () => {
  const { isSignedIn } = useUser();
  const items = useCalenStore((state) => state.daysMatterItems);
  const updateDaysMatterItems = useCalenStore(
    (state) => state.updateDaysMatterItems
  );
  const setSyncStatus = useCalenStore((state) => state.setSyncStatus);
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || runningRef.current) {
        return;
      }

      const pending = items.filter((item) => item.syncPending);
      if (!pending.length) {
        return;
      }

      runningRef.current = true;
      try {
        setSyncStatus("syncing");
        const synced = await syncDaysMatterItems(pending);
        updateDaysMatterItems(
          synced.map((item) => ({
            ...item,
            syncPending: false,
          }))
        );
        setSyncStatus("idle");
      } catch (error) {
        console.error(error);
        setSyncStatus("error", "Days matter sync failed.");
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [isSignedIn, items, updateDaysMatterItems, setSyncStatus]);
};

