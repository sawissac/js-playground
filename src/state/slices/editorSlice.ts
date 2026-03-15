"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import {
  CodeSnippetInterface,
  EditorState,
  FunctionActionInterface,
  Runner,
  Package,
} from "../types";
import { DataTypes } from "@/constants/dataTypes";

const initialPackageId = "466f7e20-1465-45ae-a93b-30da6a6a54f1-pkg";

const initialState: EditorState = {
  projectId: uuidv4(),
  projectName: "My Project",
  activePackageId: initialPackageId,
  dataTypes: [...DataTypes],
  packages: [
    {
      id: initialPackageId,
      name: "Main Package",
      variables: [
        {
          id: "466f7e20-1465-45ae-a93b-30da6a6a54f1",
          name: "v1",
          type: "string",
          value: "Hello World",
        },
        {
          id: "47d03f92-04dd-4274-b763-607051c35b4a",
          name: "v2",
          type: "string",
          value: "Hello World",
        },
      ],
      functions: [
        {
          id: "ec1b11ec-0552-414c-967b-388c2c3a1ce1",
          name: "t1",
          dataType: "",
          actions: [
            {
              id: "f459b781-70d4-42ff-bd28-5ca45399cc13",
              name: "temp",
              dataType: "string",
              value: ["@arg1"],
            },
            {
              id: "a10aceab-5e44-43e9-9c0a-50e655cd0a91",
              name: "use",
              dataType: "string",
              value: ["@temp1"],
            },
            {
              id: "e81c37ee-a78c-45cd-9f1c-85002336c6e8",
              name: "code",
              dataType: "string",
              value: ["return @this;\n"],
            },
          ],
        },
      ],
      runner: [
        {
          id: "0f110169-55df-4840-8906-cbf7309380b2",
          type: "set",
          target: ["v1", "Hello World"],
          args: [],
        },
        {
          id: "f0ba02dd-e170-4367-b78e-ba14073e9e84",
          type: "call",
          target: ["v2", "t1"],
          args: ["v1"],
        },
      ],
      codeSnippets: [],
    },
  ],
};

const getActivePkg = (state: EditorState) => {
  return state.packages.find((p) => p.id === state.activePackageId)!;
};

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // Project & Package Reducers
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
    },
    addPackage: (state, action: PayloadAction<{ name: string }>) => {
      const newPkg: Package = {
        id: uuidv4(),
        name: action.payload.name,
        variables: [],
        functions: [],
        runner: [],
        codeSnippets: [],
      };
      state.packages.push(newPkg);
      state.activePackageId = newPkg.id; // Switch to the new package automatically
    },
    removePackage: (state, action: PayloadAction<string>) => {
      if (state.packages.length <= 1) return; // Must have at least one package
      state.packages = state.packages.filter((p) => p.id !== action.payload);
      if (state.activePackageId === action.payload) {
        state.activePackageId = state.packages[0].id;
      }
    },
    renamePackage: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const pkg = state.packages.find((p) => p.id === action.payload.id);
      if (pkg) {
        pkg.name = action.payload.name;
      }
    },
    setActivePackage: (state, action: PayloadAction<string>) => {
      if (state.packages.some((p) => p.id === action.payload)) {
        state.activePackageId = action.payload;
      }
    },
    importProject: (state, action: PayloadAction<EditorState>) => {
      return action.payload;
    },
    importPackage: (state, action: PayloadAction<Package>) => {
      // Import into current project as a new package
      const newPkg = { ...action.payload, id: uuidv4() };
      state.packages.push(newPkg);
      state.activePackageId = newPkg.id;
    },

    // Variable Reducers
    setVariables: (
      state,
      action: PayloadAction<
        { id: string; name: string; type: string; value: any }[]
      >,
    ) => {
      const pkg = getActivePkg(state);
      pkg.variables = action.payload;
    },

    addVariable: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
      }>,
    ) => {
      const pkg = getActivePkg(state);
      pkg.variables.push({
        id: action.payload.id,
        name: action.payload.name,
        type: "string",
        value: "",
      });
    },

    removeVariable: (state, action: PayloadAction<string>) => {
      const pkg = getActivePkg(state);
      pkg.variables = pkg.variables.filter(
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
      const pkg = getActivePkg(state);
      pkg.variables = pkg.variables.map((variable) =>
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
      const pkg = getActivePkg(state);
      pkg.variables = pkg.variables.map((variable) =>
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
      const pkg = getActivePkg(state);
      pkg.variables = pkg.variables.map((variable) =>
        variable.id === action.payload.id
          ? { ...variable, type: action.payload.type }
          : variable,
      );
    },

    addFunctionName: (state, action: PayloadAction<string>) => {
      const tempActionId = uuidv4();
      const useActionId = uuidv4();
      const pkg = getActivePkg(state);

      pkg.functions.push({
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
      const pkg = getActivePkg(state);
      pkg.functions = pkg.functions.map((func) =>
        func.id === action.payload.id
          ? { ...func, name: action.payload.newName }
          : func,
      );
    },

    removeFunctionName: (state, action: PayloadAction<string>) => {
      const pkg = getActivePkg(state);
      pkg.functions = pkg.functions.filter(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        func.actions = func.actions.filter(
          (a) => a.id !== action.payload.actionId,
        );
      }
    },

    createSetRunner: (state) => {
      const pkg = getActivePkg(state);
      pkg.runner.push({
        id: uuidv4(),
        type: "set",
        target: ["", ""],
        args: [],
      });
    },

    createCallRunner: (state) => {
      const pkg = getActivePkg(state);
      pkg.runner.push({
        id: uuidv4(),
        type: "call",
        target: ["", ""],
        args: [],
      });
    },

    createCodeRunner: (state) => {
      const pkg = getActivePkg(state);
      pkg.runner.push({
        id: uuidv4(),
        type: "code",
        target: ["", ""],
        args: [],
        code: "return @this;\n",
      });
    },

    updateRunner: (
      state,
      action: PayloadAction<{ runnerId: string; runner: Runner }>,
    ) => {
      const pkg = getActivePkg(state);
      const runnerIndex = pkg.runner.findIndex(
        (r) => r.id === action.payload.runnerId,
      );
      if (runnerIndex !== -1) {
        pkg.runner[runnerIndex] = {
          ...action.payload.runner,
          id: action.payload.runnerId,
        };
      }
    },

    removeRunner: (state, action: PayloadAction<string>) => {
      const pkg = getActivePkg(state);
      pkg.runner = pkg.runner.filter(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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

    addLoopSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        loopActionId: string;
        subAction: FunctionActionInterface;
      }>,
    ) => {
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const loopAct = func.actions.find(
          (a) => a.id === action.payload.loopActionId,
        );
        if (loopAct) {
          if (!loopAct.subActions) loopAct.subActions = [];
          loopAct.subActions.push({
            ...action.payload.subAction,
            id: uuidv4(),
          });
        }
      }
    },

    removeLoopSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        loopActionId: string;
        subActionId: string;
      }>,
    ) => {
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const loopAct = func.actions.find(
          (a) => a.id === action.payload.loopActionId,
        );
        if (loopAct?.subActions) {
          loopAct.subActions = loopAct.subActions.filter(
            (sa) => sa.id !== action.payload.subActionId,
          );
        }
      }
    },

    updateLoopSubAction: (
      state,
      action: PayloadAction<{
        functionId: string;
        loopActionId: string;
        subActionId: string;
        subAction: FunctionActionInterface;
      }>,
    ) => {
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const loopAct = func.actions.find(
          (a) => a.id === action.payload.loopActionId,
        );
        if (loopAct?.subActions) {
          const idx = loopAct.subActions.findIndex(
            (sa) => sa.id === action.payload.subActionId,
          );
          if (idx !== -1) {
            loopAct.subActions[idx] = {
              ...action.payload.subAction,
              id: action.payload.subActionId,
            };
          }
        }
      }
    },

    updateLoopParams: (
      state,
      action: PayloadAction<{
        functionId: string;
        loopActionId: string;
        loopParams: { start?: string; end?: string; step?: string };
      }>,
    ) => {
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
        (f) => f.id === action.payload.functionId,
      );
      if (func) {
        const loopAct = func.actions.find(
          (a) => a.id === action.payload.loopActionId,
        );
        if (loopAct) {
          loopAct.loopParams = action.payload.loopParams;
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
      const pkg = getActivePkg(state);
      const func = pkg.functions.find(
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
      const pkg = getActivePkg(state);
      const { fromIndex, toIndex } = action.payload;
      const [movedRunner] = pkg.runner.splice(fromIndex, 1);
      pkg.runner.splice(toIndex, 0, movedRunner);
    },

    addCodeSnippet: (
      state,
      action: PayloadAction<{ name: string; code: string }>,
    ) => {
      const pkg = getActivePkg(state);
      const existing = pkg.codeSnippets.find(
        (s) => s.name === action.payload.name,
      );
      if (existing) {
        existing.code = action.payload.code;
      } else {
        pkg.codeSnippets.push({
          id: uuidv4(),
          name: action.payload.name,
          code: action.payload.code,
        });
      }
    },

    updateCodeSnippet: (
      state,
      action: PayloadAction<{
        id: string;
        snippet: Partial<CodeSnippetInterface>;
      }>,
    ) => {
      const pkg = getActivePkg(state);
      const idx = pkg.codeSnippets.findIndex(
        (s) => s.id === action.payload.id,
      );
      if (idx !== -1) {
        pkg.codeSnippets[idx] = {
          ...pkg.codeSnippets[idx],
          ...action.payload.snippet,
        };
      }
    },

    removeCodeSnippet: (state, action: PayloadAction<string>) => {
      const pkg = getActivePkg(state);
      pkg.codeSnippets = pkg.codeSnippets.filter(
        (s) => s.id !== action.payload,
      );
    },

    importState: (state, action: PayloadAction<Partial<Package>>) => {
      // Legacy import for a single package into current package
      const importedState = action.payload;
      const pkg = getActivePkg(state);
      if (importedState.variables) pkg.variables = importedState.variables;
      if (importedState.functions) pkg.functions = importedState.functions;
      if (importedState.runner) pkg.runner = importedState.runner;
      if (importedState.codeSnippets)
        pkg.codeSnippets = importedState.codeSnippets;
    },

    resetState: (state) => {
      // Resets the active package
      const pkg = getActivePkg(state);
      pkg.variables = [];
      pkg.functions = [];
      pkg.runner = [];
      pkg.codeSnippets = [];
    },
  },
});

export const {
  setProjectName,
  addPackage,
  removePackage,
  renamePackage,
  setActivePackage,
  importProject,
  importPackage,
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
  addLoopSubAction,
  removeLoopSubAction,
  updateLoopSubAction,
  updateLoopParams,
  reorderFunctionActions,
  createSetRunner,
  createCallRunner,
  createCodeRunner,
  updateRunner,
  removeRunner,
  reorderRunnerSteps,
  addCodeSnippet,
  updateCodeSnippet,
  removeCodeSnippet,
  importState,
  resetState,
} = editorSlice.actions;

export default editorSlice.reducer;
