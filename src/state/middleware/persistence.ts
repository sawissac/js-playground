import { persistenceService } from "@/lib/persistence";
import {
  canvasRunnerPersistenceService,
  canvasLayoutPersistenceService,
} from "@/lib/canvasRunnerPersistence";

let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 2000;

// Track which stores have pending saves independently.
// This prevents a race where a later action clears a flag set by an earlier
// action that was a different store type.
let pendingEditor = false;
let pendingCanvas = false;
let pendingCanvasRunner = false;

/**
 * Redux middleware that automatically saves editor + canvas layout + canvasRunner
 * state to IndexedDB. Debounces saves to avoid excessive writes.
 *
 * Each store's dirty flag is tracked separately so that rapid interleaving of
 * different action types never drops a save.
 */
export const persistenceMiddleware =
  (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    if (!action.type || typeof action.type !== "string") return result;

    // Mark which stores are dirty — never clear a flag until it's actually saved
    if (action.type.startsWith("editor/")) pendingEditor = true;
    if (action.type.startsWith("canvas/")) pendingCanvas = true;
    if (action.type.startsWith("canvasRunner/")) pendingCanvasRunner = true;

    if (pendingEditor || pendingCanvas || pendingCanvasRunner) {
      if (saveTimeout) clearTimeout(saveTimeout);

      saveTimeout = setTimeout(() => {
        const state = store.getState();

        if (pendingEditor) {
          pendingEditor = false;
          persistenceService
            .saveState(state.editor)
            .catch((err: unknown) =>
              console.error("Auto-save (editor) failed:", err)
            );
        }

        if (pendingCanvas) {
          pendingCanvas = false;
          canvasLayoutPersistenceService
            .saveState(state.canvas)
            .catch((err: unknown) =>
              console.error("Auto-save (canvas layout) failed:", err)
            );
        }

        if (pendingCanvasRunner) {
          pendingCanvasRunner = false;
          canvasRunnerPersistenceService
            .saveState(state.canvasRunner)
            .catch((err: unknown) =>
              console.error("Auto-save (canvasRunner) failed:", err)
            );
        }
      }, DEBOUNCE_MS);
    }

    return result;
  };
