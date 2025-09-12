"use client";

import { configureStore } from "@reduxjs/toolkit";
import editorReducer from "./slices/editorSlice";

// Configure the Redux store with our slices
export const store = configureStore({
  reducer: {
    editor: editorReducer,
    // Add other reducers here as needed
  },
});

// Export useful types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
