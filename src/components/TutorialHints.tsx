"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { IconX, IconBulb, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export interface TutorialHint {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface TutorialHintsProps {
  hints: TutorialHint[];
  onDismiss?: (hintId: string) => void;
  position?: "top" | "bottom" | "floating";
  autoHide?: boolean;
  hideDelay?: number;
}

export function TutorialHints({
  hints,
  onDismiss,
  position = "bottom",
  autoHide = false,
  hideDelay = 5000,
}: TutorialHintsProps) {
  const [visibleHints, setVisibleHints] = useState<Set<string>>(
    new Set(hints.map((h) => h.id))
  );
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Auto-hide hints after delay
  useEffect(() => {
    if (autoHide && hints.length > 0) {
      const timer = setTimeout(() => {
        handleDismiss(hints[currentHintIndex].id);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, currentHintIndex, hints]);

  const handleDismiss = (hintId: string) => {
    setVisibleHints((prev) => {
      const newSet = new Set(prev);
      newSet.delete(hintId);
      return newSet;
    });
    onDismiss?.(hintId);

    // Move to next hint
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const displayedHints = hints.filter((hint) => visibleHints.has(hint.id));

  if (displayedHints.length === 0) return null;

  const currentHint = displayedHints[currentHintIndex];
  if (!currentHint) return null;

  const positionClasses = {
    top: "top-4",
    bottom: "bottom-4",
    floating: "top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300",
        positionClasses[position]
      )}
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-2xl border border-blue-400/20 max-w-md">
        <div className="p-4 pr-12 relative">
          {/* Dismiss button */}
          {currentHint.dismissible !== false && (
            <button
              onClick={() => handleDismiss(currentHint.id)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <IconX size={16} />
            </button>
          )}

          {/* Icon */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-white/20 rounded-lg">
              <IconBulb size={20} />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{currentHint.title}</h3>
              <p className="text-xs text-white/90 leading-relaxed">
                {currentHint.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {currentHint.action && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={currentHint.action.onClick}
                  >
                    {currentHint.action.label}
                  </Button>
                )}

                {currentHintIndex < displayedHints.length - 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-white hover:bg-white/20"
                    onClick={handleNext}
                  >
                    Next
                    <IconChevronRight size={14} className="ml-1" />
                  </Button>
                )}

                {/* Progress indicator */}
                {displayedHints.length > 1 && (
                  <div className="ml-auto flex items-center gap-1">
                    {displayedHints.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          index === currentHintIndex
                            ? "bg-white w-4"
                            : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing tutorial hints with localStorage persistence
 */
export function useTutorialHints(storageKey: string = "js-playground-hints") {
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  // Load dismissed hints from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setDismissedHints(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load dismissed hints:", error);
    }
  }, [storageKey]);

  const dismissHint = (hintId: string) => {
    setDismissedHints((prev) => {
      const newSet = new Set(prev);
      newSet.add(hintId);
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error("Failed to save dismissed hints:", error);
      }
      
      return newSet;
    });
  };

  const resetHints = () => {
    setDismissedHints(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to reset hints:", error);
    }
  };

  const isHintDismissed = (hintId: string) => dismissedHints.has(hintId);

  return {
    dismissedHints,
    dismissHint,
    resetHints,
    isHintDismissed,
  };
}
