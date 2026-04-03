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
  IconSearch,
  IconBug,
  IconPlayerPlay,
  IconSearch as IconSearchIcon,
  IconSparkles,
  IconVariable,
  IconFunction,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import { PackageInspector } from "@/components/PackageInspector";
import { StatusBar } from "@/components/StatusBar";
import { AskAiOverlay } from "@/components/AskAiOverlay";
import { motion, useDragControls } from "framer-motion";

type MobileTab = "definitions" | "actions" | "runner";

const Page = () => {
  const dispatch = useAppDispatch();
  const dragControls = useDragControls();
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
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const { dismissedHints, dismissHint } = useTutorialHints();
  const [mobileTab, setMobileTab] = useState<MobileTab>("actions");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // Auto-collapse panels on mount
    setTimeout(() => {
      leftPanelRef.current?.collapse();
      rightPanelRef.current?.collapse();
      codeDetailPanelRef.current?.collapse();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const switchCodeTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent("force-open-tab", { detail: tab }));
  };

  useEffect(() => {
    const handleForceOpenTab = (e: CustomEvent<string>) => {
      const tab = e.detail;
      window.dispatchEvent(new CustomEvent("change-code-tab", { detail: tab }));
      if (isMobile) {
        setMobileTab("runner");
        return;
      }
      if (rightPanelRef.current?.isCollapsed()) {
        rightPanelRef.current.expand();
      }
      setTimeout(() => {
        if (codeDetailPanelRef.current?.isCollapsed()) {
          codeDetailPanelRef.current.expand();
        }
      }, 50);
    };

    window.addEventListener("force-open-tab", handleForceOpenTab as EventListener);
    return () => window.removeEventListener("force-open-tab", handleForceOpenTab as EventListener);
  }, [isMobile]);

  const shortcuts = [
    {
      key: "c",
      ctrl: true,
      description: "Code preview tab",
      handler: () => switchCodeTab("code"),
      preventDefault: false,
    },
    {
      key: "o",
      ctrl: true,
      description: "Objects tab",
      handler: () => switchCodeTab("objects"),
    },
    {
      key: "f",
      ctrl: true,
      description: "Flow Chart tab",
      handler: () => switchCodeTab("flowchart"),
    },
    {
      key: "p",
      ctrl: true,
      description: "Export preview tab",
      handler: () => switchCodeTab("export"),
    },
    {
      key: "l",
      ctrl: true,
      description: "Log tab",
      handler: () => switchCodeTab("log"),
    },
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
      key: "i",
      ctrl: true,
      description: "Open package inspector",
      handler: () => setInspectorOpen(!inspectorOpen),
    },
    {
      key: "r",
      ctrl: true,
      description: "Open renderer",
      handler: () => setRendererOpen(true),
    },
    {
      key: "j",
      ctrl: true,
      description: "Ask AI",
      handler: () => setAskAiOpen(true),
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

  const statusBarShortcuts = [
    {
      icon: <IconSearch size={12} />,
      label: "Search",
      shortcut: "K",
      onClick: () => setSearchOpen(true),
    },
    {
      icon: <IconBug size={12} />,
      label: "Inspector",
      shortcut: "I",
      onClick: () => setInspectorOpen(true),
    },
    {
      icon: <IconKeyboard size={12} />,
      label: "Shortcuts",
      shortcut: "/",
      onClick: () => setShortcutsOpen(true),
    },
    {
      icon: <IconPlayerPlay size={12} />,
      label: "Run",
      shortcut: "R",
      onClick: () => setRendererOpen(true),
    },
    {
      icon: <IconSparkles size={12} />,
      label: "Ask AI",
      shortcut: "J",
      onClick: () => setAskAiOpen(true),
    },
  ];

  const mobileTabs = [
    { id: "definitions" as MobileTab, label: "Definitions", icon: IconVariable },
    { id: "actions" as MobileTab, label: "Actions", icon: IconFunction },
    { id: "runner" as MobileTab, label: "Runner", icon: IconPlayerPlay },
  ];

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden">
      {/* Top Application Bar */}
      <ProjectSidebar />

      <div className="flex-1 w-full overflow-hidden">
        {isMobile ? (
          /* ── Mobile Layout: single panel with bottom tab switcher ── */
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              {mobileTab === "definitions" && (
                <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-300">
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
              )}

              {mobileTab === "actions" && (
                <div className="h-full flex flex-col animate-in fade-in duration-300">
                  <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-border bg-muted/30">
                    <Badge variant="default" className="text-[10px]">
                      Function Actions
                    </Badge>
                    <div className="flex items-center gap-2">
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
                      <button
                        onClick={() => setAskAiOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          "bg-purple-50 text-purple-600 border border-purple-200",
                          "hover:bg-purple-100 hover:text-purple-700 transition-colors",
                        )}
                        title="Ask AI"
                      >
                        <IconSparkles className="size-3" />
                        Ask AI
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="w-full p-2">
                      <FeatureErrorBoundary featureName="Function Definer">
                        <FunctionDefiner />
                      </FeatureErrorBoundary>
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === "runner" && (
                <div className="h-full flex flex-col gap-2 p-2 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                  <Badge variant="default" className="w-fit text-[10px]">
                    Runner Flow
                  </Badge>
                  <FeatureErrorBoundary featureName="Runner">
                    <RunnerDefiner />
                  </FeatureErrorBoundary>
                  <hr className="border-border" />
                  <FeatureErrorBoundary featureName="Code Detail">
                    <CodeDetail onToggle={() => {}} isCollapsed={false} />
                  </FeatureErrorBoundary>
                </div>
              )}
            </div>

            {/* Mobile bottom tab bar */}
            <div className="shrink-0 flex items-stretch border-t border-border bg-background">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    mobileTab === tab.id
                      ? "text-primary border-t-2 border-primary -mt-px"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Desktop Layout: 3-panel resizable ── */
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
                      <button
                        onClick={() => setAskAiOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          "bg-purple-50 text-purple-600 border border-purple-200",
                          "hover:bg-purple-100 hover:text-purple-700 transition-colors",
                        )}
                        title="Ask AI (Ctrl+J)"
                      >
                        <IconSparkles className="size-3" />
                        Ask AI
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
                      "flex-1 flex flex-col overflow-y-auto",
                      "animate-in fade-in duration-300 delay-100",
                    )}
                  >
                    <div className="w-full max-w-[700px] mx-auto p-2">
                      <FeatureErrorBoundary featureName="Function Definer">
                        <FunctionDefiner />
                      </FeatureErrorBoundary>
                    </div>
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
        )}
      </div>

      <RendererDialog open={rendererOpen} onOpenChange={setRendererOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />

      {/* Package Inspector Dialog */}
      {inspectorOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed inset-0 m-auto w-[calc(100vw-2rem)] sm:w-80 lg:w-96 pointer-events-auto h-[min(calc(100vh-6rem),800px)] flex flex-col"
          >
            <div className="h-full bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200 flex flex-col pointer-events-auto">
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-move bg-slate-50/80 rounded-t-lg"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <h3 className="font-semibold text-sm">Package Inspector</h3>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                  title="Close (Ctrl/Cmd+I)"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PackageInspector />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AskAiOverlay open={askAiOpen} onClose={() => setAskAiOpen(false)} />

      <TutorialHints
        hints={tutorialHints}
        onDismiss={dismissHint}
        position="bottom"
      />

      {/* Status Bar */}
      <StatusBar shortcuts={statusBarShortcuts} />
    </div>
  );
};

export default Page;
