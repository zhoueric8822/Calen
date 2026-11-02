"use client";

import { Plus, Trash, X } from "@phosphor-icons/react";
import { addDays, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import type { Subtask, Task } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

const DEFAULT_TIME = "23:59";

const initialSubtasks = (): Subtask[] => [
  { id: crypto.randomUUID(), title: "", completed: false },
];

const toDateInput = (date: Date) => format(date, "yyyy-MM-dd");

const QUICK_DATES = [
  { label: "Due today", offset: 0 },
  { label: "Due tomorrow", offset: 1 },
  { label: "Due next week", offset: 7 },
] as const;

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
  const removeCategory = useCalenStore((state) => state.removeCategory);

  const editingTask = editTaskId
    ? tasks.find((t) => t.id === editTaskId)
    : null;
  const isEditing = !!editingTask;
  const isModalOpen = isOpen || !!editTaskId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState(DEFAULT_TIME);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [importance, setImportance] = useState(3);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [manageCategories, setManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? "");
      const existing = parseISO(editingTask.deadline);
      setDateValue(toDateInput(existing));
      setTimeValue(format(existing, "HH:mm"));
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
    () => title.trim().length > 0 && dateValue.length > 0 && timeValue.length > 0,
    [title, dateValue, timeValue]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setDateValue("");
    setTimeValue(DEFAULT_TIME);
    setSelectedCategories([]);
    setImportance(3);
    setSubtasks(initialSubtasks);
    setShowCategoryInput(false);
    setManageCategories(false);
    setNewCategoryName("");
    setFocusSubtaskId(null);
  };

  const quickDates = useMemo(() => {
    const now = new Date();
    return QUICK_DATES.map((q) => ({
      ...q,
      value: toDateInput(addDays(now, q.offset)),
    }));
    // Recompute whenever the modal opens so "today" is never stale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

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
      deadline: new Date(`${dateValue}T${timeValue}`).toISOString(),
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

  const handleRemoveCategory = (category: string) => {
    const used = tasks.filter((t) => t.categories.includes(category)).length;
    const message = used
      ? `Remove "${category}"? It will also be taken off ${used} task${used === 1 ? "" : "s"}.`
      : `Remove "${category}"?`;
    if (!window.confirm(message)) return;
    removeCategory(category);
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
  };

  const addSubtaskAfter = (index: number) => {
    const next: Subtask = { id: crypto.randomUUID(), title: "", completed: false };
    setSubtasks((prev) => [...prev.slice(0, index + 1), next, ...prev.slice(index + 1)]);
    setFocusSubtaskId(next.id);
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
      onSubmit={handleSubmit}
      title={isEditing ? "Edit task" : "Add new task"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            <kbd className="rounded bg-zinc-100 px-1 py-0.5 font-sans dark:bg-white/10">
              Ctrl/⌘ ↵
            </kbd>{" "}
            to save
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
            <div className="flex gap-2">
              <input
                type="time"
                aria-label="Deadline time"
                className="w-28 shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
              />
              <input
                type="date"
                aria-label="Deadline date"
                className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setDateValue(q.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    dateValue === q.value
                      ? "bg-[#007AFF] text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
                Categories
              </label>
              <div className="flex items-center gap-1.5">
                {categories.length > 0 && (
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      manageCategories
                        ? "bg-red-500 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
                    }`}
                    onClick={() => setManageCategories((prev) => !prev)}
                  >
                    {manageCategories ? "Done" : "Edit"}
                  </button>
                )}
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
                  onClick={() => setShowCategoryInput(true)}
                  aria-label="Add category"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </button>
              </div>
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
              {categories.map((cat) =>
                manageCategories ? (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-400"
                    aria-label={`Remove category ${cat}`}
                  >
                    {cat}
                    <X className="h-3.5 w-3.5" weight="bold" />
                  </button>
                ) : (
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
                )
              )}
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
            min={0}
            max={10}
            step={0.5}
            value={importance}
            onChange={(event) => setImportance(Number(event.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>Low</span>
            <span className="font-semibold">{Number(importance.toFixed(1))}</span>
            <span>High</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Dragging a task to reorder it adjusts this for you.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
              Subtasks
            </label>
            <button
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
              type="button"
              onClick={() => addSubtaskAfter(subtasks.length - 1)}
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
                  autoFocus={subtask.id === focusSubtaskId}
                  onKeyDown={(event) => {
                    // Plain Enter adds the next subtask; Ctrl/⌘+Enter saves (handled by Modal)
                    if (event.key !== "Enter" || event.metaKey || event.ctrlKey) return;
                    if (event.nativeEvent.isComposing) return;
                    event.preventDefault();
                    if (subtask.title.trim()) addSubtaskAfter(index);
                  }}
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
