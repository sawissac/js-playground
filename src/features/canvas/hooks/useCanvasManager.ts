import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
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
} from "@/state/slices/canvasSlice";
import { unregisterRenderer } from "@/state/slices/canvasRunnerSlice";
import type { CanvasNode as ReduxCanvasNode } from "@/state/slices/canvasSlice";
import { DEFAULT_EDGE_OPTIONS } from "../constants";

export function useCanvasManager() {
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
  const hydratedRef = useRef(false);

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

  useEffect(() => {
    if (!hydratedRef.current && currentCanvas.nodes.length > 0) {
      hydratedRef.current = true;
      setNodes(currentCanvas.nodes as Node[]);
      setEdges(currentCanvas.edges as Edge[]);
    }
  }, [currentCanvas.nodes, setEdges, setNodes]);

  useEffect(() => {
    if (!activePkg) return;

    let currentNodes = [...(currentCanvas.nodes as unknown as Node[])];
    let currentEdges = [...(currentCanvas.edges as unknown as Edge[])];
    let changed = false;

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

    const edgeSet = new Set(currentEdges.map((e) => `${e.source}→${e.target}`));

    activePkg.runner.forEach((step) => {
      if (step.type === "call") {
        const [varName, funcName] = step.target;
        const varObj = activePkg.variables.find((v) => v.name === varName);
        const funcObj = activePkg.functions.find((f) => f.name === funcName);
        if (varObj && funcObj) {
          const varNodeId = varLinkedToNode.get(varObj.id);
          const funcNodeId = funcLinkedToNode.get(funcObj.id);
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

    const activeNodeIds = new Set(currentNodes.map((n) => n.id));
    const initialEdgeCount = currentEdges.length;
    currentEdges = currentEdges.filter(
      (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target),
    );
    if (currentEdges.length !== initialEdgeCount) changed = true;

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
  }, [
    activePkg?.id,
    activePkg?.variables,
    activePkg?.functions,
    activePkg?.runner,
    activePackageId,
    currentCanvas.edges,
    currentCanvas.nodes,
    dispatch,
    setEdges,
    setNodes,
  ]);

  useEffect(() => {
    setNodes((prev) => {
      const filtered = prev.filter((n) =>
        currentCanvas.nodes.some((rn) => rn.id === n.id),
      );

      const patched = filtered.map((n) => {
        const reduxNode = currentCanvas.nodes.find((rn) => rn.id === n.id);
        if (reduxNode && reduxNode.data.label !== (n.data as any).label) {
          return { ...n, data: { ...n.data, label: reduxNode.data.label } };
        }
        return n;
      });

      const localIds = new Set(patched.map((n) => n.id));
      const incoming = (currentCanvas.nodes as unknown as Node[]).filter(
        (rn) => !localIds.has(rn.id),
      );

      return [...patched, ...incoming];
    });
  }, [currentCanvas.nodes, setNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated);

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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      dispatch(
        setSelectedCanvasNode({ packageId: activePackageId, nodeId: node.id }),
      );
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === "a" && !inInput) {
        e.preventDefault();
        setNodes((ns) => ns.map((n) => ({ ...n, selected: true })));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
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

  const getSpawnPosition = useCallback(() => {
    if (!rfInstance) {
      return { x: 120, y: 80 };
    }
    const viewport = rfInstance.getViewport();
    const { x: viewX, y: viewY, zoom } = viewport;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

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

  const handleAutoLayout = useCallback(() => {
    if (!rfInstance) return;

    const viewport = rfInstance.getViewport();
    const { x: viewX, y: viewY, zoom } = viewport;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const centerX = -viewX / zoom + canvasWidth / (2 * zoom);
    const centerY = -viewY / zoom + canvasHeight / (2 * zoom);

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

    const levels = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach((node) => {
      if (!incoming.has(node.id) || incoming.get(node.id)!.length === 0) {
        levels.set(node.id, 0);
        queue.push(node.id);
      }
    });

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

    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    const nodesByLevel = new Map<number, Node[]>();
    nodes.forEach((node) => {
      const level = levels.get(node.id) ?? 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    const START_X = centerX - 400;
    const START_Y = centerY;
    const GAP_X = 300;
    const GAP_Y = 160; 

    const updated = nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const nodesInLevel = nodesByLevel.get(level) ?? [];
      const indexInLevel = nodesInLevel.indexOf(node);
      const totalInLevel = nodesInLevel.length;

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

    flushSync(() => setNodes(updated));
    dispatch(
      setCanvasNodes({
        packageId: activePackageId,
        nodes: updated as unknown as ReduxCanvasNode[],
      }),
    );
    setTimeout(() => rfInstance?.fitView({ padding: 0.3 }), 50);
  }, [nodes, edges, setNodes, dispatch, rfInstance, activePackageId]);

  const handleSelectAll = useCallback(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
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

  const selectedNode = currentCanvas.selectedNodeId
    ? (currentCanvas.nodes.find(
        (n) => n.id === currentCanvas.selectedNodeId,
      ) as ReduxCanvasNode | undefined)
    : undefined;

  const miniMapNodeColor = useCallback((node: Node) => {
    if (node.type === "variableNode") return "#d1d5db";
    if (node.type === "functionNode") return "#bfdbfe";
    return "#bbf7d0";
  }, []);

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    onEdgeClick,
    setRfInstance,
    panOnDrag,
    showComponents,
    setShowComponents,
    handleAddVariable,
    handleAddFunction,
    handleAddRenderer,
    handleAutoLayout,
    handleSelectAll,
    onDragOver,
    onDrop,
    activePkg,
    currentCanvas,
    selectedNode,
    miniMapNodeColor,
  };
}
