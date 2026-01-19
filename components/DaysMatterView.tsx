"use client";

import { useMemo, useState } from "react";
import { differenceInDays, parseISO, format } from "date-fns";
import { CaretLeft, CaretRight, Trash, PencilSimple } from "@phosphor-icons/react";
import type { DaysMatterItem } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

type DaysMatterViewProps = {
  items: DaysMatterItem[];
};

export const DaysMatterView = ({ items }: DaysMatterViewProps) => {
  const openEditDaysMatter = useCalenStore((state) => state.openEditDaysMatter);
  const deleteDaysMatterItem = useCalenStore((state) => state.deleteDaysMatterItem);
  const openDeleteDaysMatterConfirm = useCalenStore((state) => state.openDeleteDaysMatterConfirm);
  const today = useMemo(() => new Date(), []);
  const [highlightIndex, setHighlightIndex] = useState(0);


  // Handle delete with shift+click support
  const handleDelete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    
    if (e.shiftKey) {
      // Shift + click = instant delete
      deleteDaysMatterItem(itemId);
    } else {
      // Normal click = show confirmation modal
      openDeleteDaysMatterConfirm(itemId);
    }
  };
  
  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left -> next
      setHighlightIndex((highlightIndex + 1) % items.length);
    }
    if (isRightSwipe) {
      // Swipe right -> previous
      setHighlightIndex((highlightIndex - 1 + items.length) % items.length);
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  const getDaysDisplay = (item: DaysMatterItem) => {
    const targetDate = parseISO(item.targetDate);
    const daysDiff = differenceInDays(targetDate, today);
    
    if (item.type === "countdown") {
      if (daysDiff === 0) return { number: 0, label: "Today!" };
      if (daysDiff < 0) return { number: Math.abs(daysDiff), label: "days ago" };
      return { number: daysDiff, label: daysDiff === 1 ? "day left" : "days left" };
    } else {
      const daysElapsed = -daysDiff;
      if (daysElapsed === 0) return { number: 0, label: "Today!" };
      if (daysElapsed < 0) return { number: Math.abs(daysElapsed), label: "days until" };
      return { number: daysElapsed, label: daysElapsed === 1 ? "day" : "days" };
    }
  };

  // Get the highlighted item
  const highlightedItem = items[highlightIndex] || items[0];
  const highlightedDisplay = highlightedItem ? getDaysDisplay(highlightedItem) : null;

  // Empty state
  if (items.length === 0) {
    return (
      <div className="mt-5 rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-zinc-900">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No events yet. Add one to start tracking important dates.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Layout: Side by side */}
      <div className="hidden lg:flex lg:gap-6 lg:h-[calc(100vh-260px)] lg:overflow-visible">
        {/* Left: Big Highlight Card - PINNED, NO SCROLL - CAROUSEL */}
        <div className="relative flex-1 shrink-0 overflow-hidden rounded-3xl">
          {/* Full-size background image */}
          {highlightedItem?.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${highlightedItem.imageUrl})` }}
            />
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br transition-all duration-500 ${
              highlightedItem?.type === "countdown" 
                ? "from-indigo-600 via-purple-600 to-pink-500" 
                : "from-rose-600 via-pink-600 to-orange-500"
            }`} />
          )}
          
          {/* Blur overlay ON TOP of image */}
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
          
          {/* Content */}
          {highlightedItem && highlightedDisplay && (
            <div className="relative flex h-full flex-col justify-end p-8">
              <span className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                highlightedItem.type === "countdown"
                  ? "bg-indigo-500/30 text-indigo-200"
                  : "bg-rose-500/30 text-rose-200"
              }`}>
                {highlightedItem.type === "countdown" ? "Countdown" : "Count Up"}
              </span>
              <h2 className="mt-3 text-4xl font-bold text-white">
                {highlightedItem.title}
              </h2>
              {highlightedItem.description && (
                <p className="mt-2 text-sm text-white/80 line-clamp-2">
                  {highlightedItem.description}
                </p>
              )}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-7xl font-black text-white">
                  {highlightedDisplay.number}
                </span>
                <span className="text-xl text-white/90">
                  {highlightedDisplay.label}
                </span>
              </div>
              <p className="mt-4 text-sm text-white/60">
                {format(parseISO(highlightedItem.targetDate), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          )}

          {/* Carousel Navigation Arrows - Desktop only */}
          {items.length > 1 && (
            <>
              <button
                onClick={() => setHighlightIndex((highlightIndex - 1 + items.length) % items.length)}
                className="absolute left-8 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition hover:bg-white/20"
              >
                <CaretLeft className="h-5 w-5" weight="bold" />
              </button>
              <button
                onClick={() => setHighlightIndex((highlightIndex + 1) % items.length)}
                className="absolute right-8 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition hover:bg-white/20"
              >
                <CaretRight className="h-5 w-5" weight="bold" />
              </button>
            </>
          )}

          {/* Navigation dots - Desktop */}
          {items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHighlightIndex(idx)}
                  className={`h-2 rounded-full transition ${
                    idx === highlightIndex 
                      ? "bg-white w-6" 
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Scrollable list ONLY */}
        <div className="w-72 flex flex-col shrink-0 overflow-visible lg:h-[calc(100vh-200px)]">
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-6 scrollbar-hide">
            {items.map((item, idx) => {
              const { number, label } = getDaysDisplay(item);
              const targetDate = parseISO(item.targetDate);
              const isActive = idx === highlightIndex;
              
              return (
                <div
                  key={item.id}
                  onClick={() => setHighlightIndex(idx)}
                  className={`group relative cursor-pointer overflow-hidden ml-0.5 rounded-3xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900 ${
                    isActive 
                      ? "bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 border border-zinc-300" 
                      : "border-zinc-100 dark:border-white/10"
                  }`}
                >
                  {/* Image on top - preserving aspect ratio */}
                  <div className="relative h-32 w-full overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className={`h-full w-full bg-linear-to-br ${
                        item.type === "countdown" 
                          ? "from-indigo-500 to-purple-500" 
                          : "from-rose-500 to-pink-500"
                      } flex items-center justify-center`}>
                        <span className="text-5xl font-black text-white/30">
                          {number}
                        </span>
                      </div>
                    )}
                    
                    {/* Countdown tag at bottom left of image */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md ${
                        item.type === "countdown"
                          ? "bg-indigo-500/20 text-white"
                          : "bg-rose-500/20 text-white"
                      }`}>
                        {item.type === "countdown" ? "Countdown" : "Count Up"}
                      </span>
                    </div>

                    {/* Action buttons at top right - glassmorphic, hover only */}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDaysMatter(item.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-600 shadow-lg transition hover:bg-white dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <PencilSimple className="h-3.5 w-3.5" weight="bold" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-red-500 shadow-lg transition hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800"
                      >
                        <Trash className="h-3.5 w-3.5" weight="bold" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Text content below - cleaner */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {format(targetDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                          {number}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-6">
        {/* Big Highlight - 50dvh, Full Width, Swipeable */}
        {items.length > 0 && highlightedItem && highlightedDisplay && (
          <div 
            className="relative -mx-1 overflow-hidden rounded-3xl touch-pan-y" 
            style={{ height: '78dvh' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Full-size background image */}
            {highlightedItem.imageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url(${highlightedItem.imageUrl})` }}
              />
            ) : (
              <div className={`absolute inset-0 bg-linear-to-br transition-all duration-500 ${
                highlightedItem.type === "countdown" 
                  ? "from-indigo-600 via-purple-600 to-pink-500" 
                  : "from-rose-600 via-pink-600 to-orange-500"
              }`} />
            )}
            
            {/* Blur overlay ON TOP of image */}
            <div className="absolute inset-0 backdrop-blur-lg bg-black/30" />
            
            {/* Content */}
            <div className="relative flex h-full flex-col justify-end p-6">
              <span className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                highlightedItem.type === "countdown"
                  ? "bg-indigo-500/30 text-indigo-200"
                  : "bg-rose-500/30 text-rose-200"
              }`}>
                {highlightedItem.type === "countdown" ? "Countdown" : "Count Up"}
              </span>
              <h2 className="mt-3 text-3xl font-bold text-white">
                {highlightedItem.title}
              </h2>
              {highlightedItem.description && (
                <p className="mt-2 text-sm text-white/80 line-clamp-2">
                  {highlightedItem.description}
                </p>
              )}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">
                  {highlightedDisplay.number}
                </span>
                <span className="text-lg text-white/90">
                  {highlightedDisplay.label}
                </span>
              </div>
              <p className="mt-3 text-xs text-white/60 mb-5">
                {format(parseISO(highlightedItem.targetDate), "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            {/* Navigation dots only - no arrows on mobile */}
            {items.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHighlightIndex(idx)}
                    className={`h-1.5 rounded-full transition ${
                      idx === highlightIndex 
                        ? "bg-white w-5" 
                        : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Events List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            All Events ({items.length})
          </h3>
          
          <div className="space-y-3">
            {items.map((item) => {
              const { number, label } = getDaysDisplay(item);
              const targetDate = parseISO(item.targetDate);
              
              return (
                <div
                  key={item.id}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
                  onClick={() => setHighlightIndex(items.indexOf(item))}
                >
                  {/* Image with preserved ratio */}
                  <div className="relative h-40 w-full overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className={`h-full w-full bg-linear-to-br ${
                        item.type === "countdown" 
                          ? "from-indigo-500 to-purple-500" 
                          : "from-rose-500 to-pink-500"
                      } flex items-center justify-center`}>
                        <span className="text-5xl font-black text-white/30">
                          {number}
                        </span>
                      </div>
                    )}
                    
                    {/* Countdown tag at bottom left of image */}
                    <div className="absolute bottom-3 left-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-sm ${
                        item.type === "countdown"
                          ? "bg-indigo-500/80 text-white"
                          : "bg-rose-500/80 text-white"
                      }`}>
                        {item.type === "countdown" ? "Countdown" : "Count Up"}
                      </span>
                    </div>

                    {/* Action buttons at top right - glassmorphic, hover only */}
                    <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDaysMatter(item.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-zinc-600 shadow-lg transition hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <PencilSimple className="h-4 w-4" weight="bold" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-red-500 shadow-lg transition hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800"
                      >
                        <Trash className="h-4 w-4" weight="bold" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Text content below - cleaner */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {format(targetDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                          {number}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
