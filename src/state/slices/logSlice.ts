"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LogState } from "../types";

const initialState: LogState = {
  logs: [],
};

export const logSlice = createSlice({
  name: "log",
  initialState,
  reducers: {
    addLog: (
      state,
      action: PayloadAction<{
        type: "error" | "warning" | "info";
        message: string;
        context?: string;
      }>
    ) => {
      state.logs.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    removeLog: (state, action: PayloadAction<number>) => {
      state.logs.splice(action.payload, 1);
    },
  },
});

export const { addLog, clearLogs, removeLog } = logSlice.actions;
export default logSlice.reducer;
