import { persistenceService } from "@/lib/persistence";

let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 2000; // 2 seconds debounce

/**
 * Redux middleware that automatically saves editor state to IndexedDB
 * Debounces saves to avoid excessive writes
 */
export const persistenceMiddleware =
  (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    // Only persist editor state changes
    if (
      action.type &&
      typeof action.type === "string" &&
      action.type.startsWith("editor/")
    ) {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Debounce save
      saveTimeout = setTimeout(() => {
        const state = store.getState();
        persistenceService
          .saveState(state.editor)
          .catch((err) => console.error("Auto-save failed:", err));
      }, DEBOUNCE_MS);
    }

    return result;
  };
