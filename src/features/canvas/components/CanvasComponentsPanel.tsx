import React from "react";
import { cn } from "@/lib/utils";
import {
  IconVariable,
  IconFunction,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PackageInterface } from "@/state/types";
import { CanvasNode } from "@/state/slices/canvasSlice";

export const CanvasComponentsPanel = ({
  showComponents,
  setShowComponents,
  activePkg,
  currentCanvasNodes,
}: {
  showComponents: boolean;
  setShowComponents: React.Dispatch<React.SetStateAction<boolean>>;
  activePkg?: PackageInterface;
  currentCanvasNodes: CanvasNode[];
}) => {
  return (
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
                const hasNode = currentCanvasNodes.some(
                  (n) => n.data?.linkedId === v.id,
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
                const hasNode = currentCanvasNodes.some(
                  (n) => n.data?.linkedId === f.id,
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
  );
};
