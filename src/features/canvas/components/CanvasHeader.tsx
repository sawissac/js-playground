import React from "react";
import { PackageInterface } from "@/state/types";
import {
  IconArrowLeft,
  IconLayersSubtract,
  IconLayoutGrid,
  IconSelectAll,
  IconVariable,
  IconFunction,
} from "@tabler/icons-react";

export const CanvasHeader = ({
  onClose,
  activePkg,
  handleAutoLayout,
  handleSelectAll,
}: {
  onClose: () => void;
  activePkg?: PackageInterface;
  handleAutoLayout: () => void;
  handleSelectAll: () => void;
}) => {
  const varCount = activePkg?.variables?.length ?? 0;
  const funcCount = activePkg?.functions?.length ?? 0;

  return (
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
  );
};
