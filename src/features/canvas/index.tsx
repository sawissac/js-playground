"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { v4 as uuidv4 } from "uuid";
import {
  addVariable,
  addFunctionById,
  removeVariable,
  removeFunctionName,
} from "@/state/slices/editorSlice";
import {
  addVariableNode,
  addFunctionNode,
  addRendererNode,
  addCanvasEdge,
  removeCanvasNode,
  setSelectedCanvasNode,
  setCanvasNodes,
  setCanvasEdges,
  renameCanvasNode,
} from "@/state/slices/canvasSlice";
import { unregisterRenderer } from "@/state/slices/canvasRunnerSlice";
import type { CanvasNode as ReduxCanvasNode } from "@/state/slices/canvasSlice";
import { VariableNode } from "./nodes/VariableNode";
import { FunctionNode } from "./nodes/FunctionNode";
import { RendererNode } from "./nodes/RendererNode";
import { CanvasToolbar } from "./toolbar/CanvasToolbar";
import { NodeDetailPanel } from "./panels/NodeDetailPanel";
import { cn } from "@/lib/utils";
import {
  IconArrowLeft,
  IconLayersSubtract,
  IconLayoutGrid,
  IconSelectAll,
  IconVariable,
  IconFunction,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

// Node types must be stable (outside component or memoized)
const NODE_TYPES = {
  variableNode: VariableNode,
  functionNode: FunctionNode,
  rendererNode: RendererNode,
} as const;

const DEFAULT_EDGE_OPTIONS = {
  markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
  style: { stroke: "#9ca3af", strokeWidth: 1.5 },
  labelStyle: { fontSize: 10, fill: "#6b7280", fontWeight: 500 },
  labelBgStyle: { fill: "#f9fafb", stroke: "#e5e7eb" },
  labelBgPadding: [3, 5] as [number, number],
  labelBgBorderRadius: 4,
  animated: true,
};

interface CanvasProps {
  onClose: () => void;
  onOpenRenderer: () => void;
}

export function Canvas({ onClose, onOpenRenderer }: CanvasProps) {
  const dispatch = useAppDispatch();
  const canvasState = useAppSelector((s) => s.canvas);
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const activePkg = useAppSelector((s) =>
    s.editor.packages.find((p) => p.id === s.editor.activePackageId),
  );

  // Get current package's canvas data (or empty canvas if doesn't exist)
  const currentCanvas = useMemo(
    () =>
      canvasState.canvases[activePackageId] || {
        nodes: [],
        edges: [],
        selectedNodeId: null,
        variableCount: 0,
        functionCount: 0,
        rendererCount: 0,
      },
    [canvasState.canvases, activePackageId],
  );

  // React Flow local state — seeded from Redux
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    currentCanvas.nodes as Node[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    currentCanvas.edges as Edge[],
  );
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [panOnDrag, setPanOnDrag] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  // Track whether we've done the initial hydration seed
  const hydratedRef = useRef(false);

  // ── Pan disable when hovering over renderer content ─────────────────────────
  useEffect(() => {
    const disable = () => setPanOnDrag(false);
    const enable = () => setPanOnDrag(true);
    window.addEventListener("canvas-renderer-hover", disable);
    window.addEventListener("canvas-renderer-leave", enable);
    return () => {
      window.removeEventListener("canvas-renderer-hover", disable);
      window.removeEventListener("canvas-renderer-leave", enable);
    };
  }, []);

  // ── One-time hydration seed ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hydratedRef.current && currentCanvas.nodes.length > 0) {
      hydratedRef.current = true;
      setNodes(currentCanvas.nodes as Node[]);
      setEdges(currentCanvas.edges as Edge[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCanvas.nodes]);

  // Dynamic sync: Active Package ↔ Canvas Nodes
  useEffect(() => {
    if (!activePkg) return;

    let currentNodes = [...(currentCanvas.nodes as unknown as Node[])];
    let currentEdges = [...(currentCanvas.edges as unknown as Edge[])];
    let changed = false;

    // 1. Clean up nodes from previous packages or deleted items
    const initialNodeCount = currentNodes.length;
    currentNodes = currentNodes.filter((n) => {
      if (n.data.nodeType === "variable" && n.data.linkedId) {
        return activePkg.variables.some((v) => v.id === n.data.linkedId);
      }
      if (n.data.nodeType === "function" && n.data.linkedId) {
        return activePkg.functions.some((f) => f.id === n.data.linkedId);
      }
      return true; // Keep renderer nodes independent
    });
    if (currentNodes.length !== initialNodeCount) changed = true;

    // 2. Add nodes for missing variables
    let yVarMax = currentNodes
      .filter((n) => n.data.nodeType === "variable")
      .reduce((max, n) => Math.max(max, n.position.y), 0);
    if (yVarMax === 0) yVarMax = 100;
    else yVarMax += 100;

    activePkg.variables.forEach((v) => {
      if (!currentNodes.some((n) => n.data.linkedId === v.id)) {
        currentNodes.push({
          id: uuidv4(),
          type: "variableNode",
          position: { x: 100, y: yVarMax },
          data: { label: v.name, nodeType: "variable", linkedId: v.id },
        });
        yVarMax += 100;
        changed = true;
      }
    });

    // 3. Add nodes for missing functions
    let yFuncMax = currentNodes
      .filter((n) => n.data.nodeType === "function")
      .reduce((max, n) => Math.max(max, n.position.y), 0);
    if (yFuncMax === 0) yFuncMax = 100;
    else yFuncMax += 150;

    activePkg.functions.forEach((f) => {
      if (!currentNodes.some((n) => n.data.linkedId === f.id)) {
        currentNodes.push({
          id: uuidv4(),
          type: "functionNode",
          position: { x: 400, y: yFuncMax },
          data: { label: f.name, nodeType: "function", linkedId: f.id },
        });
        yFuncMax += 150;
        changed = true;
      }
    });

    // 4. Update labels for rename syncing
    currentNodes = currentNodes.map((n) => {
      let updated = false;
      if (n.data.nodeType === "variable" && n.data.linkedId) {
        const v = activePkg.variables.find((v) => v.id === n.data.linkedId);
        if (v && v.name !== n.data.label) {
          n = { ...n, data: { ...n.data, label: v.name } };
          updated = true;
        }
      }
      if (n.data.nodeType === "function" && n.data.linkedId) {
        const f = activePkg.functions.find((f) => f.id === n.data.linkedId);
        if (f && f.name !== n.data.label) {
          n = { ...n, data: { ...n.data, label: f.name } };
          updated = true;
        }
      }
      if (updated) changed = true;
      return n;
    });

    // 6. Build lookup maps: linkedId → nodeId
    const varLinkedToNode = new Map(
      currentNodes
        .filter((n) => n.data.nodeType === "variable" && n.data.linkedId)
        .map((n) => [n.data.linkedId as string, n.id]),
    );
    const funcLinkedToNode = new Map(
      currentNodes
        .filter((n) => n.data.nodeType === "function" && n.data.linkedId)
        .map((n) => [n.data.linkedId as string, n.id]),
    );

    // 7. Auto-connect from runner: derive edges from runner steps
    const edgeSet = new Set(currentEdges.map((e) => `${e.source}→${e.target}`));

    activePkg.runner.forEach((step) => {
      if (step.type === "call") {
        const [varName, funcName] = step.target;
        const varObj = activePkg.variables.find((v) => v.name === varName);
        const funcObj = activePkg.functions.find((f) => f.name === funcName);
        if (varObj && funcObj) {
          const varNodeId = varLinkedToNode.get(varObj.id);
          const funcNodeId = funcLinkedToNode.get(funcObj.id);
          // function → variable (return edge)
          if (
            varNodeId &&
            funcNodeId &&
            !edgeSet.has(`${funcNodeId}→${varNodeId}`)
          ) {
            currentEdges.push({
              id: uuidv4(),
              source: funcNodeId,
              target: varNodeId,
              label: "return",
              ...DEFAULT_EDGE_OPTIONS,
            });
            edgeSet.add(`${funcNodeId}→${varNodeId}`);
            changed = true;
          }
          // arg variables → function (input edges)
          if (funcNodeId) {
            step.args.forEach((argName: string, idx: number) => {
              const argVar = activePkg.variables.find(
                (v) => v.name === argName,
              );
              if (argVar) {
                const argNodeId = varLinkedToNode.get(argVar.id);
                if (argNodeId && !edgeSet.has(`${argNodeId}→${funcNodeId}`)) {
                  currentEdges.push({
                    id: uuidv4(),
                    source: argNodeId,
                    target: funcNodeId,
                    label: `arg${idx + 1}`,
                    ...DEFAULT_EDGE_OPTIONS,
                  });
                  edgeSet.add(`${argNodeId}→${funcNodeId}`);
                  changed = true;
                }
              }
            });
          }
        }
      }
    });

    // 8. Clean dangling edges
    const activeNodeIds = new Set(currentNodes.map((n) => n.id));
    const initialEdgeCount = currentEdges.length;
    currentEdges = currentEdges.filter(
      (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target),
    );
    if (currentEdges.length !== initialEdgeCount) changed = true;

    // Apply ONLY if state changed to prevent infinite loops
    if (changed) {
      setNodes(currentNodes);
      setEdges(currentEdges);
      dispatch(
        setCanvasNodes({
          packageId: activePackageId,
          nodes: currentNodes as unknown as ReduxCanvasNode[],
        }),
      );
      dispatch(
        setCanvasEdges({
          packageId: activePackageId,
          edges:
            currentEdges as unknown as import("@/state/slices/canvasSlice").CanvasEdge[],
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePkg?.id,
    activePkg?.variables,
    activePkg?.functions,
    activePkg?.runner,
  ]);

  // ── Sync Redux → local RF nodes (renames, deletions, AND package switches) ──
  // When canvasState.nodes changes we must:
  //  1. Remove stale local nodes (deleted or from old package — IDs gone from Redux)
  //  2. Patch labels for surviving nodes
  //  3. Add brand-new Redux nodes that have no local counterpart yet
  //     (happens on package switch: sync effect creates nodes with fresh IDs in Redux
  //      but the label-sync effect runs before local state settles, so we merge them in)
  useEffect(() => {
    setNodes((prev) => {
      // 1. Keep local nodes whose ID still exists in Redux
      const filtered = prev.filter((n) =>
        currentCanvas.nodes.some((rn) => rn.id === n.id),
      );

      // 2. Patch labels
      const patched = filtered.map((n) => {
        const reduxNode = currentCanvas.nodes.find((rn) => rn.id === n.id);
        if (reduxNode && reduxNode.data.label !== (n.data as any).label) {
          return { ...n, data: { ...n.data, label: reduxNode.data.label } };
        }
        return n;
      });

      // 3. Add any Redux nodes that don't exist locally yet (e.g. after package switch)
      const localIds = new Set(patched.map((n) => n.id));
      const incoming = (currentCanvas.nodes as unknown as Node[]).filter(
        (rn) => !localIds.has(rn.id),
      );

      return [...patched, ...incoming];
    });
  }, [currentCanvas.nodes, setNodes]);

  // ── Sync node drag positions + dimension changes back to Redux ──────────────
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated);

      // Persist on position end OR dimension change (resize)
      const relevantChanges = changes.filter(
        (c) =>
          (c.type === "position" && !("dragging" in c && c.dragging)) ||
          c.type === "dimensions",
      );
      if (relevantChanges.length > 0) {
        dispatch(
          setCanvasNodes({
            packageId: activePackageId,
            nodes: updated as unknown as ReduxCanvasNode[],
          }),
        );
      }
    },
    [nodes, setNodes, dispatch, activePackageId],
  );

  // ── Sync edge changes back to Redux ─────────────────────────────────────────
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
      dispatch(
        setCanvasEdges({
          packageId: activePackageId,
          edges:
            updated as unknown as import("@/state/slices/canvasSlice").CanvasEdge[],
        }),
      );
    },
    [edges, setEdges, dispatch, activePackageId],
  );

  // ── Handle new connection drawn ─────────────────────────────────────────────
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      if (!sourceNode || !targetNode || params.source === params.target) return;

      let label = "";
      if (targetNode.type === "functionNode") {
        const existingInputs = edges.filter((e) => e.target === params.target);
        label = `arg${existingInputs.length + 1}`;
      } else if (targetNode.type === "rendererNode") {
        label = sourceNode.type === "variableNode" ? "value" : "return";
      } else if (
        targetNode.type === "variableNode" &&
        sourceNode.type === "functionNode"
      ) {
        label = "return";
      }

      const newEdge: Edge = {
        ...params,
        id: uuidv4(),
        source: params.source!,
        target: params.target!,
        label,
        ...DEFAULT_EDGE_OPTIONS,
      };

      setEdges((eds) => addEdge(newEdge, eds));
      dispatch(
        addCanvasEdge({
          packageId: activePackageId,
          edge: {
            id: newEdge.id,
            source: newEdge.source,
            target: newEdge.target,
            label:
              typeof newEdge.label === "string" ? newEdge.label : undefined,
            animated: true,
          },
        }),
      );
    },
    [nodes, edges, setEdges, dispatch, activePackageId],
  );

  // ── Node click → select ─────────────────────────────────────────────────────
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      dispatch(
        setSelectedCanvasNode({ packageId: activePackageId, nodeId: node.id }),
      );
      // Deselect all edges when a node is selected
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: false,
          style: {
            ...e.style,
            stroke: "#9ca3af",
            strokeWidth: 1.5,
          },
          markerEnd: {
            ...((e.markerEnd as any) || {}),
            color: "#9ca3af",
          },
        })),
      );
    },
    [dispatch, setEdges, activePackageId],
  );

  const onPaneClick = useCallback(() => {
    dispatch(
      setSelectedCanvasNode({ packageId: activePackageId, nodeId: null }),
    );
    // Deselect all edges and reset their styles
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        selected: false,
        style: {
          ...e.style,
          stroke: "#9ca3af",
          strokeWidth: 1.5,
        },
        markerEnd: {
          ...((e.markerEnd as any) || {}),
          color: "#9ca3af",
        },
      })),
    );
  }, [dispatch, setEdges, activePackageId]);

  // ── Keyboard: DEL node, DEL edge, Ctrl+A select all ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      // Ctrl+A — select all nodes
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && !inInput) {
        e.preventDefault();
        setNodes((ns) => ns.map((n) => ({ ...n, selected: true })));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
        // 1. Delete selected edges first
        const selectedEdges = edges.filter((edge) => (edge as any).selected);
        if (selectedEdges.length > 0) {
          const newEdges = edges.filter((edge) => !(edge as any).selected);
          setEdges(newEdges);
          dispatch(
            setCanvasEdges({
              packageId: activePackageId,
              edges:
                newEdges as unknown as import("@/state/slices/canvasSlice").CanvasEdge[],
            }),
          );
          return;
        }

        // 2. Delete selected node
        if (currentCanvas.selectedNodeId) {
          const targetNode = currentCanvas.nodes.find(
            (n) => n.id === currentCanvas.selectedNodeId,
          );
          dispatch(
            removeCanvasNode({
              packageId: activePackageId,
              nodeId: currentCanvas.selectedNodeId,
            }),
          );
          if (targetNode?.data.linkedId) {
            if (targetNode.data.nodeType === "variable") {
              dispatch(removeVariable(targetNode.data.linkedId));
            } else if (targetNode.data.nodeType === "function") {
              dispatch(removeFunctionName(targetNode.data.linkedId));
            }
          }
          if (targetNode?.data.nodeType === "renderer") {
            dispatch(unregisterRenderer(currentCanvas.selectedNodeId));
          }
          setNodes((ns) =>
            ns.filter((n) => n.id !== currentCanvas.selectedNodeId),
          );
          setEdges((es) =>
            es.filter(
              (e) =>
                e.source !== currentCanvas.selectedNodeId &&
                e.target !== currentCanvas.selectedNodeId,
            ),
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentCanvas.selectedNodeId,
    currentCanvas.nodes,
    edges,
    dispatch,
    setNodes,
    setEdges,
    activePackageId,
  ]);

  // ── Add nodes ───────────────────────────────────────────────────────────────
  const getSpawnPosition = useCallback(() => {
    if (!rfInstance) {
      return { x: 120, y: 80 };
    }
    // Get viewport center position
    const viewport = rfInstance.getViewport();
    const { x: viewX, y: viewY, zoom } = viewport;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Calculate center of visible viewport in flow coordinates
    const centerX = -viewX / zoom + canvasWidth / (2 * zoom);
    const centerY = -viewY / zoom + canvasHeight / (2 * zoom);

    return { x: centerX - 50, y: centerY - 50 };
  }, [rfInstance]);

  const handleAddVariable = useCallback(() => {
    const nodeId = uuidv4();
    const varId = uuidv4();
    const nextCount = currentCanvas.variableCount + 1;
    const varName = `v${nextCount}`;

    dispatch(addVariable({ id: varId, name: varName }));
    dispatch(
      addVariableNode({
        packageId: activePackageId,
        id: nodeId,
        position: getSpawnPosition(),
        linkedId: varId,
      }),
    );

    const newNode: Node = {
      id: nodeId,
      type: "variableNode",
      position: getSpawnPosition(),
      data: { label: varName, nodeType: "variable", linkedId: varId },
    };
    setNodes((ns) => [...ns, newNode]);
  }, [
    dispatch,
    currentCanvas.variableCount,
    setNodes,
    getSpawnPosition,
    activePackageId,
  ]);

  const handleAddFunction = useCallback(() => {
    const nodeId = uuidv4();
    const funcId = uuidv4();
    const nextCount = currentCanvas.functionCount + 1;
    const funcName = `t${nextCount}`;

    dispatch(addFunctionById({ id: funcId, name: funcName }));
    dispatch(
      addFunctionNode({
        packageId: activePackageId,
        id: nodeId,
        position: getSpawnPosition(),
        linkedId: funcId,
        label: funcName,
      }),
    );

    const newNode: Node = {
      id: nodeId,
      type: "functionNode",
      position: getSpawnPosition(),
      data: { label: funcName, nodeType: "function", linkedId: funcId },
    };
    setNodes((ns) => [...ns, newNode]);
  }, [
    dispatch,
    currentCanvas.functionCount,
    setNodes,
    getSpawnPosition,
    activePackageId,
  ]);

  const handleAddRenderer = useCallback(() => {
    const nodeId = uuidv4();
    dispatch(
      addRendererNode({
        packageId: activePackageId,
        id: nodeId,
        position: getSpawnPosition(),
      }),
    );

    const newNode: Node = {
      id: nodeId,
      type: "rendererNode",
      style: { width: 400, height: 300 },
      position: getSpawnPosition(),
      data: { label: "renderer", nodeType: "renderer" },
    };
    setNodes((ns) => [...ns, newNode]);
  }, [dispatch, setNodes, getSpawnPosition, activePackageId]);

  // ── Auto layout ─────────────────────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    if (!rfInstance) return;

    // Get viewport center as starting point
    const viewport = rfInstance.getViewport();
    const { x: viewX, y: viewY, zoom } = viewport;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const centerX = -viewX / zoom + canvasWidth / (2 * zoom);
    const centerY = -viewY / zoom + canvasHeight / (2 * zoom);

    // Build adjacency map from edges (nodeId -> list of target nodeIds)
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();

    edges.forEach((edge) => {
      const src = edge.source;
      const tgt = edge.target;
      if (!outgoing.has(src)) outgoing.set(src, []);
      if (!incoming.has(tgt)) incoming.set(tgt, []);
      outgoing.get(src)!.push(tgt);
      incoming.get(tgt)!.push(src);
    });

    // Calculate "level" (depth) for each node using BFS
    const levels = new Map<string, number>();
    const queue: string[] = [];

    // Start with source nodes (nodes with no incoming edges)
    nodes.forEach((node) => {
      if (!incoming.has(node.id) || incoming.get(node.id)!.length === 0) {
        levels.set(node.id, 0);
        queue.push(node.id);
      }
    });

    // BFS to assign levels
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const currentLevel = levels.get(nodeId) ?? 0;

      const targets = outgoing.get(nodeId) || [];
      targets.forEach((targetId) => {
        const existingLevel = levels.get(targetId);
        const newLevel = currentLevel + 1;

        if (existingLevel === undefined || newLevel > existingLevel) {
          levels.set(targetId, newLevel);
          queue.push(targetId);
        }
      });
    }

    // Assign level 0 to any orphan nodes (no incoming, no outgoing)
    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    // Group nodes by level
    const nodesByLevel = new Map<number, Node[]>();
    nodes.forEach((node) => {
      const level = levels.get(node.id) ?? 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    // Layout parameters
    const START_X = centerX - 400;
    const START_Y = centerY;
    const GAP_X = 300; // Horizontal gap between levels
    const GAP_Y = 160; // Vertical gap between nodes in same level

    // Position nodes - center each level vertically
    const updated = nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const nodesInLevel = nodesByLevel.get(level) ?? [];
      const indexInLevel = nodesInLevel.indexOf(node);
      const totalInLevel = nodesInLevel.length;

      // Center the group vertically
      const totalHeight = (totalInLevel - 1) * GAP_Y;
      const offsetY = -totalHeight / 2;

      const x = START_X + level * GAP_X;
      const y = START_Y + offsetY + indexInLevel * GAP_Y;

      return {
        ...node,
        position: { x, y },
        selected: false,
      };
    });

    // Commit position changes synchronously BEFORE dispatching to Redux.
    // Without flushSync, react-redux's useSyncExternalStore fires a synchronous
    // re-render on dispatch, which runs the canvasState.nodes sync-effect while
    // the local nodes state is still the OLD state — resetting the layout.
    flushSync(() => setNodes(updated));
    dispatch(
      setCanvasNodes({
        packageId: activePackageId,
        nodes: updated as unknown as ReduxCanvasNode[],
      }),
    );
    // Fit view after layout
    setTimeout(() => rfInstance?.fitView({ padding: 0.3 }), 50);
  }, [nodes, edges, setNodes, dispatch, rfInstance, activePackageId]);

  // ── Select all ──────────────────────────────────────────────────────────────
  const handleSelectAll = useCallback(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  // ── Edge click handler ──────────────────────────────────────────────────────
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      // Deselect all edges first, then select the clicked one
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: e.id === edge.id,
          style: {
            ...e.style,
            stroke: e.id === edge.id ? "#3b82f6" : "#9ca3af",
            strokeWidth: e.id === edge.id ? 2.5 : 1.5,
          },
          markerEnd: {
            ...((e.markerEnd as any) || {}),
            color: e.id === edge.id ? "#3b82f6" : "#9ca3af",
          },
        })),
      );
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      try {
        const typeStr = event.dataTransfer.getData("application/reactflow");
        if (!typeStr || !rfInstance) return;

        const data = JSON.parse(typeStr);
        const position = rfInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const nodeId = uuidv4();
        if (data.type === "variable") {
          dispatch(
            addVariableNode({
              packageId: activePackageId,
              id: nodeId,
              position,
              linkedId: data.id,
            }),
          );
          const newNode: Node = {
            id: nodeId,
            type: "variableNode",
            position,
            data: { label: data.name, nodeType: "variable", linkedId: data.id },
          };
          setNodes((ns) => [...ns, newNode]);
        } else if (data.type === "function") {
          dispatch(
            addFunctionNode({
              packageId: activePackageId,
              id: nodeId,
              position,
              linkedId: data.id,
              label: data.name,
            }),
          );
          const newNode: Node = {
            id: nodeId,
            type: "functionNode",
            position,
            data: { label: data.name, nodeType: "function", linkedId: data.id },
          };
          setNodes((ns) => [...ns, newNode]);
        }
      } catch (e) {
        console.error("Failed to drop onto canvas:", e);
      }
    },
    [dispatch, rfInstance, setNodes, activePackageId],
  );

  // ── Selected node (from Redux) ────────────────────────────────────────────────────
  const selectedNode = currentCanvas.selectedNodeId
    ? (currentCanvas.nodes.find(
        (n) => n.id === currentCanvas.selectedNodeId,
      ) as ReduxCanvasNode | undefined)
    : undefined;

  // ── Mini-map node color ─────────────────────────────────────────────────────
  const miniMapNodeColor = useCallback((node: Node) => {
    if (node.type === "variableNode") return "#d1d5db";
    if (node.type === "functionNode") return "#bfdbfe";
    return "#bbf7d0";
  }, []);

  const varCount = activePkg?.variables?.length ?? 0;
  const funcCount = activePkg?.functions?.length ?? 0;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* ── Redesigned Canvas Header ─────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200 bg-white shadow-sm z-10">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 focus:outline-none shrink-0"
          title="Back to editor"
        >
          <IconArrowLeft size={12} />
          Editor
        </button>
        <div className="w-px h-3.5 bg-gray-200 shrink-0" />

        {/* Package + canvas title */}
        <div className="flex items-center gap-1 shrink-0">
          <IconLayersSubtract size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-gray-800">
            {activePkg ? activePkg.name : "Canvas"}
          </span>
        </div>

        {/* Variable / Function count badges */}
        <div className="flex items-center gap-1 ml-0.5">
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            <IconVariable size={9} />
            {varCount}v
          </span>
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
            <IconFunction size={9} />
            {funcCount}fn
          </span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAutoLayout}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            title="Auto arrange all nodes by type"
          >
            <IconLayoutGrid size={11} />
            Auto Layout
          </button>
          <button
            onClick={handleSelectAll}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
            title="Select all nodes (Ctrl+A)"
          >
            <IconSelectAll size={11} />
            Select All
          </button>
        </div>

        <div className="w-px h-3.5 bg-gray-200 shrink-0" />

        {/* Hints */}
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground shrink-0">
          <kbd className="px-1 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[8px]">
            Del
          </kbd>
          <span>delete</span>
          <span className="text-gray-300">·</span>
          <kbd className="px-1 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[8px]">
            Ctrl+A
          </kbd>
          <span>select all</span>
        </div>
      </div>

      {/* ── Main area: components panel + canvas + detail panel ─────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Components Panel — left sidebar showing package vars/funcs */}
        <div
          className={cn(
            "h-full bg-white border-r border-gray-200 flex flex-col z-10 transition-all duration-200",
            showComponents ? "w-36" : "w-8",
          )}
        >
          {/* Panel toggle */}
          <button
            onClick={() => setShowComponents((v) => !v)}
            className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors shrink-0"
            title={
              showComponents
                ? "Collapse components panel"
                : "Expand components panel"
            }
          >
            {showComponents && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Components
              </span>
            )}
            {showComponents ? (
              <IconChevronLeft size={12} className="text-gray-400 shrink-0" />
            ) : (
              <IconChevronRight size={12} className="text-gray-400 shrink-0" />
            )}
          </button>

          {showComponents && (
            <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
              {/* Variables */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-0.5">
                  <IconVariable size={8} />
                  Variables
                </p>
                <div className="space-y-0.5">
                  {activePkg?.variables.map((v) => {
                    const hasNode = currentCanvas.nodes.some(
                      (n) => n.data.linkedId === v.id,
                    );
                    return (
                      <div
                        key={v.id}
                        draggable={!hasNode}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/reactflow",
                            JSON.stringify({
                              type: "variable",
                              id: v.id,
                              name: v.name,
                            }),
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-medium transition-colors",
                          hasNode
                            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-default"
                            : "border-gray-300 bg-white text-gray-700 cursor-grab hover:border-blue-400 hover:bg-blue-50 active:cursor-grabbing",
                        )}
                        title={hasNode ? "Already on canvas" : "Drag to canvas"}
                      >
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-current shrink-0" />
                        <span className="truncate">{v.name}</span>
                      </div>
                    );
                  })}
                  {!activePkg?.variables.length && (
                    <p className="text-[8px] text-muted-foreground italic text-center py-0.5">
                      none
                    </p>
                  )}
                </div>
              </div>

              {/* Functions */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-0.5">
                  <IconFunction size={8} />
                  Functions
                </p>
                <div className="space-y-0.5">
                  {activePkg?.functions.map((f) => {
                    const hasNode = currentCanvas.nodes.some(
                      (n) => n.data.linkedId === f.id,
                    );
                    return (
                      <div
                        key={f.id}
                        draggable={!hasNode}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/reactflow",
                            JSON.stringify({
                              type: "function",
                              id: f.id,
                              name: f.name,
                            }),
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium transition-colors",
                          hasNode
                            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-default"
                            : "border-gray-300 bg-white text-gray-700 cursor-grab hover:border-blue-400 hover:bg-blue-50 active:cursor-grabbing",
                        )}
                        title={hasNode ? "Already on canvas" : "Drag to canvas"}
                      >
                        <div className="w-2.5 h-1.5 rounded-sm border-2 border-current shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    );
                  })}
                  {!activePkg?.functions.length && (
                    <p className="text-[8px] text-muted-foreground italic text-center py-0.5">
                      none
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ReactFlow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            deleteKeyCode={null}
            panOnDrag={panOnDrag}
            multiSelectionKeyCode="Shift"
            selectionKeyCode="Shift"
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              color="#9ca3af"
            />
            <Controls className="!border-gray-200 !shadow-md !rounded-lg" />
            <MiniMap
              nodeColor={miniMapNodeColor}
              className="!border-gray-200 !shadow-md !rounded-lg"
              maskColor="rgba(0,0,0,0.04)"
            />
          </ReactFlow>

          {/* Bottom shape toolbar */}
          <CanvasToolbar
            onAddVariable={handleAddVariable}
            onAddFunction={handleAddFunction}
            onAddRenderer={handleAddRenderer}
            onAutoLayout={handleAutoLayout}
            onSelectAll={handleSelectAll}
          />
        </div>

        {/* Right detail panel — slides in when a node is selected */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onOpenRenderer={onOpenRenderer}
          />
        )}
      </div>
    </div>
  );
}
