import type { Task } from "@/lib/types";

type SyncActions = {
  setSyncStatus: (status: "idle" | "syncing" | "error", message?: string) => void;
  replaceTasks: (tasks: Task[]) => void;
  updateTasks: (tasks: Task[]) => void;
};

const postJson = async <T>(url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

const getJson = async <T>(url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

export const bootstrapSync = async (
  actions: SyncActions,
  localTasks: Task[]
) => {
  try {
    actions.setSyncStatus("syncing");

    const taskSync = await getJson<{
      userExists: boolean;
      tasks: Task[];
    }>("/api/sync");

    if (taskSync.userExists) {
      // Merge remote tasks with local pending tasks
      const localPending = localTasks.filter((t) => t.syncPending);
      const remoteTasks = taskSync.tasks;
      
      // If we have local pending tasks, upload them first
      if (localPending.length) {
        const synced = await postJson<{ tasks: Task[] }>("/api/sync", {
          tasks: localPending,
        });
        // Combine synced tasks with other remote tasks
        const syncedIds = new Set(synced.tasks.map(t => t.id));
        const otherRemote = remoteTasks.filter(t => !syncedIds.has(t.id));
        actions.replaceTasks([...synced.tasks, ...otherRemote]);
      } else {
        actions.replaceTasks(remoteTasks);
      }
    } else if (localTasks.length) {
      const upload = await postJson<{ tasks: Task[] }>("/api/sync", {
        tasks: localTasks,
      });
      actions.replaceTasks(upload.tasks);
    } else {
      await postJson("/api/sync", { tasks: [] });
    }

    actions.setSyncStatus("idle");
  } catch (error) {
    console.error(error);
    actions.setSyncStatus("error", "Sync failed. Try again.");
  }
};

export const syncTasks = async (tasks: Task[]) => {
  if (!tasks.length) {
    return [];
  }

  const response = await postJson<{ tasks: Task[] }>("/api/sync", { tasks });
  return response.tasks;
};

