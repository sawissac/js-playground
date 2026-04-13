"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface FunctionNodeData {
  label: string;
  nodeType: "function";
  linkedId?: string;
}

interface FunctionNodeProps {
  data: FunctionNodeData;
  selected?: boolean;
}

export function FunctionNode({ data, selected }: FunctionNodeProps) {
  return (
    <div className="relative">
      {/* Type label — top-left above shape */}
      <div className="absolute -top-5 left-0 text-[10px] text-muted-foreground font-medium select-none pointer-events-none">
        function
      </div>

      {/* Rectangle shape */}
      <div
        className={cn(
          "w-32 h-14 border-2 bg-white rounded-md flex items-center justify-center",
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

      {/* Left handle — target */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white hover:!bg-blue-400 !transition-colors"
      />

      {/* Right handle — source */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white hover:!bg-blue-400 !transition-colors"
      />
    </div>
  );
}
