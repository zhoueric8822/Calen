import { useUser } from "@clerk/nextjs";

import { useCalenStore } from "@/stores/useCalenStore";

export const useDaysMatterDeletion = () => {
  const { isSignedIn } = useUser();
  const deleteDaysMatterItem = useCalenStore(
    (state) => state.deleteDaysMatterItem
  );
  const clearPendingDeletion = useCalenStore(
    (state) => state.clearDaysMatterPendingDeletion
  );

  const performDelete = async (itemId: string) => {
    deleteDaysMatterItem(itemId);

    if (isSignedIn) {
      try {
        const response = await fetch(`/api/daysmatter/${itemId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          clearPendingDeletion(itemId);
        }
      } catch (error) {
        console.error("Failed to delete days matter item:", error);
      }
    }
  };

  return { performDelete };
};

