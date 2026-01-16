import { useUser } from "@clerk/nextjs";
import { useCalenStore } from "@/stores/useCalenStore";

export const useTaskDeletion = () => {
  const { isSignedIn } = useUser();
  const deleteTask = useCalenStore((state) => state.deleteTask);
  const clearPendingDeletion = useCalenStore(
    (state) => state.clearPendingDeletion
  );

  const performDelete = async (taskId: string) => {
    deleteTask(taskId);

    if (isSignedIn) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          clearPendingDeletion(taskId);
        }
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  return { performDelete };
};

