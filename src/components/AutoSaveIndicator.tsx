"use client";

import { useAutoSave } from "@/hooks/useAutoSave";
import { IconCheck, IconClock } from "@tabler/icons-react";

export function AutoSaveIndicator() {
  const { lastSaved, isSaving } = useAutoSave();

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!lastSaved && !isSaving) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      {isSaving ? (
        <>
          <IconClock size={12} className="animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <IconCheck size={12} className="text-green-600" />
          <span>Saved {lastSaved ? formatTime(lastSaved) : ""}</span>
        </>
      )}
    </div>
  );
}
