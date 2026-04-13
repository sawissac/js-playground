"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  IconPlus,
  IconPackage,
  IconChartBar,
  IconBrandD3,
  IconSparkles,
  IconCodeDots,
  IconX,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  loadDemoPackage,
  addPackage,
  setActivePackage,
} from "@/state/slices/editorSlice";
import { DEMO_PACKAGES } from "@/lib/demoPackages";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

interface StartupPageProps {
  onClose: () => void;
}

const DEMO_PRESETS = [
  {
    title: "D3 Bar Chart",
    desc: "Interactive bar chart with animations",
    icon: IconChartBar,
    color: "from-blue-500 to-cyan-500",
    demoKey: "d3-bar-chart",
  },
  {
    title: "Data Visualization",
    desc: "Dynamic network graph with D3.js",
    icon: IconBrandD3,
    color: "from-orange-500 to-red-500",
    demoKey: "data-visualization",
  },
  {
    title: "Creative Canvas",
    desc: "Generative art with canvas",
    icon: IconSparkles,
    color: "from-purple-500 to-pink-500",
    demoKey: "creative-canvas",
  },
  {
    title: "Hello World",
    desc: "Simple starter template",
    icon: IconCodeDots,
    color: "from-green-500 to-emerald-500",
    demoKey: "hello-world",
  },
];

export const StartupPage: React.FC<StartupPageProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const packages = useAppSelector((state) => state.editor.packages);

  const handleDemoClick = (demoKey: string) => {
    const demoPackage = DEMO_PACKAGES[demoKey];
    if (demoPackage) {
      const newPkg = JSON.parse(JSON.stringify(demoPackage));
      newPkg.id = uuidv4();
      dispatch(loadDemoPackage(newPkg));
      onClose();
    }
  };

  const handleCreatePackage = () => {
    dispatch(addPackage({ name: `Package ${packages.length + 1}` }));
    onClose();
  };

  const handleSelectPackage = (pkgId: string) => {
    dispatch(setActivePackage(pkgId));
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-sm font-bold text-foreground">Quick Start</h1>
          <p className="text-[10px] text-muted-foreground">
            Pick a template or open an existing package
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
          title="Close"
        >
          <IconX size={16} />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {/* Left: Workspace */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <IconPackage size={12} />
            Workspace
          </p>

          {/* New package */}
          <button
            onClick={handleCreatePackage}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all text-left group"
          >
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform text-primary shrink-0">
              <IconPlus size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold">New Blank Package</p>
              <p className="text-[10px] text-muted-foreground">
                Start fresh
              </p>
            </div>
          </button>

          {/* Existing packages */}
          <p className="text-[10px] font-semibold text-muted-foreground">
            Existing ({packages.length})
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
              >
                <span className="text-xs font-medium text-foreground truncate">
                  {pkg.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {pkg.variables?.length ?? 0}v · {pkg.functions?.length ?? 0}fn
                </span>
              </button>
            ))}
            {packages.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                No packages yet
              </p>
            )}
          </div>
        </div>

        {/* Right: Templates */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <IconSparkles size={12} />
            Starter Templates
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.demoKey}
                onClick={() => handleDemoClick(preset.demoKey)}
                className={cn(
                  "group flex flex-col gap-2 p-3 rounded-lg border border-border",
                  "hover:border-primary/40 hover:shadow-sm transition-all text-left bg-card",
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-md bg-gradient-to-br flex items-center justify-center shadow-sm shrink-0",
                    preset.color,
                  )}
                >
                  <preset.icon size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">
                    {preset.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {preset.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
