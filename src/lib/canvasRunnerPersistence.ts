import localforage from "localforage";
import type { CanvasRunnerState } from "@/state/slices/canvasRunnerSlice";
import type { CanvasState } from "@/state/slices/canvasSlice";

const CANVAS_RUNNER_STORAGE_KEY = "js-playground-canvas-runner-state";
const CANVAS_LAYOUT_STORAGE_KEY = "js-playground-canvas-layout-state";

// ── Canvas Runner store (per-renderer CDN + run config) ──────────────────────
const canvasRunnerStore = localforage.createInstance({
  name: "js-playground",
  storeName: "canvas_runner_state",
  description: "Obit canvas runner persistence",
});

export const canvasRunnerPersistenceService = {
  async saveState(state: CanvasRunnerState): Promise<void> {
    try {
      await canvasRunnerStore.setItem(CANVAS_RUNNER_STORAGE_KEY, {
        state,
        timestamp: Date.now(),
        version: "1.0",
      });
    } catch (error) {
      console.error("Failed to save canvas runner state:", error);
      throw error;
    }
  },

  async loadState(): Promise<CanvasRunnerState | null> {
    try {
      const data = await canvasRunnerStore.getItem<{
        state: CanvasRunnerState;
        timestamp: number;
        version: string;
      }>(CANVAS_RUNNER_STORAGE_KEY);
      if (!data) return null;
      return data.state;
    } catch (error) {
      console.error("Failed to load canvas runner state:", error);
      return null;
    }
  },

  async clearState(): Promise<void> {
    try {
      await canvasRunnerStore.removeItem(CANVAS_RUNNER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear canvas runner state:", error);
      throw error;
    }
  },

  async getLastSavedTimestamp(): Promise<number | null> {
    try {
      const data = await canvasRunnerStore.getItem<{
        state: CanvasRunnerState;
        timestamp: number;
        version: string;
      }>(CANVAS_RUNNER_STORAGE_KEY);
      return data?.timestamp ?? null;
    } catch {
      return null;
    }
  },
};

// ── Canvas Layout store (nodes, edges, positions) ─────────────────────────────
const canvasLayoutStore = localforage.createInstance({
  name: "js-playground",
  storeName: "canvas_layout_state",
  description: "Obit canvas node/edge layout persistence",
});

export const canvasLayoutPersistenceService = {
  /**
   * Save the full canvasSlice state (nodes, edges, counts) to IndexedDB.
   */
  async saveState(state: CanvasState): Promise<void> {
    try {
      await canvasLayoutStore.setItem(CANVAS_LAYOUT_STORAGE_KEY, {
        state,
        timestamp: Date.now(),
        version: "1.0",
      });
    } catch (error) {
      console.error("Failed to save canvas layout:", error);
      throw error;
    }
  },

  /**
   * Load canvasSlice state from IndexedDB.
   */
  async loadState(): Promise<CanvasState | null> {
    try {
      const data = await canvasLayoutStore.getItem<{
        state: CanvasState;
        timestamp: number;
        version: string;
      }>(CANVAS_LAYOUT_STORAGE_KEY);
      if (!data) return null;
      return data.state;
    } catch (error) {
      console.error("Failed to load canvas layout:", error);
      return null;
    }
  },

  async clearState(): Promise<void> {
    try {
      await canvasLayoutStore.removeItem(CANVAS_LAYOUT_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear canvas layout:", error);
      throw error;
    }
  },
};

