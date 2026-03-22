"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatShortcut, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  // Group shortcuts by category (inferred from description)
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    let category = "General";
    if (shortcut.description.toLowerCase().includes("variable")) category = "Variables";
    else if (shortcut.description.toLowerCase().includes("function")) category = "Functions";
    else if (shortcut.description.toLowerCase().includes("package")) category = "Packages";
    else if (shortcut.description.toLowerCase().includes("run") || shortcut.description.toLowerCase().includes("execute")) category = "Execution";
    else if (shortcut.description.toLowerCase().includes("save") || shortcut.description.toLowerCase().includes("export")) category = "File";
    else if (shortcut.description.toLowerCase().includes("search") || shortcut.description.toLowerCase().includes("find")) category = "Navigation";

    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                {category}
                <Badge variant="outline" className="text-[10px]">
                  {categoryShortcuts.length}
                </Badge>
              </h3>
              <div className="space-y-1.5">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-sm text-slate-700">
                      {shortcut.description}
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
