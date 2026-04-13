"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface VariableNodeData {
  label: string;
  nodeType: "variable";
  linkedId?: string;
}

interface VariableNodeProps {
  data: VariableNodeData;
  selected?: boolean;
}

export function VariableNode({ data, selected }: VariableNodeProps) {
  return (
    <div className="relative">
      {/* Type label — top-left above shape */}
      <div className="absolute -top-5 left-0 text-[10px] text-muted-foreground font-medium select-none pointer-events-none">
        variable
      </div>

      {/* Circle shape */}
      <div
        className={cn(
          "w-20 h-20 rounded-full border-2 bg-white flex items-center justify-center",
          "transition-all duration-150 cursor-pointer",
          selected
            ? "border-blue-500 shadow-lg shadow-blue-100 bg-blue-50"
            : "border-gray-400 hover:border-gray-600 hover:shadow-md"
        )}
      >
        <span className="text-sm font-semibold text-gray-700 select-none">
          {data.label}
        </span>
      </div>

      {/* Left handle — target (receives connections) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white hover:!bg-blue-400 !transition-colors"
      />

      {/* Right handle — source (sends connections) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white hover:!bg-blue-400 !transition-colors"
      />
    </div>
  );
}
