"use client";

import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { persistenceService } from "@/lib/persistence";
import {
  canvasRunnerPersistenceService,
  canvasLayoutPersistenceService,
} from "@/lib/canvasRunnerPersistence";
import { importProject } from "./slices/editorSlice";
import { hydrateCanvas } from "./slices/canvasSlice";
import { hydrateCanvasRunner } from "./slices/canvasRunnerSlice";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Restore all three slices from IndexedDB on mount
    Promise.allSettled([
      persistenceService.loadState(),           // editor state
      canvasLayoutPersistenceService.loadState(), // canvas nodes/edges layout
      canvasRunnerPersistenceService.loadState(), // canvas runner (CDN, steps)
    ]).then(([editorResult, canvasLayoutResult, canvasRunnerResult]) => {
      // 1. Restore editor state
      if (editorResult.status === "fulfilled" && editorResult.value) {
        store.dispatch(importProject(editorResult.value));
      }

      // 2. Restore canvas layout (nodes, edges, positions)
      if (canvasLayoutResult.status === "fulfilled" && canvasLayoutResult.value) {
        store.dispatch(hydrateCanvas(canvasLayoutResult.value));
      }

      // 3. Restore canvas runner config (per-renderer CDN, steps)
      if (canvasRunnerResult.status === "fulfilled" && canvasRunnerResult.value) {
        store.dispatch(hydrateCanvasRunner(canvasRunnerResult.value));
      }

      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <Provider store={store}>{children}</Provider>;
};
