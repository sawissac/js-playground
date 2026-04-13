"use client";

import { useEffect } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  registerRenderer,
  syncRendererVariables,
  syncRendererFunctions,
  syncRendererRunner,
} from "@/state/slices/canvasRunnerSlice";

interface RendererNodeData {
  label: string;
  nodeType: "renderer";
  rendererId?: string;
}

interface RendererNodeProps {
  id: string; // ReactFlow passes this automatically
  data: RendererNodeData;
  selected?: boolean;
}

export function RendererNode({ id, data, selected }: RendererNodeProps) {
  const dispatch = useAppDispatch();
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const rendererEntry = useAppSelector((s) => s.canvasRunner.renderers[id]);

  const ownerPkg = useAppSelector((s) =>
    s.editor.packages.find((p) => p.id === activePackageId),
  );

  // Each renderer node has its own unique DOM target: canvas-renderer-{nodeId}
  const domId = `canvas-renderer-${id}`;

  // ── Self-register and keep in sync with its owner package ─────────────────
  useEffect(() => {
    if (!ownerPkg) return;

    if (!rendererEntry) {
      dispatch(
        registerRenderer({
          rendererId: id,
          label: data.label,
          packageId: activePackageId,
          runner: ownerPkg.runner,
          variables: ownerPkg.variables,
          functions: ownerPkg.functions,
          cdnPackages: [], // Each renderer starts with its own empty CDN list
        }),
      );
    } else {
      dispatch(
        syncRendererVariables({
          rendererId: id,
          variables: ownerPkg.variables,
        }),
      );
      dispatch(
        syncRendererFunctions({
          rendererId: id,
          functions: ownerPkg.functions,
        }),
      );
      dispatch(syncRendererRunner({ rendererId: id, runner: ownerPkg.runner }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ownerPkg?.variables,
    ownerPkg?.functions,
    ownerPkg?.runner,
    ownerPkg?.id,
  ]);

  // Disable canvas pan when mouse enters the renderer content so scrolling works
  const handleContentMouseEnter = () => {
    window.dispatchEvent(new CustomEvent("canvas-renderer-hover"));
  };
  const handleContentMouseLeave = () => {
    window.dispatchEvent(new CustomEvent("canvas-renderer-leave"));
  };

  return (
    <>
      {/* Resize handles — visible when node is selected */}
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineStyle={{ stroke: "#3b82f6", strokeWidth: 1.5 }}
        handleStyle={{
          fill: "#ffffff",
          stroke: "#3b82f6",
          strokeWidth: 1.5,
          width: 10,
          height: 10,
          borderRadius: 3,
        }}
      />

      <div
        className={cn(
          "flex flex-col bg-slate-900 border-2 rounded-xl shadow-xl overflow-hidden pointer-events-auto transition-colors",
          "w-full h-full",
          selected
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-slate-700",
        )}
      >
        {/* Browser-like Header */}
        <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-3 shrink-0 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-slate-900 px-3 py-0.5 rounded text-[10px] text-slate-400 font-mono flex items-center gap-1.5 border border-slate-700">
              <IconDeviceDesktop size={12} />
              <span>{data.label}</span>
              <span className="text-slate-600 ml-1">#{id.slice(0, 6)}</span>
            </div>
          </div>
        </div>

        {/* Render Target — nopan/nowheel tells ReactFlow to pass all events through */}
        <div
          id={domId}
          className="flex-1 bg-white overflow-auto p-2 nopan nowheel nodrag"
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
        />

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ top: "50%" }}
          className="!w-3 !h-3 !bg-gray-300 !border-2 !border-slate-800 hover:!bg-blue-400 transition-colors"
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ top: "50%" }}
          className="!w-3 !h-3 !bg-gray-300 !border-2 !border-slate-800 hover:!bg-blue-400 transition-colors"
        />
      </div>
    </>
  );
}
