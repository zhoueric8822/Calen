import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Filters, Task, UserProfile } from "@/lib/types";

type SyncState = {
  status: "idle" | "syncing" | "error";
  message?: string;
  lastSyncedAt?: string;
};

type AuthState =
  | { status: "guest" }
  | { status: "signed_in"; user: UserProfile };

type ModalState = {
  task: boolean;
  editTask: string | null;
  deleteConfirm: string | null;
};

type CalenState = {
  tasks: Task[];
  filters: Filters;
  modals: ModalState;
  auth: AuthState;
  sync: SyncState;
  categories: string[];
  pendingDeletions: string[];
  setFilters: (filters: Partial<Filters>) => void;
  openModal: (modal: keyof ModalState) => void;
  closeModal: (modal: keyof ModalState) => void;
  openEditTask: (taskId: string) => void;
  closeEditTask: () => void;
  openDeleteConfirm: (taskId: string) => void;
  closeDeleteConfirm: () => void;
  setAuth: (auth: AuthState) => void;
  setSyncStatus: (status: SyncState["status"], message?: string) => void;
  replaceTasks: (tasks: Task[]) => void;
  updateTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  clearPendingDeletion: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addCategory: (category: string) => void;
};

const defaultFilters: Filters = {
  category: "all",
  importance: "all",
  status: "all",
};

export const useCalenStore = create<CalenState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filters: defaultFilters,
      modals: { task: false, editTask: null, deleteConfirm: null },
      auth: { status: "guest" },
      sync: { status: "idle" },
      categories: ["Work", "School", "Fitness"],
      pendingDeletions: [],
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      openModal: (modal) =>
        set((state) => ({ modals: { ...state.modals, [modal]: true } })),
      closeModal: (modal) =>
        set((state) => ({ modals: { ...state.modals, [modal]: false } })),
      setAuth: (auth) => set({ auth }),
      setSyncStatus: (status, message) =>
        set({
          sync: {
            status,
            message,
            lastSyncedAt: status === "idle" ? new Date().toISOString() : undefined,
          },
        }),
      replaceTasks: (tasks) =>
        set((state) => ({
          tasks: tasks.filter((t) => !state.pendingDeletions.includes(t.id)),
        })),
      updateTasks: (tasks) =>
        set((state) => {
          const updated = [...state.tasks];
          tasks.forEach((task) => {
            const index = updated.findIndex((item) => item.id === task.id);
            if (index >= 0) {
              updated[index] = task;
            } else {
              updated.push(task);
            }
          });
          return { tasks: updated };
        }),
      addTask: (task) =>
        set((state) => ({
          tasks: [{ ...task, syncPending: true }, ...state.tasks],
        })),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, syncPending: true }
              : task
          ),
        })),
      toggleTaskComplete: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completed: !task.completed,
                  syncPending: true,
                }
              : task
          ),
        })),
      addSubtask: (taskId, title) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: [
                    ...task.subtasks,
                    { id: crypto.randomUUID(), title, completed: false },
                  ],
                  syncPending: true,
                }
              : task
          ),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? { ...subtask, completed: !subtask.completed }
                      : subtask
                  ),
                  syncPending: true,
                }
              : task
          ),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          pendingDeletions: [...state.pendingDeletions, taskId],
        })),
      clearPendingDeletion: (taskId) =>
        set((state) => ({
          pendingDeletions: state.pendingDeletions.filter((id) => id !== taskId),
        })),
      openEditTask: (taskId) =>
        set({ modals: { task: false, editTask: taskId, deleteConfirm: null } }),
      closeEditTask: () =>
        set((state) => ({ modals: { ...state.modals, editTask: null } })),
      openDeleteConfirm: (taskId) =>
        set((state) => ({ modals: { ...state.modals, deleteConfirm: taskId } })),
      closeDeleteConfirm: () =>
        set((state) => ({ modals: { ...state.modals, deleteConfirm: null } })),
      addCategory: (category) =>
        set((state) => {
          if (state.categories.includes(category)) {
            return state;
          }
          return { categories: [...state.categories, category] };
        }),
    }),
    {
      name: "calen-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        filters: state.filters,
        categories: state.categories,
        pendingDeletions: state.pendingDeletions,
      }),
    }
  )
);


