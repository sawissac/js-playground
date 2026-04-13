"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CanvasNodeType = "variableNode" | "functionNode" | "rendererNode";

export interface CanvasNodeData {
  label: string;
  nodeType: "variable" | "function" | "renderer";
  linkedId?: string; // ID of linked variable/function in editorSlice
  [key: string]: unknown; // required for @xyflow/react Node data compatibility
}

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  data: CanvasNodeData;
  style?: { width?: number; height?: number; [key: string]: unknown };
  width?: number;
  height?: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
  data?: {
    order?: number;
  };
}

export interface PackageCanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  variableCount: number;
  functionCount: number;
  rendererCount: number;
}

export interface CanvasState {
  canvases: Record<string, PackageCanvasData>; // packageId -> canvas data
}

const createEmptyCanvas = (): PackageCanvasData => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  variableCount: 0,
  functionCount: 0,
  rendererCount: 0,
});

const initialState: CanvasState = {
  canvases: {},
};

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setCanvasNodes(
      state,
      action: PayloadAction<{ packageId: string; nodes: CanvasNode[] }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      state.canvases[action.payload.packageId].nodes = action.payload.nodes;
    },
    setCanvasEdges(
      state,
      action: PayloadAction<{ packageId: string; edges: CanvasEdge[] }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      state.canvases[action.payload.packageId].edges = action.payload.edges;
    },
    addVariableNode(
      state,
      action: PayloadAction<{
        packageId: string;
        id: string;
        position: { x: number; y: number };
        linkedId: string;
      }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      const canvas = state.canvases[action.payload.packageId];
      canvas.variableCount += 1;
      const label = `v${canvas.variableCount}`;
      canvas.nodes.push({
        id: action.payload.id,
        type: "variableNode",
        position: action.payload.position,
        data: {
          label,
          nodeType: "variable",
          linkedId: action.payload.linkedId,
        },
      });
    },
    addFunctionNode(
      state,
      action: PayloadAction<{
        packageId: string;
        id: string;
        position: { x: number; y: number };
        linkedId: string;
        label: string;
      }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      const canvas = state.canvases[action.payload.packageId];
      canvas.functionCount += 1;
      canvas.nodes.push({
        id: action.payload.id,
        type: "functionNode",
        position: action.payload.position,
        data: {
          label: action.payload.label,
          nodeType: "function",
          linkedId: action.payload.linkedId,
        },
      });
    },
    addRendererNode(
      state,
      action: PayloadAction<{
        packageId: string;
        id: string;
        position: { x: number; y: number };
      }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      const canvas = state.canvases[action.payload.packageId];
      canvas.rendererCount += 1;
      canvas.nodes.push({
        id: action.payload.id,
        type: "rendererNode",
        position: action.payload.position,
        data: { label: "renderer", nodeType: "renderer" },
      });
    },
    renameCanvasNode(
      state,
      action: PayloadAction<{ packageId: string; id: string; label: string }>,
    ) {
      const canvas = state.canvases[action.payload.packageId];
      if (!canvas) return;
      const node = canvas.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, label: action.payload.label };
      }
    },
    removeCanvasNode(
      state,
      action: PayloadAction<{ packageId: string; nodeId: string }>,
    ) {
      const canvas = state.canvases[action.payload.packageId];
      if (!canvas) return;
      canvas.nodes = canvas.nodes.filter((n) => n.id !== action.payload.nodeId);
      canvas.edges = canvas.edges.filter(
        (e) =>
          e.source !== action.payload.nodeId &&
          e.target !== action.payload.nodeId,
      );
      if (canvas.selectedNodeId === action.payload.nodeId) {
        canvas.selectedNodeId = null;
      }
    },
    addCanvasEdge(
      state,
      action: PayloadAction<{ packageId: string; edge: CanvasEdge }>,
    ) {
      if (!state.canvases[action.payload.packageId]) {
        state.canvases[action.payload.packageId] = createEmptyCanvas();
      }
      const canvas = state.canvases[action.payload.packageId];
      const exists = canvas.edges.some(
        (e) =>
          e.source === action.payload.edge.source &&
          e.target === action.payload.edge.target,
      );
      if (!exists) {
        // Calculate arg order for variable→function connections
        const targetNode = canvas.nodes.find(
          (n) => n.id === action.payload.edge.target,
        );
        if (targetNode?.type === "functionNode" && !action.payload.edge.label) {
          const existingInputs = canvas.edges.filter(
            (e) => e.target === action.payload.edge.target,
          );
          const order = existingInputs.length + 1;
          action.payload.edge.label = `arg${order}`;
          action.payload.edge.data = { order };
        }
        canvas.edges.push(action.payload.edge);
      }
    },
    removeCanvasEdge(
      state,
      action: PayloadAction<{ packageId: string; edgeId: string }>,
    ) {
      const canvas = state.canvases[action.payload.packageId];
      if (!canvas) return;
      canvas.edges = canvas.edges.filter((e) => e.id !== action.payload.edgeId);
    },
    setSelectedCanvasNode(
      state,
      action: PayloadAction<{ packageId: string; nodeId: string | null }>,
    ) {
      const canvas = state.canvases[action.payload.packageId];
      if (!canvas) return;
      canvas.selectedNodeId = action.payload.nodeId;
    },
    updateCanvasNodePosition(
      state,
      action: PayloadAction<{
        packageId: string;
        id: string;
        position: { x: number; y: number };
      }>,
    ) {
      const canvas = state.canvases[action.payload.packageId];
      if (!canvas) return;
      const node = canvas.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.position = action.payload.position;
      }
    },
    clearCanvas(state, action: PayloadAction<string>) {
      const packageId = action.payload;
      state.canvases[packageId] = createEmptyCanvas();
    },
    /** Restore full canvas state from persisted data (called on app load) */
    hydrateCanvas(_state, action: PayloadAction<any>) {
      // Handle migration from old format or missing canvases
      const payload = action.payload;

      // If old format (has nodes/edges directly), create empty canvases
      if (!payload.canvases || typeof payload.canvases !== "object") {
        return { canvases: {} };
      }

      // Clear all selected nodes when hydrating
      const hydratedState = { canvases: { ...payload.canvases } };
      Object.keys(hydratedState.canvases).forEach((pkgId) => {
        hydratedState.canvases[pkgId].selectedNodeId = null;
      });
      return hydratedState;
    },
  },
});

export const {
  setCanvasNodes,
  setCanvasEdges,
  addVariableNode,
  addFunctionNode,
  addRendererNode,
  renameCanvasNode,
  removeCanvasNode,
  addCanvasEdge,
  removeCanvasEdge,
  setSelectedCanvasNode,
  updateCanvasNodePosition,
  clearCanvas,
  hydrateCanvas,
} = canvasSlice.actions;

export default canvasSlice.reducer;
