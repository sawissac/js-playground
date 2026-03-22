import { EditorState } from "../types";

export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

const MAX_HISTORY = 50;

// Actions to ignore (don't add to history)
const IGNORED_ACTIONS = [
  "editor/importProject",
  "editor/importState",
  "editor/resetState",
];

export const undoRedoMiddleware = (store: any) => (next: any) => (action: any) => {
  const prevState = store.getState().editor;
  const result = next(action);

  // Only track editor actions
  if (
    action.type &&
    typeof action.type === "string" &&
    action.type.startsWith("editor/") &&
    !IGNORED_ACTIONS.includes(action.type) &&
    action.type !== "editor/@@UNDO" &&
    action.type !== "editor/@@REDO"
  ) {
    const newState = store.getState().editor;

    // Check if state actually changed
    if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
      const history = (window as any).__editorHistory__ || {
        past: [],
        present: prevState,
        future: [],
      };

      // Add to history
      const newPast = [...history.past, history.present].slice(-MAX_HISTORY);
      (window as any).__editorHistory__ = {
        past: newPast,
        present: newState,
        future: [], // Clear future on new action
      };
    }
  }

  return result;
};

export function undo(store: any) {
  const history = (window as any).__editorHistory__;
  if (!history || history.past.length === 0) return;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  (window as any).__editorHistory__ = {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };

  // Import the previous state
  const { importProject } = require("../slices/editorSlice");
  store.dispatch(importProject(previous));
}

export function redo(store: any) {
  const history = (window as any).__editorHistory__;
  if (!history || history.future.length === 0) return;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  (window as any).__editorHistory__ = {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };

  // Import the next state
  const { importProject } = require("../slices/editorSlice");
  store.dispatch(importProject(next));
}

export function canUndo(): boolean {
  const history = (window as any).__editorHistory__;
  return history && history.past.length > 0;
}

export function canRedo(): boolean {
  const history = (window as any).__editorHistory__;
  return history && history.future.length > 0;
}
