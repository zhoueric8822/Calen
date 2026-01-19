"use client";

import { X } from "@phosphor-icons/react";
import { ReactNode, useEffect, useRef, useState } from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const Modal = ({ isOpen, title, onClose, children, footer }: ModalProps) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  const handleDragStart = (clientY: number) => {
    startY.current = clientY;
    currentY.current = clientY;
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    currentY.current = clientY;
    const diff = clientY - startY.current;
    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Close if dragged down more than 100px
    if (dragY > 100) {
      onClose();
      // Reset after a short delay to allow animation to complete
      setTimeout(() => setDragY(0), 300);
    } else {
      setDragY(0);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div className="fixed w-full inset-x-0 bottom-0 flex items-end md:static md:flex md:h-full md:items-center md:justify-center md:p-4">
        <div
          className={`w-full md:max-w-xl bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl shadow-xl transform ${
            !isDragging ? "transition-transform duration-300 ease-out" : ""
          } animate-in slide-in-from-bottom`}
          style={{
            transform: `translateY(${dragY}px)`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Drag handle - mobile only */}
          <div
            className="md:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
            onTouchEnd={handleDragEnd}
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onMouseMove={(e) => {
              if (isDragging) handleDragMove(e.clientY);
            }}
            onMouseUp={handleDragEnd}
            onMouseLeave={() => {
              if (isDragging) handleDragEnd();
            }}
          >
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
          </div>

          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <button
              className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" weight="bold" />
            </button>
          </div>
          <div className="max-h-[70dvh] md:max-h-[75vh] overflow-y-auto px-6 py-5">
            {children}
          </div>
          {footer ? (
            <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

