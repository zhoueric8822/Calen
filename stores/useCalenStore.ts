import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DaysMatterItem, Filters, Task, UserProfile } from "@/lib/types";

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
  daysMatter: boolean;
  editDaysMatter: string | null;
  deleteDaysMatterConfirm: string | null;
};

type CalenState = {
  tasks: Task[];
  daysMatterItems: DaysMatterItem[];
  filters: Filters;
  modals: ModalState;
  auth: AuthState;
  sync: SyncState;
  categories: string[];
  pendingDeletions: string[];
  daysMatterPendingDeletions: string[];
  viewMode: "list" | "timeline" | "daysmatter";
  searchQuery: string;
  setFilters: (filters: Partial<Filters>) => void;
  setViewMode: (mode: "list" | "timeline" | "daysmatter") => void;
  setSearchQuery: (query: string) => void;
  openModal: (modal: keyof ModalState) => void;
  closeModal: (modal: keyof ModalState) => void;
  openEditTask: (taskId: string) => void;
  closeEditTask: () => void;
  openDeleteConfirm: (taskId: string) => void;
  closeDeleteConfirm: () => void;
  openEditDaysMatter: (itemId: string) => void;
  closeEditDaysMatter: () => void;
  openDeleteDaysMatterConfirm: (itemId: string) => void;
  closeDeleteDaysMatterConfirm: () => void;
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
  replaceCategories: (categories: string[]) => void;
  syncCategoriesPending: boolean;
  setSyncCategoriesPending: (pending: boolean) => void;
  replaceDaysMatterItems: (items: DaysMatterItem[]) => void;
  updateDaysMatterItems: (items: DaysMatterItem[]) => void;
  addDaysMatterItem: (item: DaysMatterItem) => void;
  updateDaysMatterItem: (itemId: string, updates: Partial<DaysMatterItem>) => void;
  deleteDaysMatterItem: (itemId: string) => void;
  clearDaysMatterPendingDeletion: (itemId: string) => void;
};

const defaultFilters: Filters = {
  category: "all",
  status: "all",
};

export const useCalenStore = create<CalenState>()(
  persist(
    (set, get) => ({
      tasks: [],
      daysMatterItems: [],
      filters: defaultFilters,
      modals: { task: false, editTask: null, deleteConfirm: null, daysMatter: false, editDaysMatter: null, deleteDaysMatterConfirm: null },
      auth: { status: "guest" },
      sync: { status: "idle" },
      categories: ["Work", "School", "Fitness"],
      pendingDeletions: [],
      daysMatterPendingDeletions: [],
      viewMode: "list",
      searchQuery: "",
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
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
        set((state) => ({
          modals: {
            ...state.modals,
            task: false,
            editTask: taskId,
            deleteConfirm: null,
          },
        })),
      closeEditTask: () =>
        set((state) => ({ modals: { ...state.modals, editTask: null } })),
      openDeleteConfirm: (taskId) =>
        set((state) => ({ modals: { ...state.modals, deleteConfirm: taskId } })),
      closeDeleteConfirm: () =>
        set((state) => ({ modals: { ...state.modals, deleteConfirm: null } })),
      openEditDaysMatter: (itemId) =>
        set({ modals: { task: false, editTask: null, deleteConfirm: null, daysMatter: false, editDaysMatter: itemId, deleteDaysMatterConfirm: null } }),
      closeEditDaysMatter: () =>
        set((state) => ({ modals: { ...state.modals, editDaysMatter: null } })),
      openDeleteDaysMatterConfirm: (itemId) =>
        set((state) => ({ modals: { ...state.modals, deleteDaysMatterConfirm: itemId } })),
      closeDeleteDaysMatterConfirm: () =>
        set((state) => ({ modals: { ...state.modals, deleteDaysMatterConfirm: null } })),
      addCategory: (category) =>
        set((state) => {
          if (state.categories.includes(category)) {
            return state;
          }
          return { 
            categories: [...state.categories, category],
            syncCategoriesPending: true,
          };
        }),
      replaceCategories: (categories) => set({ categories }),
      syncCategoriesPending: false,
      setSyncCategoriesPending: (pending) => set({ syncCategoriesPending: pending }),
      addDaysMatterItem: (item) =>
        set((state) => ({
          daysMatterItems: [{ ...item, syncPending: true }, ...state.daysMatterItems],
        })),
      updateDaysMatterItem: (itemId, updates) =>
        set((state) => ({
          daysMatterItems: state.daysMatterItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                  syncPending: true,
                }
              : item
          ),
        })),
      replaceDaysMatterItems: (items) => set({ daysMatterItems: items }),
      updateDaysMatterItems: (items) =>
        set((state) => {
          const updated = [...state.daysMatterItems];
          items.forEach((item) => {
            const index = updated.findIndex((existing) => existing.id === item.id);
            if (index >= 0) {
              updated[index] = item;
            } else {
              updated.push(item);
            }
          });
          return { daysMatterItems: updated };
        }),
      deleteDaysMatterItem: (itemId) =>
        set((state) => ({
          daysMatterItems: state.daysMatterItems.filter((item) => item.id !== itemId),
          daysMatterPendingDeletions: [
            ...state.daysMatterPendingDeletions,
            itemId,
          ],
        })),
      clearDaysMatterPendingDeletion: (itemId) =>
        set((state) => ({
          daysMatterPendingDeletions: state.daysMatterPendingDeletions.filter(
            (id) => id !== itemId
          ),
        })),
    }),
    {
      name: "calen-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        daysMatterItems: state.daysMatterItems,
        filters: state.filters,
        categories: state.categories,
        pendingDeletions: state.pendingDeletions,
        daysMatterPendingDeletions: state.daysMatterPendingDeletions,
        viewMode: state.viewMode,
      }),
    }
  )
);


