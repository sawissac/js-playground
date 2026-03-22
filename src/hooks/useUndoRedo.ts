import { useEffect, useState } from "react";
import { useAppDispatch } from "@/state/hooks";
import { store } from "@/state/store";
import { undo, redo, canUndo, canRedo } from "@/state/middleware/undoRedo";

export function useUndoRedo() {
  const dispatch = useAppDispatch();
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  const updateState = () => {
    setCanUndoState(canUndo());
    setCanRedoState(canRedo());
  };

  useEffect(() => {
    // Update state on mount
    updateState();

    // Update state on every Redux action
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, []);

  const handleUndo = () => {
    undo(store);
    updateState();
  };

  const handleRedo = () => {
    redo(store);
    updateState();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (cmdOrCtrl && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      } else if (cmdOrCtrl && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndoState,
    canRedo: canRedoState,
  };
}
