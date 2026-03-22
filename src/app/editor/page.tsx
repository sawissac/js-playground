"use client";

import React, { useRef, useEffect, useState } from "react";
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
import CodeDetail from "@/features/code-detail";
import ProjectSidebar from "@/features/project-sidebar";
import RendererDialog from "@/features/renderer";
import { cn } from "@/lib/utils";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  MonitorPlayIcon,
} from "lucide-react";
import { FeatureErrorBoundary } from "@/components/ErrorBoundary";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SearchDialog } from "@/components/SearchDialog";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import {
  TutorialHints,
  useTutorialHints,
  TutorialHint,
} from "@/components/TutorialHints";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addPackage, addVariable } from "@/state/slices/editorSlice";
import {
  IconKeyboard,
  IconSearch as IconSearchIcon,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";

const Page = () => {
  const dispatch = useAppDispatch();
  const packages = useAppSelector((state) => state.editor.packages);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const [leftCollapsed, setLeftCollapsed] = React.useState(true);
  const [rightCollapsed, setRightCollapsed] = React.useState(true);
  const [rendererOpen, setRendererOpen] = useState(false);
  const codeDetailPanelRef = useRef<ImperativePanelHandle>(null);
  const [codeDetailCollapsed, setCodeDetailCollapsed] = React.useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { dismissedHints, dismissHint } = useTutorialHints();

  useEffect(() => {
    // Auto-collapse panels on mount
    setTimeout(() => {
      codeDetailPanelRef.current?.collapse();
    }, 100);
  }, []);

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

  const tutorialHints: TutorialHint[] = [
    {
      id: "welcome",
      title: "👋 Welcome to JS Playground!",
      description:
        "Start by creating variables, functions, and runners to build your interactive JavaScript projects.",
      action: {
        label: "Add Variable",
        onClick: () => {
          dispatch(addVariable({ id: uuidv4(), name: "myVar" }));
          dismissHint("welcome");
        },
      },
    },
  ].filter((hint) => !dismissedHints.has(hint.id));

  const shortcuts = [
    {
      key: "k",
      ctrl: true,
      description: "Open search",
      handler: () => setSearchOpen(true),
    },
    {
      key: "/",
      ctrl: true,
      description: "Show keyboard shortcuts",
      handler: () => setShortcutsOpen(true),
    },
    {
      key: "r",
      ctrl: true,
      description: "Open renderer",
      handler: () => setRendererOpen(true),
    },
    {
      key: "[",
      ctrl: true,
      description: "Toggle left panel",
      handler: toggleLeft,
    },
    {
      key: "]",
      ctrl: true,
      description: "Toggle right panel",
      handler: toggleRight,
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden">
      {/* Top Application Bar */}
      <ProjectSidebar onSearchClick={() => setSearchOpen(true)} />

      <div className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full">
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            {/* Left Panel — Definitions */}
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
              <div
                className={cn(
                  "flex flex-col gap-2 p-2 h-full overflow-y-auto",
                  "animate-in fade-in slide-in-from-left-4 duration-300",
                )}
              >
                <Badge variant="default" className="w-fit text-[10px]">
                  Variables
                </Badge>
                <FeatureErrorBoundary featureName="Variables">
                  <VariableContainer />
                </FeatureErrorBoundary>
                <hr className="border-border" />
                <FeatureErrorBoundary featureName="Data Types">
                  <DataTypeContainer />
                </FeatureErrorBoundary>
                <hr className="border-border" />
                <FeatureErrorBoundary featureName="Functions">
                  <FunctionsContainer />
                </FeatureErrorBoundary>
              </div>
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
                    title={
                      leftCollapsed ? "Show left panel" : "Hide left panel"
                    }
                  >
                    {leftCollapsed ? (
                      <PanelLeftOpenIcon className="size-3.5" />
                    ) : (
                      <PanelLeftCloseIcon className="size-3.5" />
                    )}
                    <span>{leftCollapsed ? "Definitions" : "Hide"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      Function Actions
                    </Badge>
                    <button
                      onClick={() => setRendererOpen(true)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        "bg-blue-50 text-blue-600 border border-blue-200",
                        "hover:bg-blue-100 hover:text-blue-700 transition-colors",
                      )}
                      title="Open Renderer"
                    >
                      <MonitorPlayIcon className="size-3" />
                      Renderer
                    </button>
                  </div>

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
                    <span>{rightCollapsed ? "Runner" : "Hide"}</span>
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
                  <FeatureErrorBoundary featureName="Function Definer">
                    <FunctionDefiner />
                  </FeatureErrorBoundary>
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
                    <FeatureErrorBoundary featureName="Runner">
                      <RunnerDefiner />
                    </FeatureErrorBoundary>
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
                    <FeatureErrorBoundary featureName="Code Detail">
                      <CodeDetail
                        onToggle={toggleCodeDetail}
                        isCollapsed={codeDetailCollapsed}
                      />
                    </FeatureErrorBoundary>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <RendererDialog open={rendererOpen} onOpenChange={setRendererOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />
      <TutorialHints
        hints={tutorialHints}
        onDismiss={dismissHint}
        position="bottom"
      />
    </div>
  );
};

export default Page;
