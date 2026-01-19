"use client";

import { Cloud, SignIn } from "@phosphor-icons/react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

import { TaskModal } from "@/components/TaskModal";
import { TaskView } from "@/components/TaskView";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { DaysMatterModal } from "@/components/DaysMatterModal";
import { useSyncBootstrap } from "@/hooks/useSyncBootstrap";
import { useTaskSync } from "@/hooks/useTaskSync";
import { useDeleteSync } from "@/hooks/useDeleteSync";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";
import { useDaysMatterSync } from "@/hooks/useDaysMatterSync";
import { useDaysMatterDeleteSync } from "@/hooks/useDaysMatterDeleteSync";
import { useDaysMatterDeletion } from "@/hooks/useDaysMatterDeletion";
import { useCategorySync } from "@/hooks/useCategorySync";
import { useCalenStore } from "@/stores/useCalenStore";

export const CalenApp = () => {
  useSyncBootstrap();
  useTaskSync();
  useDaysMatterSync();
  useDeleteSync();
  useDaysMatterDeleteSync();
  useCategorySync();

  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCompletedCount, setShowCompletedCount] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const tasks = useCalenStore((state) => state.tasks);
  const daysMatterItems = useCalenStore((state) => state.daysMatterItems);
  const totalPending = tasks.filter((task) => !task.completed).length;
  const totalCompleted = tasks.filter((task) => task.completed).length;
  const deleteConfirmTaskId = useCalenStore(
    (state) => state.modals.deleteConfirm
  );
  const deleteDaysMatterConfirmId = useCalenStore(
    (state) => state.modals.deleteDaysMatterConfirm
  );
  const closeDeleteConfirm = useCalenStore((state) => state.closeDeleteConfirm);
  const closeDeleteDaysMatterConfirm = useCalenStore((state) => state.closeDeleteDaysMatterConfirm);
  const { performDelete } = useTaskDeletion();
  const { performDelete: performDaysMatterDelete } = useDaysMatterDeletion();

  const taskToDelete = deleteConfirmTaskId
    ? tasks.find((t) => t.id === deleteConfirmTaskId)
    : null;

  const daysMatterToDelete = deleteDaysMatterConfirmId
    ? daysMatterItems.find((item) => item.id === deleteDaysMatterConfirmId)
    : null;

  const handleConfirmDeleteTask = () => {
    if (!deleteConfirmTaskId) return;
    performDelete(deleteConfirmTaskId);
  };

  const handleConfirmDeleteDaysMatter = () => {
    if (!deleteDaysMatterConfirmId) return;
    performDaysMatterDelete(deleteDaysMatterConfirmId);
    closeDeleteDaysMatterConfirm();
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="h-dvh bg-linear-to-br from-indigo-50 via-blue-100/50 to-violet-50 text-zinc-900 dark:from-zinc-950 dark:via-blue-900/50 dark:to-zinc-950 dark:text-zinc-50">
      <main className="h-full px-2 py-2 md:px-6 md:py-6">
        <section className="flex h-full flex-col rounded-[16px] md:rounded-[25px] border border-zinc-200 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90">
          <div className="flex h-full flex-col overflow-hidden p-5 py-0">
            <TaskView />
          </div>
          <div className="flex absolute bottom-0 left-0 right-0 rounded-full z-50 flex-wrap items-center justify-between gap-3 border-t border-white/20 px-5 py-4 text-xs font-semibold text-zinc-500 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/75 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <SignedIn>
                <div ref={profileRef} className="relative">
                  <button
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-200 shadow-sm transition hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    aria-label="Open profile menu"
                  >
                    {user?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.imageUrl}
                        alt={user.fullName ?? "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Cloud className="h-4 w-4 text-zinc-500" weight="bold" />
                    )}
                  </button>
                  {profileOpen ? (
                    <div className="absolute bottom-full left-0 mb-2 w-48 rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900 z-50">
                      <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-white/10">
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                          {user?.fullName || "User"}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                      <SignOutButton>
                        <button className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20">
                          Sign out
                        </button>
                      </SignOutButton>
                    </div>
                  ) : null}
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007AFF] text-white"
                    aria-label="Sign in with Google"
                  >
                    <SignIn className="h-4 w-4" weight="bold" />
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
            
            {/* Task counter toggle */}
            <button
              onClick={() => setShowCompletedCount(!showCompletedCount)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm transition hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {showCompletedCount ? totalCompleted : totalPending}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {showCompletedCount ? "done" : "left"}
              </span>
            </button>
          </div>
        </section>
      </main>

      <TaskModal />
      <DaysMatterModal />
      <DeleteConfirmModal
        isOpen={!!deleteConfirmTaskId}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDeleteTask}
        taskTitle={taskToDelete?.title ?? ""}
      />
      <DeleteConfirmModal
        isOpen={!!deleteDaysMatterConfirmId}
        onClose={closeDeleteDaysMatterConfirm}
        onConfirm={handleConfirmDeleteDaysMatter}
        taskTitle={daysMatterToDelete?.title ?? ""}
        itemType="event"
      />
    </div>
  );
};

