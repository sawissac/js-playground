"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorState, FunctionActionInterface, Runner } from "../types";

// Define the initial state for the editor
const initialState: EditorState = {
  variables: [],
  dataTypes: ["string"],
  functions: [],
  runner: [],
};

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

    updateVariableValue: (
      state,
      action: PayloadAction<{
        name: string;
        value: string;
      }>
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.name === action.payload.name
          ? { ...variable, value: action.payload.value }
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
      state.functions.push({ name: action.payload, dataType: "", actions: [] });
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
      action: PayloadAction<{
        functionName: string;
        action: FunctionActionInterface;
      }>
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
        action: FunctionActionInterface;
      }>
    ) => {
      const func = state.functions.find(
        (f) => f.name === action.payload.functionName
      );
      if (func && func.actions[action.payload.actionIndex]) {
        (func.dataType =
          func.actions?.at(func.actions.length - 1)?.dataType ?? ""),
          (func.actions[action.payload.actionIndex] = action.payload.action);
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

    createSetRunner: (state) => {
      state.runner.push({ type: "set", target: ["", ""] });
    },

    createCallRunner: (state) => {
      state.runner.push({ type: "call", target: ["", ""] });
    },

    updateRunner: (
      state,
      action: PayloadAction<{ runnerIndex: number; target: [string, string] }>
    ) => {
      state.runner = state.runner.map((runner, index) =>
        index === action.payload.runnerIndex
          ? { ...runner, target: action.payload.target }
          : runner
      );
    },

    removeRunner: (state, action: PayloadAction<number>) => {
      state.runner.splice(action.payload, 1);
    },
  },
});

export const {
  setVariables,
  addVariable,
  removeVariable,
  updateVariable,
  updateVariableValue,
  updateDataType,
  addFunctionName,
  removeFunctionName,
  updateFunctionName,
  addFunctionAction,
  updateFunctionAction,
  removeFunctionAction,
  createSetRunner,
  createCallRunner,
  updateRunner,
  removeRunner,
} = editorSlice.actions;

// Export the reducer
export default editorSlice.reducer;
