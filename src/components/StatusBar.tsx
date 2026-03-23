"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconSearch,
  IconBug,
  IconKeyboard,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface StatusBarShortcut {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
}

interface StatusBarProps {
  shortcuts: StatusBarShortcut[];
  className?: string;
}

export const StatusBar = ({ shortcuts, className }: StatusBarProps) => {
  const getModKey = () => {
    if (typeof navigator !== "undefined" && navigator.platform?.includes("Mac")) {
      return "⌘";
    }
    return "Ctrl";
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-1.5 bg-slate-800 text-slate-200 text-xs border-t border-slate-700 shrink-0",
        className
      )}
    >
      {/* Left side - shortcuts */}
      <div className="flex items-center gap-2">
        {shortcuts.map((shortcut, index) => (
          <Button
            key={index}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            onClick={shortcut.onClick}
          >
            {shortcut.icon}
            <span className="hidden md:inline">{shortcut.label}</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-700 border border-slate-600 rounded">
              {getModKey()}+{shortcut.shortcut}
            </kbd>
          </Button>
        ))}
      </div>

      {/* Right side - info */}
      <div className="flex items-center gap-4 text-slate-400">
        <span className="text-[10px] font-mono">JS Playground</span>
      </div>
    </div>
  );
};
