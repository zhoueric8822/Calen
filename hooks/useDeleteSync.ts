import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { useCalenStore } from "@/stores/useCalenStore";

export const useDeleteSync = () => {
  const { isSignedIn } = useUser();
  const pendingDeletions = useCalenStore((state) => state.pendingDeletions);
  const clearPendingDeletion = useCalenStore(
    (state) => state.clearPendingDeletion
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
          pendingDeletions.map(async (taskId) => {
            try {
              const response = await fetch(`/api/tasks/${taskId}`, {
                method: "DELETE",
              });
              if (response.ok) {
                clearPendingDeletion(taskId);
              }
            } catch (error) {
              console.error(`Failed to delete task ${taskId}:`, error);
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

