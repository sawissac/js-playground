import { useEffect, useState } from "react";
import { persistenceService } from "@/lib/persistence";

export function useAutoSave() {
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial timestamp
    persistenceService.getLastSavedTimestamp().then(setLastSaved);

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      persistenceService.getLastSavedTimestamp().then(setLastSaved);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const manualSave = async () => {
    setIsSaving(true);
    // Trigger will be handled by middleware
    const timestamp = await persistenceService.getLastSavedTimestamp();
    setLastSaved(timestamp);
    setIsSaving(false);
  };

  return {
    lastSaved,
    isSaving,
    manualSave,
  };
}
