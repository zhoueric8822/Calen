import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { useCalenStore } from "@/stores/useCalenStore";

export const useDaysMatterDeleteSync = () => {
  const { isSignedIn } = useUser();
  const pendingDeletions = useCalenStore(
    (state) => state.daysMatterPendingDeletions
  );
  const clearPendingDeletion = useCalenStore(
    (state) => state.clearDaysMatterPendingDeletion
  );
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || runningRef.current || !pendingDeletions.length) {
        return;
      }

      runningRef.current = true;
      try {
        await Promise.all(
          pendingDeletions.map(async (itemId) => {
            try {
              const response = await fetch(`/api/daysmatter/${itemId}`, {
                method: "DELETE",
              });
              if (response.ok) {
                clearPendingDeletion(itemId);
              }
            } catch (error) {
              console.error(`Failed to delete days matter item ${itemId}:`, error);
            }
          })
        );
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [isSignedIn, pendingDeletions, clearPendingDeletion]);
};

