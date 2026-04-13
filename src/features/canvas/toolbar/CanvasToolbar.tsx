"use client";

import { cn } from "@/lib/utils";
import {
  IconLayoutGrid,
  IconSelectAll,
  IconBraces,
  IconFunction,
  IconDeviceDesktop,
} from "@tabler/icons-react";

interface CanvasToolbarProps {
  onAddVariable: () => void;
  onAddFunction: () => void;
  onAddRenderer: () => void;
  onAutoLayout: () => void;
  onSelectAll: () => void;
}

interface ToolItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  accent: string;
  glow: string;
}

export function CanvasToolbar({
  onAddVariable,
  onAddFunction,
  onAddRenderer,
  onAutoLayout,
  onSelectAll,
}: CanvasToolbarProps) {
  const primaryTools: ToolItem[] = [
    {
      label: "Variable",
      icon: <IconBraces size={16} strokeWidth={1.5} />,
      onClick: onAddVariable,
      title: "Add Variable node",
      accent: "hover:bg-gray-50",
      glow: "",
    },
    {
      label: "Function",
      icon: <IconFunction size={16} strokeWidth={1.5} />,
      onClick: onAddFunction,
      title: "Add Function node",
      accent: "hover:bg-gray-50",
      glow: "",
    },
    {
      label: "Renderer",
      icon: <IconDeviceDesktop size={16} strokeWidth={1.5} />,
      onClick: onAddRenderer,
      title: "Add Renderer node",
      accent: "hover:bg-gray-50",
      glow: "",
    },
  ];

  const utilTools: ToolItem[] = [
    {
      label: "Layout",
      icon: <IconLayoutGrid size={16} strokeWidth={1.5} />,
      onClick: onAutoLayout,
      title: "Auto-arrange nodes",
      accent: "hover:bg-gray-50",
      glow: "",
    },
    {
      label: "Select All",
      icon: <IconSelectAll size={16} strokeWidth={1.5} />,
      onClick: onSelectAll,
      title: "Select all nodes (Ctrl+A)",
      accent: "hover:bg-gray-50",
      glow: "",
    },
  ];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-auto select-none">
      <div
        className={cn(
          "flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl",
          "bg-white/98 backdrop-blur-sm",
          "border border-gray-200/60",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
        )}
      >
        {/* Primary tools */}
        {primaryTools.map((tool) => (
          <button
            key={tool.label}
            onClick={tool.onClick}
            title={tool.title}
            className={cn(
              "group relative flex items-center justify-center p-2 rounded-xl",
              "text-slate-400 border border-transparent",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
              "active:scale-[0.95]",
              tool.accent,
            )}
          >
            {tool.icon}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 mx-0.5 bg-gray-200/60" />

        {/* Utility tools */}
        {utilTools.map((tool) => (
          <button
            key={tool.label}
            onClick={tool.onClick}
            title={tool.title}
            className={cn(
              "group relative flex items-center justify-center p-2 rounded-xl",
              "text-slate-400 border border-transparent",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
              "active:scale-[0.95]",
              tool.accent,
            )}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
