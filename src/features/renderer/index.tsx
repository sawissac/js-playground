"use client";

import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useRunner } from "@/hooks/useRunner";
import PromptDialog from "./prompt-dialog";
import { validateCDNUrl, VERIFIED_CDN_PACKAGES } from "@/lib/cdnSecurity";
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

const RendererDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const dispatch = useAppDispatch();
  const projectId = useAppSelector((s) => s.editor.projectId);
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const packages = useAppSelector((s) => s.editor.packages);
  const activePackage = packages.find((p) => p.id === activePackageId)!;
  const runner = activePackage.runner;
  const variables = activePackage.variables;
  const cdnPackages = activePackage.cdnPackages || [];

  const rendererId = `renderer-${projectId}`;
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

  const { run } = useRunner();

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
      // Validate CDN URL
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

      // Show warnings for untrusted domains
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
      // Validate CDN URL
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

      // Show warnings for untrusted domains
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)] h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex flex-col"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              Renderer
              <Badge variant="outline" className="text-[10px] font-mono">
                {rendererId}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              DOM render target for your code. Use the element ID to manipulate
              the renderer from code blocks.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
            {/* Left: Render Area */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
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
                  className="h-6 text-[10px] gap-1 ml-auto"
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
                id={rendererId}
                className="flex-1 rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-auto relative"
                style={{ minHeight: 200 }}
              />
            </div>

            {/* Right: Package List + CDN Packages */}
            <div className="w-72 shrink-0 flex flex-col gap-2 border-l border-slate-200 pl-4 overflow-y-auto">
              {/* Project Packages */}
              <Badge variant="secondary" className="text-[10px] w-fit">
                Packages
              </Badge>
              <p className="text-[10px] text-muted-foreground">
                Select active package. Drag to reorder.
              </p>
              <div className="space-y-1.5">
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

              {/* CDN Packages */}
              <hr className="border-slate-200" />
              <div className="flex items-center gap-2">
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

              {showPredefinedCdn && (
                <div className="space-y-1 p-2 rounded-lg border border-dashed border-blue-300 bg-blue-50">
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
                <div className="space-y-1.5 p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50">
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
        </DialogContent>
      </Dialog>

      <PromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        rendererId={rendererId}
      />
    </>
  );
};

export default RendererDialog;
