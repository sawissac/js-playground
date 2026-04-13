"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  setActivePackage,
  reorderPackages,
  addCdnPackage,
  removeCdnPackage,
  toggleCdnPackage,
  updateCdnPackage,
  togglePackageEnabled,
} from "@/state/slices/editorSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconCopy,
  IconCheck,
  IconGripVertical,
  IconSparkles,
  IconTrash,
  IconPackage,
  IconRun,
  IconPlus,
  IconWorld,
  IconPencil,
  IconMaximize,
  IconMinimize,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useRunner } from "@/hooks/useRunner";
import PromptDialog from "./prompt-dialog";
import { validateCDNUrl } from "@/lib/cdnSecurity";
import { auditLog } from "@/lib/securityAudit";
import { addLog } from "@/state/slices/logSlice";

const PREDEFINED_CDN_PACKAGES = [
  { name: "d3", url: "https://cdn.jsdelivr.net/npm/d3@7" },
  { name: "lodash", url: "https://cdn.jsdelivr.net/npm/lodash@4" },
  { name: "axios", url: "https://cdn.jsdelivr.net/npm/axios@1" },
  { name: "three", url: "https://cdn.jsdelivr.net/npm/three@0.160" },
  { name: "chart.js", url: "https://cdn.jsdelivr.net/npm/chart.js@4" },
  { name: "moment", url: "https://cdn.jsdelivr.net/npm/moment@2" },
  { name: "gsap", url: "https://cdn.jsdelivr.net/npm/gsap@3" },
  { name: "p5", url: "https://cdn.jsdelivr.net/npm/p5@1" },
  { name: "jquery", url: "https://code.jquery.com/jquery-3.7.1.min.js" },
  { name: "dayjs", url: "https://cdn.jsdelivr.net/npm/dayjs@1" },
];

const RendererPanel = ({ onClose }: { onClose?: () => void }) => {
  const dispatch = useAppDispatch();
  const projectId = useAppSelector((s) => s.editor.projectId);
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const packages = useAppSelector((s) => s.editor.packages);
  const activePackage = packages.find((p) => p.id === activePackageId)!;
  const cdnPackages = activePackage.cdnPackages || [];

  const logs = useAppSelector((s) => s.log.logs);
  const errorCount = logs.filter((l) => l.type === "error").length;
  const warningCount = logs.filter((l) => l.type === "warning").length;

  const rendererId = `renderer-${projectId}`;
  const [mounting, setMounting] = useState(true);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounting(false));
    return () => cancelAnimationFrame(t);
  }, []);

  const [copied, setCopied] = useState(false);
  const [dragState, setDragState] = useState<{
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({ dragIndex: null, dragOverIndex: null });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAddCdn, setShowAddCdn] = useState(false);
  const [showPredefinedCdn, setShowPredefinedCdn] = useState(false);
  const [cdnName, setCdnName] = useState("");
  const [cdnUrl, setCdnUrl] = useState("");
  const [editingCdnId, setEditingCdnId] = useState<string | null>(null);
  const [editCdnName, setEditCdnName] = useState("");
  const [editCdnUrl, setEditCdnUrl] = useState("");
  const [cdnValidationWarnings, setCdnValidationWarnings] = useState<string[]>(
    [],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rendererRef = React.useRef<HTMLDivElement>(null);
  
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.pageX;
      setSidebarWidth(Math.max(200, Math.min(600, startWidth + deltaX)));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const { run } = useRunner();

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await rendererRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Check all enabled packages for valid runners and typed variables
  const enabledPackages = packages.filter((p) => p.enabled !== false);
  const allTyped = enabledPackages.every(
    (pkg) => pkg.variables.length === 0 || pkg.variables.every((v) => v.type),
  );
  const runDisabled =
    enabledPackages.length === 0 ||
    enabledPackages.every((pkg) => pkg.runner.length === 0) ||
    !enabledPackages.every((pkg) =>
      pkg.runner.every((r) => {
        if (r.type === "code") return !!r.target[0];
        return r.target[0] && r.target[1];
      }),
    );

  const handleCopyId = () => {
    navigator.clipboard.writeText(rendererId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearRenderer = () => {
    const el = document.getElementById(rendererId);
    if (el) el.innerHTML = "";
  };

  const handleDragStart = (index: number) => {
    setDragState({ dragIndex: index, dragOverIndex: null });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragState.dragIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  };

  const handleDragEnd = () => {
    setDragState({ dragIndex: null, dragOverIndex: null });
  };

  const handleDrop = (toIndex: number) => {
    if (dragState.dragIndex !== null && dragState.dragIndex !== toIndex) {
      dispatch(
        reorderPackages({
          fromIndex: dragState.dragIndex,
          toIndex,
        }),
      );
    }
    setDragState({ dragIndex: null, dragOverIndex: null });
  };

  const handleAddCdn = () => {
    if (cdnName.trim() && cdnUrl.trim()) {
      const validation = validateCDNUrl(cdnUrl.trim());

      if (!validation.valid) {
        dispatch(
          addLog({
            type: "error",
            message: `CDN validation failed: ${validation.errors.join(", ")}`,
            context: "cdn-security",
          }),
        );
        setCdnValidationWarnings(validation.errors);
        return;
      }

      if (validation.warnings.length > 0) {
        dispatch(
          addLog({
            type: "warning",
            message: `CDN warnings: ${validation.warnings.join(", ")}`,
            context: "cdn-security",
          }),
        );
        auditLog.cdnSecurityWarning(cdnUrl.trim(), validation.warnings);
        setCdnValidationWarnings(validation.warnings);
      } else {
        setCdnValidationWarnings([]);
      }

      dispatch(addCdnPackage({ name: cdnName.trim(), url: cdnUrl.trim() }));
      auditLog.cdnLoad(cdnUrl.trim(), true, validation.trusted, {
        name: cdnName.trim(),
        packageName: activePackage.name,
      });

      setCdnName("");
      setCdnUrl("");
      setShowAddCdn(false);
    }
  };

  const handleAddPredefinedCdn = (name: string, url: string) => {
    dispatch(addCdnPackage({ name, url }));
    setShowPredefinedCdn(false);
  };

  const handleStartEditCdn = (cdn: {
    id: string;
    name: string;
    url: string;
  }) => {
    setEditingCdnId(cdn.id);
    setEditCdnName(cdn.name);
    setEditCdnUrl(cdn.url);
  };

  const handleSaveEditCdn = () => {
    if (editingCdnId && editCdnName.trim() && editCdnUrl.trim()) {
      const validation = validateCDNUrl(editCdnUrl.trim());

      if (!validation.valid) {
        dispatch(
          addLog({
            type: "error",
            message: `CDN validation failed: ${validation.errors.join(", ")}`,
            context: "cdn-security",
          }),
        );
        return;
      }

      if (validation.warnings.length > 0) {
        dispatch(
          addLog({
            type: "warning",
            message: `CDN warnings: ${validation.warnings.join(", ")}`,
            context: "cdn-security",
          }),
        );
        auditLog.cdnSecurityWarning(editCdnUrl.trim(), validation.warnings);
      }

      dispatch(
        updateCdnPackage({
          id: editingCdnId,
          name: editCdnName.trim(),
          url: editCdnUrl.trim(),
        }),
      );
      auditLog.cdnLoad(editCdnUrl.trim(), true, validation.trusted, {
        name: editCdnName.trim(),
        packageName: activePackage.name,
      });
      setEditingCdnId(null);
    }
  };

  if (mounting) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-xs">Loading renderer…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Panel Header */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50/80">
          <span className="text-xs font-semibold text-slate-700">Renderer</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {rendererId}
          </Badge>
          <p className="text-[10px] text-muted-foreground hidden lg:block">
            DOM render target — use the element ID to manipulate from code.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              title="Close renderer"
            >
              <IconX size={14} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden min-h-0 p-2 md:p-3">
          {/* Left: Render Area */}
          <div className="flex-none md:flex-1 flex flex-col gap-2 min-w-0 min-h-[50vh] md:min-h-0">
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                Render Area
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={handleCopyId}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? "Copied!" : "Copy ID"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={handleClearRenderer}
              >
                <IconTrash size={12} />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={toggleFullscreen}
                title={
                  isFullscreen
                    ? "Exit fullscreen (Esc)"
                    : "Enter fullscreen (F11)"
                }
              >
                {isFullscreen ? (
                  <IconMinimize size={12} />
                ) : (
                  <IconMaximize size={12} />
                )}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 text-[10px] gap-1 md:ml-auto",
                  errorCount > 0
                    ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                    : warningCount > 0
                      ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700"
                      : "text-slate-600",
                )}
                onClick={() => {
                  onClose?.();
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent("force-open-tab", { detail: "log" }),
                    );
                  }, 100);
                }}
                title="View Logs"
              >
                <IconTerminal2 size={12} />
                Logs {logs.length > 0 && `(${logs.length})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={() => setShowPrompt(true)}
              >
                <IconSparkles size={12} />
                Prompt
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-6 text-[10px] gap-1"
                disabled={runDisabled || !allTyped}
                onClick={run}
                title={
                  runDisabled
                    ? "Complete all runner steps first"
                    : !allTyped
                      ? "All variables need a type first"
                      : "Execute all runner steps"
                }
              >
                <IconRun size={12} />
                Run
              </Button>
            </div>
            <div
              ref={rendererRef}
              id={rendererId}
              className="flex-1 rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-auto relative"
              style={{ minHeight: 200 }}
            />
          </div>

          {/* Right: Package List + CDN Packages */}
          <div 
            className="shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-2 pl-0 md:pl-4 overflow-visible md:overflow-hidden gap-4 pb-2 relative"
            style={{ width: isMobile ? '100%' : sidebarWidth }}
          >
            {/* Drag Handle */}
            {!isMobile && (
              <div
                className="absolute top-0 bottom-0 left-[-4px] w-2 cursor-col-resize hover:bg-blue-500/20 z-10 transition-colors"
                onMouseDown={handleSidebarResizeStart}
              />
            )}
            {/* Top Half: Project Packages */}
            <div className="flex-none md:flex-1 min-h-[300px] md:min-h-0 flex flex-col">
              <div className="shrink-0 mb-2 pr-0 md:pr-4">
                <Badge variant="secondary" className="text-[10px] w-fit mb-1">
                  Packages
                </Badge>
                <p className="text-[10px] text-muted-foreground">
                  Select active package. Drag to reorder.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 md:pr-2 min-h-0 pb-2">
                {packages.map((pkg, index) => {
                  const isActive = pkg.id === activePackageId;
                  const isEnabled = pkg.enabled !== false;
                  return (
                    <div
                      key={pkg.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={() => handleDrop(index)}
                      onClick={() => dispatch(setActivePackage(pkg.id))}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-move transition-all",
                        !isEnabled && "opacity-50",
                        isActive
                          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100",
                        dragState.dragIndex === index && "opacity-40 scale-95",
                        dragState.dragOverIndex === index &&
                          "border-blue-400 border-2",
                      )}
                    >
                      <IconGripVertical
                        size={14}
                        className="shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing"
                      />
                      <div
                        className={cn(
                          "p-1 rounded-full",
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-200 text-slate-500",
                        )}
                      >
                        <IconPackage size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-xs truncate block",
                            isActive
                              ? "font-semibold text-slate-800"
                              : "font-medium text-slate-600",
                          )}
                        >
                          {pkg.name}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {pkg.variables.length} vars · {pkg.functions.length}{" "}
                          fns · {pkg.runner.length} steps
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() =>
                            dispatch(togglePackageEnabled(pkg.id))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Half: CDN Packages */}
            <hr className="border-slate-200 shrink-0 mr-0 md:mr-4 hidden md:block" />

            <div className="flex-none md:flex-1 min-h-[300px] md:min-h-0 flex flex-col pb-2 border-t md:border-t-0 border-slate-200 pt-4 md:pt-0">
              <div className="shrink-0 mb-2 pr-0 md:pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] w-fit">
                    CDN Packages
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 text-[10px] gap-0.5 ml-auto px-1.5"
                    onClick={() => {
                      setShowPredefinedCdn(!showPredefinedCdn);
                      setShowAddCdn(false);
                    }}
                  >
                    <IconSparkles size={10} />
                    Quick
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 text-[10px] gap-0.5 px-1.5"
                    onClick={() => {
                      setShowAddCdn(!showAddCdn);
                      setShowPredefinedCdn(false);
                    }}
                  >
                    <IconPlus size={10} />
                    Custom
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  CDN libraries available in code blocks. Toggle to
                  enable/disable.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 md:pr-2 min-h-0">
                {showPredefinedCdn && (
                  <div className="space-y-1 p-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 shrink-0">
                    <p className="text-[10px] font-medium text-blue-700 mb-1">
                      Popular CDN Libraries
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {PREDEFINED_CDN_PACKAGES.map((pkg) => {
                        const alreadyAdded = cdnPackages.some(
                          (c) => c.name === pkg.name,
                        );
                        return (
                          <Button
                            key={pkg.name}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-6 text-[10px] justify-start",
                              alreadyAdded && "opacity-50 cursor-not-allowed",
                            )}
                            onClick={() =>
                              handleAddPredefinedCdn(pkg.name, pkg.url)
                            }
                            disabled={alreadyAdded}
                          >
                            <IconWorld size={10} className="mr-1" />
                            {pkg.name}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] w-full"
                      onClick={() => setShowPredefinedCdn(false)}
                    >
                      Close
                    </Button>
                  </div>
                )}

                {showAddCdn && (
                  <div className="space-y-1.5 p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 shrink-0">
                    <Input
                      type="text"
                      value={cdnName}
                      onChange={(e) => setCdnName(e.target.value)}
                      placeholder="Name (e.g. lodash)"
                      className="h-6 text-[10px] rounded-lg"
                    />
                    <Input
                      type="text"
                      value={cdnUrl}
                      onChange={(e) => {
                        setCdnUrl(e.target.value);
                        setCdnValidationWarnings([]);
                      }}
                      placeholder="URL (e.g. https://cdn.jsdelivr.net/npm/lodash)"
                      className="h-6 text-[10px] rounded-lg"
                    />
                    {cdnValidationWarnings.length > 0 && (
                      <div className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-1.5 space-y-0.5">
                        {cdnValidationWarnings.map((warning, i) => (
                          <div key={i}>⚠️ {warning}</div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-5 text-[10px] flex-1"
                        onClick={handleAddCdn}
                        disabled={!cdnName.trim() || !cdnUrl.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-[10px] flex-1"
                        onClick={() => {
                          setShowAddCdn(false);
                          setCdnName("");
                          setCdnUrl("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {cdnPackages.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">
                      No CDN packages added.
                    </p>
                  )}
                  {cdnPackages.map((cdn) =>
                    editingCdnId === cdn.id ? (
                      <div
                        key={cdn.id}
                        className="space-y-1.5 p-2 rounded-lg border border-blue-300 bg-blue-50"
                      >
                        <Input
                          type="text"
                          value={editCdnName}
                          onChange={(e) => setEditCdnName(e.target.value)}
                          placeholder="Name"
                          className="h-6 text-[10px] rounded-lg"
                        />
                        <Input
                          type="text"
                          value={editCdnUrl}
                          onChange={(e) => setEditCdnUrl(e.target.value)}
                          placeholder="URL"
                          className="h-6 text-[10px] rounded-lg"
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-5 text-[10px] flex-1"
                            onClick={handleSaveEditCdn}
                            disabled={!editCdnName.trim() || !editCdnUrl.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 text-[10px] flex-1"
                            onClick={() => setEditingCdnId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={cdn.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                          cdn.enabled
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-slate-50 border-slate-200 opacity-60",
                        )}
                      >
                        <div
                          className={cn(
                            "p-1 rounded-full",
                            cdn.enabled
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-200 text-slate-400",
                          )}
                        >
                          <IconWorld size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-semibold truncate block",
                              cdn.enabled ? "text-slate-800" : "text-slate-500",
                            )}
                          >
                            {cdn.name}
                          </span>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {cdn.url}
                          </p>
                        </div>
                        <Switch
                          checked={cdn.enabled}
                          onCheckedChange={() =>
                            dispatch(toggleCdnPackage(cdn.id))
                          }
                        />
                        <button
                          onClick={() => handleStartEditCdn(cdn)}
                          className="p-0.5 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <IconPencil size={12} />
                        </button>
                        <button
                          onClick={() => dispatch(removeCdnPackage(cdn.id))}
                          className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        rendererId={rendererId}
      />
    </>
  );
};

export default RendererPanel;
