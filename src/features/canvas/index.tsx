"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { VariableNode } from "./nodes/VariableNode";
import { FunctionNode } from "./nodes/FunctionNode";
import { RendererNode } from "./nodes/RendererNode";
import { CanvasToolbar } from "./toolbar/CanvasToolbar";
import { NodeDetailPanel } from "./panels/NodeDetailPanel";
import { DEFAULT_EDGE_OPTIONS } from "./constants";
import { CanvasHeader } from "./components/CanvasHeader";
import { CanvasComponentsPanel } from "./components/CanvasComponentsPanel";
import { useCanvasManager } from "./hooks/useCanvasManager";

const NODE_TYPES = {
  variableNode: VariableNode,
  functionNode: FunctionNode,
  rendererNode: RendererNode,
} as const;

interface CanvasProps {
  onClose: () => void;
  onOpenRenderer: () => void;
}

export function Canvas({ onClose, onOpenRenderer }: CanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
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
  } = useCanvasManager();

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <CanvasHeader
        onClose={onClose}
        activePkg={activePkg}
        handleAutoLayout={handleAutoLayout}
        handleSelectAll={handleSelectAll}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <CanvasComponentsPanel
          showComponents={showComponents}
          setShowComponents={setShowComponents}
          activePkg={activePkg}
          currentCanvasNodes={currentCanvas.nodes}
        />

        {/* ReactFlow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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

// Ensure backward compatibility since the file exported this as a named module.
export default Canvas;
