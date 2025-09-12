"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorState } from "../types";

// Define the initial state for the editor
const initialState: EditorState = {
  variables: [],
  dataTypes: ["string", "array", "boolean"],
};

// Create the editor slice
export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // Update the content in the editor
    setVariables: (
      state,
      action: PayloadAction<{ name: string; type: string; value: any }[]>
    ) => {
      state.variables = action.payload;
    },
    addVariable: (state, action: PayloadAction<string>) => {
      state.variables.push({ name: action.payload, type: "", value: "" });
    },
    removeVariable: (state, action: PayloadAction<string>) => {
      state.variables = state.variables.filter(
        (variable) => variable.name !== action.payload
      );
    },
    updateVariable: (
      state,
      action: PayloadAction<{
        oldVariable: string;
        newVariable: string;
      }>
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.name === action.payload.oldVariable
          ? { ...variable, name: action.payload.newVariable }
          : variable
      );
    },
    addDataType: (state, action: PayloadAction<string>) => {
      state.variables.push({ name: action.payload, type: "", value: "" });
    },

    updateDataType: (
      state,
      action: PayloadAction<{
        name: string;
        type: string;
      }>
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.name === action.payload.name
          ? { ...variable, type: action.payload.type }
          : variable
      );
    },
  },
});

// Export the actions
export const {
  setVariables,
  addVariable,
  removeVariable,
  updateVariable,
  addDataType,
  updateDataType,
} = editorSlice.actions;

// Export the reducer
export default editorSlice.reducer;
