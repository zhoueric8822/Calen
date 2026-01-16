"use client";

import { Warning } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
};

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: DeleteConfirmModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete task"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-white/5"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
            <Warning className="h-5 w-5 text-red-600 dark:text-red-400" weight="bold" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Are you sure you want to delete this task?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold">&quot;{taskTitle}&quot;</span> will be permanently deleted. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">Tip:</span> Hold Shift while clicking delete to skip this confirmation.
          </p>
        </div>
      </div>
    </Modal>
  );
};

