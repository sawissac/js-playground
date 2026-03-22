"use client";

import { configureStore } from "@reduxjs/toolkit";
import editorReducer from "./slices/editorSlice";
import logReducer from "./slices/logSlice";
import { persistenceMiddleware } from "./middleware/persistence";
import { undoRedoMiddleware } from "./middleware/undoRedo";

// Configure the Redux store with our slices
export const store = configureStore({
  reducer: {
    editor: editorReducer,
    log: logReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(undoRedoMiddleware, persistenceMiddleware),
});

// Export useful types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
