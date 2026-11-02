"use client";

import { ArrowCounterClockwise, Pause, Play } from "@phosphor-icons/react";
import { useState } from "react";

import { getDaysPaused } from "@/lib/daysMatter";
import type { DaysMatterItem } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

type CountupControlsProps = {
  item: DaysMatterItem;
  /** "hero" sits on a dark photo/gradient, "card" sits on a normal card. */
  variant: "hero" | "card";
};

/**
 * Pause / restart controls for a count-up. Pausing freezes the number at the
 * current day. Restarting asks how long the break was (defaults to the real
 * time paused, but can be anything) and removes that from the count.
 */
export const CountupControls = ({ item, variant }: CountupControlsProps) => {
  const updateDaysMatterItem = useCalenStore((s) => s.updateDaysMatterItem);
  const [restarting, setRestarting] = useState(false);
  const [breakInput, setBreakInput] = useState("0");

  if (item.type !== "countup") return null;

  const paused = !!item.pausedAt;
  const hero = variant === "hero";

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const pause = () =>
    updateDaysMatterItem(item.id, { pausedAt: new Date().toISOString() });

  const openRestart = () => {
    setBreakInput(String(getDaysPaused(item)));
    setRestarting(true);
  };

  const resume = () => {
    const parsed = Math.max(0, Math.round(Number(breakInput) || 0));
    updateDaysMatterItem(item.id, {
      pausedAt: undefined,
      breakDays: (item.breakDays ?? 0) + parsed,
    });
    setRestarting(false);
  };

  const startOver = () => {
    updateDaysMatterItem(item.id, {
      targetDate: new Date().toISOString(),
      pausedAt: undefined,
      breakDays: undefined,
    });
    setRestarting(false);
  };

  const pill = hero
    ? "bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20";

  if (restarting) {
    return (
      <div
        onClick={stop}
        onTouchStart={stop}
        onTouchEnd={stop}
        className={`mt-3 w-fit space-y-2 rounded-2xl p-3 text-xs ${
          hero
            ? "bg-black/40 text-white backdrop-blur-md"
            : "bg-zinc-50 text-zinc-600 dark:bg-white/5 dark:text-zinc-300"
        }`}
      >
        <label className="flex items-center gap-2 font-semibold">
          Break length
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={breakInput}
            onChange={(e) => setBreakInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") resume();
              if (e.key === "Escape") setRestarting(false);
            }}
            autoFocus
            className={`w-16 rounded-lg border px-2 py-1 text-sm outline-none ${
              hero
                ? "border-white/30 bg-white/10 text-white"
                : "border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
            }`}
          />
          days
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-[#007AFF] px-3 py-1.5 font-semibold text-white hover:bg-[#0066d6]"
            onClick={resume}
          >
            Resume
          </button>
          <button
            className={`rounded-full px-3 py-1.5 font-semibold ${pill}`}
            onClick={startOver}
          >
            Start over from 0
          </button>
          <button
            className={`rounded-full px-3 py-1.5 font-semibold ${pill}`}
            onClick={() => setRestarting(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex" onClick={stop} onTouchStart={stop} onTouchEnd={stop}>
      {paused ? (
        <button
          onClick={openRestart}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${pill}`}
        >
          <ArrowCounterClockwise className="h-3.5 w-3.5" weight="bold" />
          Restart
        </button>
      ) : (
        <button
          onClick={pause}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${pill}`}
        >
          <Pause className="h-3.5 w-3.5" weight="fill" />
          Pause
        </button>
      )}
      {paused && !hero ? (
        <span className="ml-2 flex items-center gap-1 text-xs text-zinc-400">
          <Play className="h-3 w-3" weight="fill" /> stopped
        </span>
      ) : null}
    </div>
  );
};
