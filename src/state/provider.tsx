"use client";

import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { persistenceService } from "@/lib/persistence";
import { importProject } from "./slices/editorSlice";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Restore state from IndexedDB on mount
    persistenceService
      .loadState()
      .then((savedState) => {
        if (savedState) {
          store.dispatch(importProject(savedState));
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to restore state:", err);
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
