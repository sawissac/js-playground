"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorState, FunctionAction } from "../types";

// Define the initial state for the editor
const initialState: EditorState = {
  variables: [],
  dataTypes: ["string", "array", "boolean"],
  functions: [],
};

// Create the editor slice
export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
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

    addFunctionName: (state, action: PayloadAction<string>) => {
      state.functions.push({ name: action.payload, type: "", actions: [] });
    },

    updateFunctionName: (
      state,
      action: PayloadAction<{
        oldFunctionName: string;
        newFunctionName: string;
      }>
    ) => {
      state.functions = state.functions.map((func) =>
        func.name === action.payload.oldFunctionName
          ? { ...func, name: action.payload.newFunctionName }
          : func
      );
    },

    removeFunctionName: (state, action: PayloadAction<string>) => {
      state.functions = state.functions.filter(
        (func) => func.name !== action.payload
      );
    },

    addFunctionAction: (
      state,
      action: PayloadAction<{ functionName: string; action: FunctionAction }>
    ) => {
      const func = state.functions.find(
        (f) => f.name === action.payload.functionName
      );
      if (func) {
        func.actions.push(action.payload.action);
      }
    },

    updateFunctionAction: (
      state,
      action: PayloadAction<{
        functionName: string;
        actionIndex: number;
        action: FunctionAction;
      }>
    ) => {
      const func = state.functions.find(
        (f) => f.name === action.payload.functionName
      );
      if (func && func.actions[action.payload.actionIndex]) {
        func.actions[action.payload.actionIndex] = action.payload.action;
      }
    },

    removeFunctionAction: (
      state,
      action: PayloadAction<{ functionName: string; actionIndex: number }>
    ) => {
      const func = state.functions.find(
        (f) => f.name === action.payload.functionName
      );
      if (func) {
        func.actions.splice(action.payload.actionIndex, 1);
      }
    },
  },
});

export const {
  setVariables,
  addVariable,
  removeVariable,
  updateVariable,
  updateDataType,
  addFunctionName,
  removeFunctionName,
  updateFunctionName,
  addFunctionAction,
  updateFunctionAction,
  removeFunctionAction,
} = editorSlice.actions;

// Export the reducer
export default editorSlice.reducer;
