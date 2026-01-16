"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import type { Subtask, Task } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

const initialSubtasks = (): Subtask[] => [
  { id: crypto.randomUUID(), title: "", completed: false },
];

export const TaskModal = () => {
  const isOpen = useCalenStore((state) => state.modals.task);
  const editTaskId = useCalenStore((state) => state.modals.editTask);
  const tasks = useCalenStore((state) => state.tasks);
  const categories = useCalenStore((state) => state.categories);
  const closeModal = useCalenStore((state) => state.closeModal);
  const closeEditTask = useCalenStore((state) => state.closeEditTask);
  const addTask = useCalenStore((state) => state.addTask);
  const updateTask = useCalenStore((state) => state.updateTask);
  const addCategory = useCalenStore((state) => state.addCategory);

  const editingTask = editTaskId
    ? tasks.find((t) => t.id === editTaskId)
    : null;
  const isEditing = !!editingTask;
  const isModalOpen = isOpen || !!editTaskId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [importance, setImportance] = useState(3);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? "");
      setDeadline(
        new Date(editingTask.deadline).toISOString().slice(0, 16)
      );
      setSelectedCategories(editingTask.categories);
      setImportance(editingTask.importance);
      setSubtasks(
        editingTask.subtasks.length
          ? editingTask.subtasks
          : initialSubtasks()
      );
    } else {
      reset();
    }
  }, [editingTask]);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && deadline.length > 0,
    [title, deadline]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setSelectedCategories([]);
    setImportance(3);
    setSubtasks(initialSubtasks);
    setShowCategoryInput(false);
    setNewCategoryName("");
  };

  const handleDeadlineChange = (value: string) => {
    // If user only selected a date (not time), default to 23:59
    if (value.length === 10) {
      // Format: YYYY-MM-DD, add 23:59
      setDeadline(value + "T23:59");
    } else {
      setDeadline(value);
    }
  };

  const handleClose = () => {
    reset();
    if (editTaskId) {
      closeEditTask();
    } else {
      closeModal("task");
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: new Date(deadline).toISOString(),
      categories: selectedCategories,
      importance,
      subtasks: subtasks.filter((subtask) => subtask.title.trim().length > 0),
    };

    if (isEditing) {
      updateTask(editingTask.id, taskData);
    } else {
      const task: Task = {
        id: crypto.randomUUID(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      addTask(task);
    }

    handleClose();
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const trimmedCategory = newCategoryName.trim();
    addCategory(trimmedCategory);
    setSelectedCategories((prev) => [...prev, trimmedCategory]);
    setNewCategoryName("");
    setShowCategoryInput(false);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      title={isEditing ? "Edit task" : "Add new task"}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Tasks are ranked by deadline and importance.
          </p>
          <button
            className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0066d6] disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isEditing ? "Save changes" : "Create task"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Title
          </label>
          <input
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Design the new onboarding flow"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Description
          </label>
          <textarea
            className="h-24 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add any supporting context or links"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
              Deadline
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
              value={deadline}
              onChange={(event) => handleDeadlineChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
                Categories
              </label>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
                onClick={() => setShowCategoryInput(true)}
              >
                <Plus className="h-4 w-4" weight="bold" />
              </button>
            </div>
            {showCategoryInput && (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") setShowCategoryInput(false);
                  }}
                  autoFocus
                />
                <button
                  className="rounded-2xl bg-[#007AFF] px-4 text-sm font-semibold text-white hover:bg-[#0066d6]"
                  onClick={handleAddCategory}
                >
                  Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategories.includes(cat)
                      ? "bg-[#007AFF] text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No categories selected
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Importance
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={importance}
            onChange={(event) => setImportance(Number(event.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>Low</span>
            <span className="font-semibold">{importance}</span>
            <span>High</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
              Subtasks
            </label>
            <button
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
              onClick={() =>
                setSubtasks((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), title: "", completed: false },
                ])
              }
            >
              <Plus className="h-3 w-3" weight="bold" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {subtasks.map((subtask, index) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5"
              >
                <input
                  className="flex-1 bg-transparent text-sm text-zinc-800 outline-none dark:text-zinc-200"
                  placeholder={`Subtask ${index + 1}`}
                  value={subtask.title}
                  onChange={(event) =>
                    setSubtasks((prev) =>
                      prev.map((item) =>
                        item.id === subtask.id
                          ? { ...item, title: event.target.value }
                          : item
                      )
                    )
                  }
                />
                <button
                  className="rounded-full p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  onClick={() =>
                    setSubtasks((prev) =>
                      prev.filter((item) => item.id !== subtask.id)
                    )
                  }
                >
                  <Trash className="h-4 w-4" weight="bold" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
