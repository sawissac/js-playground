"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { EditorState, FunctionActionInterface, Runner } from "../types";
import { DataTypes } from "@/constants/dataTypes";

// Define the initial state for the editor
const initialState: EditorState = {
  variables: [],
  dataTypes: [...DataTypes],
  functions: [],
  runner: [],
};

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setVariables: (
      state,
      action: PayloadAction<
        { id: string; name: string; type: string; value: any }[]
      >,
    ) => {
      state.variables = action.payload;
    },

    addVariable: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
      }>,
    ) => {
      state.variables.push({
        id: action.payload.id,
        name: action.payload.name,
        type: "string",
        value: "",
      });
    },

    removeVariable: (state, action: PayloadAction<string>) => {
      state.variables = state.variables.filter(
        (variable) => variable.id !== action.payload,
      );
    },

    updateVariable: (
      state,
      action: PayloadAction<{
        id: string;
        newName: string;
      }>,
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.id === action.payload.id
          ? { ...variable, name: action.payload.newName }
          : variable,
      );
    },

    updateVariableValue: (
      state,
      action: PayloadAction<{
        id: string;
        value: string | string[];
      }>,
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.id === action.payload.id
          ? { ...variable, value: action.payload.value }
          : variable,
      );
    },

    updateDataType: (
      state,
      action: PayloadAction<{
        id: string;
        type: string;
      }>,
    ) => {
      state.variables = state.variables.map((variable) =>
        variable.id === action.payload.id
          ? { ...variable, type: action.payload.type }
          : variable,
      );
    },

    addFunctionName: (state, action: PayloadAction<string>) => {
      const tempActionId = uuidv4();
      const useActionId = uuidv4();

      state.functions.push({
        id: uuidv4(),
        name: action.payload,
        dataType: "",
        actions: [
          {
            id: tempActionId,
            name: "temp",
            dataType: "",
            value: ["@arg1"],
          },
          {
            id: useActionId,
            name: "use",
            dataType: "",
            value: ["@temp1"],
          },
        ],
      });
    },

    updateFunctionName: (
      state,
      action: PayloadAction<{
        id: string;
        newName: string;
      }>,
    ) => {
      state.functions = state.functions.map((func) =>
        func.id === action.payload.id
          ? { ...func, name: action.payload.newName }
          : func,
      );
    },

    removeFunctionName: (state, action: PayloadAction<string>) => {
      state.functions = state.functions.filter(
        (func) => func.id !== action.payload,
      );
    },

    addFunctionAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        action: FunctionActionInterface;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const actionWithId = { ...action.payload.action, id: uuidv4() };
        func.actions.push(actionWithId);
      }
    },

    updateFunctionAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        actionId: string;
        action: FunctionActionInterface;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const actionIndex = func.actions.findIndex(
          (a) => a.id === action.payload.actionId,
        );
        if (actionIndex !== -1) {
          func.dataType =
            func.actions?.at(func.actions.length - 1)?.dataType ?? "";
          func.actions[actionIndex] = {
            ...action.payload.action,
            id: action.payload.actionId,
          };
        }
      }
    },

    removeFunctionAction: (
      state,
      action: PayloadAction<{ functionId: string; actionId: string }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        func.actions = func.actions.filter(
          (a) => a.id !== action.payload.actionId,
        );
      }
    },

    createSetRunner: (state) => {
      state.runner.push({
        id: uuidv4(),
        type: "set",
        target: ["", ""],
        args: [],
      });
    },

    createCallRunner: (state) => {
      state.runner.push({
        id: uuidv4(),
        type: "call",
        target: ["", ""],
        args: [],
      });
    },

    updateRunner: (
      state,
      action: PayloadAction<{ runnerId: string; runner: Runner }>,
    ) => {
      const runnerIndex = state.runner.findIndex(
        (r) => r.id === action.payload.runnerId,
      );
      if (runnerIndex !== -1) {
        state.runner[runnerIndex] = {
          ...action.payload.runner,
          id: action.payload.runnerId,
        };
      }
    },

    removeRunner: (state, action: PayloadAction<string>) => {
      state.runner = state.runner.filter(
        (runner) => runner.id !== action.payload,
      );
    },

    addWhenSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        whenActionId: string;
        subAction: FunctionActionInterface;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const whenAct = func.actions.find(
          (a) => a.id === action.payload.whenActionId,
        );
        if (whenAct) {
          if (!whenAct.subActions) whenAct.subActions = [];
          whenAct.subActions.push({
            ...action.payload.subAction,
            id: uuidv4(),
          });
        }
      }
    },

    removeWhenSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        whenActionId: string;
        subActionId: string;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const whenAct = func.actions.find(
          (a) => a.id === action.payload.whenActionId,
        );
        if (whenAct?.subActions) {
          whenAct.subActions = whenAct.subActions.filter(
            (sa) => sa.id !== action.payload.subActionId,
          );
        }
      }
    },

    updateWhenSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        whenActionId: string;
        subActionId: string;
        subAction: FunctionActionInterface;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const whenAct = func.actions.find(
          (a) => a.id === action.payload.whenActionId,
        );
        if (whenAct?.subActions) {
          const idx = whenAct.subActions.findIndex(
            (sa) => sa.id === action.payload.subActionId,
          );
          if (idx !== -1) {
            whenAct.subActions[idx] = {
              ...action.payload.subAction,
              id: action.payload.subActionId,
            };
          }
        }
      }
    },

    reorderWhenSubActions: (
      state,
      action: PayloadAction<{
        functionId: string;
        whenActionId: string;
        fromIndex: number;
        toIndex: number;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const whenAct = func.actions.find(
          (a) => a.id === action.payload.whenActionId,
        );
        if (whenAct?.subActions) {
          const { fromIndex, toIndex } = action.payload;
          const [moved] = whenAct.subActions.splice(fromIndex, 1);
          whenAct.subActions.splice(toIndex, 0, moved);
        }
      }
    },

    reorderFunctionActions: (
      state,
      action: PayloadAction<{
        functionId: string;
        fromIndex: number;
        toIndex: number;
      }>,
    ) => {
      const func = state.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const { fromIndex, toIndex } = action.payload;
        const [movedAction] = func.actions.splice(fromIndex, 1);
        func.actions.splice(toIndex, 0, movedAction);
        func.dataType =
          func.actions?.at(func.actions.length - 1)?.dataType ?? "";
      }
    },

    reorderRunnerSteps: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>,
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const [movedRunner] = state.runner.splice(fromIndex, 1);
      state.runner.splice(toIndex, 0, movedRunner);
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
  addWhenSubAction,
  removeWhenSubAction,
  updateWhenSubAction,
  reorderWhenSubActions,
  reorderFunctionActions,
  createSetRunner,
  createCallRunner,
  updateRunner,
  removeRunner,
  reorderRunnerSteps,
} = editorSlice.actions;

// Export the reducer
export default editorSlice.reducer;
