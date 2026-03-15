"use client";

import React, { useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import VariableContainer from "@/features/variable-container";
import DataTypeContainer from "@/features/data-type-container";
import { Badge } from "@/components/ui/badge";
import FunctionsContainer from "@/features/functions-container";
import FunctionDefiner from "@/features/function-definer";
import RunnerDefiner from "@/features/runner-definer";
import LogContainer from "@/features/log-container";
import CodeSidebar from "@/features/code-sidebar";
import CodeDetail from "@/features/code-detail";
import ProjectSidebar from "@/features/project-sidebar";
import { cn } from "@/lib/utils";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "lucide-react";

const Page = () => {
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);
  const codeDetailPanelRef = useRef<ImperativePanelHandle>(null);
  const logPanelRef = useRef<ImperativePanelHandle>(null);
  const [codeDetailCollapsed, setCodeDetailCollapsed] = React.useState(false);
  const [logCollapsed, setLogCollapsed] = React.useState(false);

  const toggleLeft = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  const toggleRight = () => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  const toggleCodeDetail = () => {
    const panel = codeDetailPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  const toggleLog = () => {
    const panel = logPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  return (
    <>
      {/* Desktop Layout (lg and up) */}
      <div className={cn("hidden lg:block w-full h-screen")}>
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          {/* Project Sidebar */}
          <ResizablePanel defaultSize={14} minSize={10} maxSize={20}>
            <ProjectSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Left Panel — Definitions + Code Preview */}
          <ResizablePanel
            ref={leftPanelRef}
            defaultSize={20}
            minSize={16}
            maxSize={30}
            collapsible
            collapsedSize={0}
            onCollapse={() => setLeftCollapsed(true)}
            onExpand={() => setLeftCollapsed(false)}
          >
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Definitions: Variables, DataTypes, Functions */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div
                  className={cn(
                    "flex flex-col gap-2 p-2 h-full overflow-y-auto",
                    "animate-in fade-in slide-in-from-left-4 duration-300",
                  )}
                >
                  <Badge variant="default" className="w-fit text-[10px]">
                    Variables
                  </Badge>
                  <VariableContainer />
                  <hr className="border-border" />
                  <DataTypeContainer />
                  <hr className="border-border" />
                  <FunctionsContainer />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />

              {/* Code Preview */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div
                  className={cn(
                    "h-full flex flex-col",
                    "animate-in fade-in slide-in-from-left-4 duration-300 delay-75",
                  )}
                >
                  <div className="shrink-0 px-2 py-1 bg-slate-900 border-b border-slate-700/50">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                      code preview
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CodeSidebar />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Center Panel — Function Actions (main editing area) */}
          <ResizablePanel defaultSize={36} minSize={28}>
            <div className="h-full flex flex-col">
              {/* Panel toggle toolbar */}
              <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-border bg-muted/30">
                <button
                  onClick={toggleLeft}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground",
                    "hover:bg-accent hover:text-accent-foreground transition-colors",
                  )}
                  title={leftCollapsed ? "Show left panel" : "Hide left panel"}
                >
                  {leftCollapsed ? (
                    <PanelLeftOpenIcon className="size-3.5" />
                  ) : (
                    <PanelLeftCloseIcon className="size-3.5" />
                  )}
                  <span className="hidden xl:inline">
                    {leftCollapsed ? "Definitions" : "Hide"}
                  </span>
                </button>

                <Badge variant="default" className="text-[10px]">
                  Function Actions
                </Badge>

                <button
                  onClick={toggleRight}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground",
                    "hover:bg-accent hover:text-accent-foreground transition-colors",
                  )}
                  title={
                    rightCollapsed ? "Show right panel" : "Hide right panel"
                  }
                >
                  <span className="hidden xl:inline">
                    {rightCollapsed ? "Runner" : "Hide"}
                  </span>
                  {rightCollapsed ? (
                    <PanelRightOpenIcon className="size-3.5" />
                  ) : (
                    <PanelRightCloseIcon className="size-3.5" />
                  )}
                </button>
              </div>

              {/* Function Actions content */}
              <div
                className={cn(
                  "flex-1 flex flex-col gap-2 p-2 overflow-y-auto",
                  "animate-in fade-in duration-300 delay-100",
                )}
              >
                <FunctionDefiner />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right Panel — Runner + Code Detail + Log */}
          <ResizablePanel
            ref={rightPanelRef}
            defaultSize={30}
            minSize={24}
            collapsible
            collapsedSize={0}
            onCollapse={() => setRightCollapsed(true)}
            onExpand={() => setRightCollapsed(false)}
          >
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Runner Flow */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div
                  className={cn(
                    "flex flex-col gap-2 p-2 h-full overflow-y-auto",
                    "animate-in fade-in slide-in-from-right-4 duration-300 delay-150",
                  )}
                >
                  <Badge variant="default" className="w-fit text-[10px]">
                    Runner Flow
                  </Badge>
                  <RunnerDefiner />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />

              {/* Code Detail — Objects + FlowChart tabs */}
              <ResizablePanel
                ref={codeDetailPanelRef}
                defaultSize={32}
                minSize={18}
                collapsible
                collapsedSize={5}
                onCollapse={() => setCodeDetailCollapsed(true)}
                onExpand={() => setCodeDetailCollapsed(false)}
              >
                <div
                  className={cn(
                    "h-full overflow-hidden",
                    "animate-in fade-in slide-in-from-right-4 duration-300 delay-200",
                  )}
                >
                  <CodeDetail onToggle={toggleCodeDetail} isCollapsed={codeDetailCollapsed} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />

              {/* Log */}
              <ResizablePanel
                ref={logPanelRef}
                defaultSize={28}
                minSize={12}
                collapsible
                collapsedSize={4}
                onCollapse={() => setLogCollapsed(true)}
                onExpand={() => setLogCollapsed(false)}
              >
                <div
                  className={cn(
                    "p-2 h-full overflow-y-auto bg-slate-800 relative",
                    "animate-in fade-in slide-in-from-bottom-4 duration-300 delay-250",
                  )}
                >
                  <LogContainer onToggle={toggleLog} isCollapsed={logCollapsed} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Tablet Layout (md to lg) — workflow-oriented 2-column */}
      <div
        className={cn(
          "hidden md:block lg:hidden w-full h-screen overflow-y-auto",
        )}
      >
        <div className="flex flex-col gap-2 p-2">
          {/* Row 0: Project Sidebar Full Width Option */}
          <div className="w-full bg-slate-50 border rounded-lg overflow-hidden h-64">
            <ProjectSidebar />
          </div>

          {/* Row 1: Definitions + Function Actions side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "flex flex-col gap-2",
                "animate-in fade-in slide-in-from-left-4 duration-300",
              )}
            >
              <Badge variant="default" className="w-fit text-[10px]">
                Variables
              </Badge>
              <VariableContainer />
              <hr className="border-border" />
              <DataTypeContainer />
              <hr className="border-border" />
              <FunctionsContainer />
            </div>
            <div
              className={cn(
                "flex flex-col gap-2",
                "animate-in fade-in slide-in-from-right-4 duration-300 delay-75",
              )}
            >
              <Badge variant="default" className="w-fit text-[10px]">
                Function Actions
              </Badge>
              <FunctionDefiner />
            </div>
          </div>

          {/* Row 2: Runner + Log side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "flex flex-col gap-2",
                "animate-in fade-in slide-in-from-left-4 duration-300 delay-150",
              )}
            >
              <Badge variant="default" className="w-fit text-[10px]">
                Runner Flow
              </Badge>
              <RunnerDefiner />
            </div>
            <div
              className={cn(
                "flex flex-col gap-2",
                "animate-in fade-in slide-in-from-right-4 duration-300 delay-200",
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-2 bg-slate-800 p-2 rounded-lg min-h-[200px]",
                )}
              >
                <LogContainer />
              </div>
            </div>
          </div>

          {/* Row 3: Code Detail full width */}
          <div
            className={cn(
              "rounded-lg border border-slate-200 overflow-hidden",
              "animate-in fade-in slide-in-from-bottom-4 duration-300 delay-250",
            )}
            style={{ minHeight: 300 }}
          >
            <CodeDetail />
          </div>
        </div>
      </div>

      {/* Mobile Layout (below md) — sequential workflow */}
      <div className={cn("block md:hidden w-full h-screen overflow-y-auto")}>
        <div className="flex flex-col gap-2 p-2">
          <div className="w-full bg-slate-50 border rounded-lg overflow-hidden h-64">
            <ProjectSidebar />
          </div>
          {/* Step 1: Define */}
          <div
            className={cn(
              "flex flex-col gap-2",
              "animate-in fade-in slide-in-from-top-4 duration-300",
            )}
          >
            <Badge variant="default" className="w-fit text-[10px]">
              Variables
            </Badge>
            <VariableContainer />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-2",
              "animate-in fade-in duration-300 delay-75",
            )}
          >
            <DataTypeContainer />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-2",
              "animate-in fade-in duration-300 delay-100",
            )}
          >
            <FunctionsContainer />
          </div>

          {/* Step 2: Build */}
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-2",
              "animate-in fade-in duration-300 delay-150",
            )}
          >
            <Badge variant="default" className="w-fit text-[10px]">
              Function Actions
            </Badge>
            <FunctionDefiner />
          </div>

          {/* Step 3: Execute */}
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-2",
              "animate-in fade-in duration-300 delay-200",
            )}
          >
            <Badge variant="default" className="w-fit text-[10px]">
              Runner Flow
            </Badge>
            <RunnerDefiner />
          </div>

          {/* Step 4: Inspect */}
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-2 bg-slate-800 p-2 rounded-lg min-h-[240px]",
              "animate-in fade-in duration-300 delay-225",
            )}
          >
            <LogContainer />
          </div>
          <div
            className={cn(
              "rounded-lg border border-slate-200 overflow-hidden",
              "animate-in fade-in slide-in-from-bottom-4 duration-300 delay-250",
            )}
            style={{ height: 320 }}
          >
            <CodeDetail />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
