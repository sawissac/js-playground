"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts({
  shortcuts,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Find matching shortcut
      const matchedShortcut = shortcuts.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : true;

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
      });

      if (matchedShortcut) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        matchedShortcut.handler();
      }
    },
    [shortcuts, preventDefault]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) parts.push("⇧");
  if (shortcut.alt) parts.push(typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌥" : "Alt");

  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
}

/**
 * Get platform-specific modifier key symbol
 */
export function getModifierKey(): string {
  if (typeof navigator !== "undefined" && navigator.platform.includes("Mac")) {
    return "⌘";
  }
  return "Ctrl";
}
