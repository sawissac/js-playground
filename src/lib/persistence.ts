import localforage from "localforage";
import { EditorState } from "@/state/types";

const STORAGE_KEY = "js-playground-state";
const AUTO_SAVE_INTERVAL = 3000; // 3 seconds

// Configure localforage
localforage.config({
  name: "js-playground",
  storeName: "editor_state",
  description: "JS Playground editor state persistence",
});

export const persistenceService = {
  /**
   * Save editor state to IndexedDB
   */
  async saveState(state: EditorState): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEY, {
        state,
        timestamp: Date.now(),
        version: "1.0",
      });
    } catch (error) {
      console.error("Failed to save state:", error);
      throw error;
    }
  },

  /**
   * Load editor state from IndexedDB
   */
  async loadState(): Promise<EditorState | null> {
    try {
      const data = await localforage.getItem<{
        state: EditorState;
        timestamp: number;
        version: string;
      }>(STORAGE_KEY);

      if (!data) return null;

      return data.state;
    } catch (error) {
      console.error("Failed to load state:", error);
      return null;
    }
  },

  /**
   * Get last saved timestamp
   */
  async getLastSavedTimestamp(): Promise<number | null> {
    try {
      const data = await localforage.getItem<{
        state: EditorState;
        timestamp: number;
        version: string;
      }>(STORAGE_KEY);

      return data?.timestamp ?? null;
    } catch (error) {
      console.error("Failed to get timestamp:", error);
      return null;
    }
  },

  /**
   * Clear saved state
   */
  async clearState(): Promise<void> {
    try {
      await localforage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear state:", error);
      throw error;
    }
  },

  /**
   * Check if saved state exists
   */
  async hasSavedState(): Promise<boolean> {
    try {
      const state = await this.loadState();
      return state !== null;
    } catch (error) {
      return false;
    }
  },
};

export const AUTO_SAVE_DEBOUNCE = AUTO_SAVE_INTERVAL;
