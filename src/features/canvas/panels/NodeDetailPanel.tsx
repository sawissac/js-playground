"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  updateVariableValue,
  updateVariable,
  updateFunctionName,
  removeVariable,
  removeFunctionName,
} from "@/state/slices/editorSlice";
import {
  renameCanvasNode,
  removeCanvasNode,
  setSelectedCanvasNode,
} from "@/state/slices/canvasSlice";
import {
  registerRenderer,
  unregisterRenderer,
  syncRendererVariables,
  syncRendererRunner,
  syncRendererFunctions,
  addRendererCdnPackage,
  removeRendererCdnPackage,
  toggleRendererCdnPackage,
  setRendererCdnPackages,
} from "@/state/slices/canvasRunnerSlice";
import { canvasRunnerPersistenceService } from "@/lib/canvasRunnerPersistence";
import type { CanvasNode } from "@/state/slices/canvasSlice";
import { cn } from "@/lib/utils";
import {
  IconX,
  IconTrash,
  IconPencil,
  IconCheck,
  IconPlayerPlay,
  IconVariable,
  IconFunction,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconCopy,
} from "@tabler/icons-react";
import LogContainer from "@/features/log-container";
import CodeSidebar from "@/features/code-sidebar";
import FunctionDefiner from "@/features/function-definer";
import { useCanvasRunner } from "@/hooks/useCanvasRunner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconWorld } from "@tabler/icons-react";

interface NodeDetailPanelProps {
  node: CanvasNode;
  onOpenRenderer?: () => void;
}

// ─── Variable Panel ───────────────────────────────────────────────────────────
function VariablePanel({ node }: { node: CanvasNode }) {
  const dispatch = useAppDispatch();
  const packages = useAppSelector((s) => s.editor.packages);
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const activePkg = packages.find((p) => p.id === activePackageId);
  const variable = activePkg?.variables.find(
    (v) => v.id === node.data.linkedId,
  );

  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(node.data.label);
  const [value, setValue] = useState(
    variable?.value ? String(variable.value) : "",
  );

  // Sync value when store changes
  useEffect(() => {
    if (variable?.value !== undefined) {
      setValue(String(variable.value));
    }
  }, [variable?.value]);

  const handleSaveLabel = () => {
    if (labelValue.trim()) {
      dispatch(
        renameCanvasNode({
          packageId: activePackageId,
          id: node.id,
          label: labelValue.trim(),
        }),
      );
      if (variable && node.data.linkedId) {
        dispatch(
          updateVariable({
            id: node.data.linkedId,
            newName: labelValue.trim(),
          }),
        );
      }
    }
    setEditingLabel(false);
  };

  const handleSaveValue = () => {
    if (node.data.linkedId) {
      dispatch(updateVariableValue({ id: node.data.linkedId, value }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Name row */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Name
        </div>
        {editingLabel ? (
          <div className="flex items-center gap-1">
            <input
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveLabel();
                if (e.key === "Escape") setEditingLabel(false);
              }}
              autoFocus
            />
            <button
              onClick={handleSaveLabel}
              className="p-1 rounded hover:bg-green-50 text-green-600"
            >
              <IconCheck size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-800">
              {node.data.label}
            </span>
            <button
              onClick={() => {
                setLabelValue(node.data.label);
                setEditingLabel(true);
              }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <IconPencil size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Type badge */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Type
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
          {variable?.type || "string"}
        </span>
      </div>

      {/* Value input */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Value
        </div>
        <textarea
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none font-mono"
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSaveValue}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSaveValue();
            }
          }}
          placeholder="Enter value…"
        />
        <button
          onClick={handleSaveValue}
          className="mt-1 w-full text-[11px] py-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          Save Value
        </button>
      </div>

      {!variable && (
        <p className="text-xs text-muted-foreground italic">
          Variable not linked to store.
        </p>
      )}
    </div>
  );
}

// ─── Function Panel ───────────────────────────────────────────────────────────
function FunctionPanel({ node }: { node: CanvasNode }) {
  const dispatch = useAppDispatch();
  const packages = useAppSelector((s) => s.editor.packages);
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const activePkg = packages.find((p) => p.id === activePackageId);
  const func = activePkg?.functions.find((f) => f.id === node.data.linkedId);

  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(node.data.label);

  const handleSaveLabel = () => {
    if (labelValue.trim()) {
      dispatch(
        renameCanvasNode({
          packageId: activePackageId,
          id: node.id,
          label: labelValue.trim(),
        }),
      );
      if (func && node.data.linkedId) {
        dispatch(
          updateFunctionName({
            id: node.data.linkedId,
            newName: labelValue.trim(),
          }),
        );
      }
    }
    setEditingLabel(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Name row */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Name
        </div>
        {editingLabel ? (
          <div className="flex items-center gap-1">
            <input
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveLabel();
                if (e.key === "Escape") setEditingLabel(false);
              }}
              autoFocus
            />
            <button
              onClick={handleSaveLabel}
              className="p-1 rounded hover:bg-green-50 text-green-600"
            >
              <IconCheck size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-800">
              {node.data.label}
            </span>
            <button
              onClick={() => {
                setLabelValue(node.data.label);
                setEditingLabel(true);
              }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <IconPencil size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Inline function editor — filtered to this function only */}
      {node.data.linkedId ? (
        <div className="border border-gray-200 rounded overflow-hidden">
          <FunctionDefiner filterFunctionId={node.data.linkedId} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Function not linked to store.
        </p>
      )}
    </div>
  );
}

// ─── Renderer Panel ───────────────────────────────────────────────────────────
function RendererPanel({
  node,
  onOpenRenderer,
}: {
  node: CanvasNode;
  onOpenRenderer?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"cdn" | "log">("cdn");
  const dispatch = useAppDispatch();

  // The rendererId for this node is the canvas node id
  const rendererId = node.id;

  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const rendererEntry = useAppSelector(
    (s) => s.canvasRunner.renderers[rendererId],
  );

  const ownerPkg = useAppSelector((s) =>
    s.editor.packages.find((p) => p.id === activePackageId),
  );

  // Canvas runner state for this specific renderer
  const { run } = useCanvasRunner(rendererId);
  const canvasRunnerState = useAppSelector((s) => s.canvasRunner);

  // CDN packages from this renderer's canvas runner entry
  const cdnPackages = rendererEntry?.cdnPackages ?? [];

  const [newCdnName, setNewCdnName] = useState("");
  const [newCdnUrl, setNewCdnUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── Register renderer and sync variables/functions/runner from owner package ──
  useEffect(() => {
    if (!ownerPkg) return;

    if (!rendererEntry) {
      // First-time registration: seed with the full active package state
      dispatch(
        registerRenderer({
          rendererId,
          label: node.data.label,
          packageId: activePackageId,
          runner: ownerPkg.runner,
          variables: ownerPkg.variables,
          functions: ownerPkg.functions,
          cdnPackages: [], // Each renderer has its own CDN list, start empty
        }),
      );
    } else {
      // Sync updated variables, functions, and runner steps from editor package
      dispatch(
        syncRendererVariables({ rendererId, variables: ownerPkg.variables }),
      );
      dispatch(
        syncRendererFunctions({ rendererId, functions: ownerPkg.functions }),
      );
      dispatch(syncRendererRunner({ rendererId, runner: ownerPkg.runner }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ownerPkg?.variables,
    ownerPkg?.functions,
    ownerPkg?.runner,
    ownerPkg?.id,
  ]);

  const handleAddCdn = () => {
    if (newCdnName.trim() && newCdnUrl.trim()) {
      dispatch(
        addRendererCdnPackage({
          rendererId,
          name: newCdnName.trim(),
          url: newCdnUrl.trim(),
        }),
      );
      setNewCdnName("");
      setNewCdnUrl("");
    }
  };

  /** Copy CDN packages from the editor package into this renderer, skipping duplicates */
  const handleCopyFromPackage = () => {
    if (!ownerPkg?.cdnPackages?.length) return;
    const existing = new Set(cdnPackages.map((c) => c.url));
    const toAdd = ownerPkg.cdnPackages.filter((c) => !existing.has(c.url));
    if (toAdd.length === 0) return;
    // Merge: keep existing + add new ones from editor package
    dispatch(
      setRendererCdnPackages({
        rendererId,
        cdnPackages: [...cdnPackages, ...toAdd],
      }),
    );
  };

  /** Manually save canvas runner state to IndexedDB */
  const handleSave = async () => {
    setSaving(true);
    try {
      await canvasRunnerPersistenceService.saveState(canvasRunnerState);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Manual save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Renderer ID badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Renderer ID
          </span>
          <code className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {rendererId.slice(0, 8)}…
          </code>
        </div>
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          title="Save canvas runner state"
          className={cn(
            "flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors",
            saving
              ? "bg-gray-100 text-gray-400"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
          )}
        >
          <IconDeviceFloppy size={11} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {lastSaved && (
        <p className="text-[9px] text-muted-foreground -mt-2">
          Saved {lastSaved.toLocaleTimeString()}
        </p>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {(["cdn", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "cdn" ? "CDNs" : "Log"}
          </button>
        ))}
      </div>

      {activeTab === "cdn" && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="bg-slate-50 border border-slate-200 rounded p-2 flex flex-col gap-1.5">
            <p className="text-[10px] text-slate-500 font-medium px-1">
              Add CDN Package
              <span className="ml-1 text-slate-400">(this renderer only)</span>
            </p>
            <Input
              value={newCdnName}
              onChange={(e) => setNewCdnName(e.target.value)}
              placeholder="Name (e.g. lodash)"
              className="h-6 text-[10px]"
            />
            <Input
              value={newCdnUrl}
              onChange={(e) => setNewCdnUrl(e.target.value)}
              placeholder="URL (e.g. https://cdn...)"
              className="h-6 text-[10px]"
            />
            <Button
              size="sm"
              onClick={handleAddCdn}
              disabled={!newCdnName || !newCdnUrl}
              className="h-6 text-[10px] mt-1 w-full"
            >
              Add Package
            </Button>
          </div>

          {/* Copy from package button */}
          {(ownerPkg?.cdnPackages?.length ?? 0) > 0 && (
            <button
              onClick={handleCopyFromPackage}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] py-1 px-2 rounded border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Copy CDN packages from the editor package into this renderer"
            >
              <IconCopy size={11} />
              Copy from package ({ownerPkg?.cdnPackages?.length} packages)
            </button>
          )}

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {cdnPackages.length === 0 && (
              <p className="text-[10px] text-slate-400 italic text-center py-4">
                No CDN packages for this renderer.
              </p>
            )}
            {cdnPackages.map((cdn) => (
              <div
                key={cdn.id}
                className="flex items-center gap-2 p-1.5 rounded border border-slate-200 bg-white"
              >
                <IconWorld size={12} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate">
                    {cdn.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {cdn.url}
                  </div>
                </div>
                <Switch
                  checked={cdn.enabled}
                  onCheckedChange={() =>
                    dispatch(
                      toggleRendererCdnPackage({ rendererId, cdnId: cdn.id }),
                    )
                  }
                  className="scale-75 origin-right"
                />
                <button
                  onClick={() =>
                    dispatch(
                      removeRendererCdnPackage({ rendererId, cdnId: cdn.id }),
                    )
                  }
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <IconTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "log" && (
        <div className="flex-1 overflow-auto max-h-64 bg-slate-800 rounded-md">
          <LogContainer />
        </div>
      )}

      {/* Canvas Run button */}
      <button
        onClick={run}
        className="flex items-center justify-center gap-1.5 w-full mt-auto text-xs py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors border-2 border-blue-600"
      >
        <IconPlayerPlay size={13} fill="currentColor" />
        <span className="font-semibold">Run Canvas</span>
      </button>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
const NODE_TYPE_ICONS = {
  variable: IconVariable,
  function: IconFunction,
  renderer: IconDeviceDesktop,
} as const;

const NODE_TYPE_COLORS = {
  variable: "text-gray-600 bg-gray-100",
  function: "text-blue-600 bg-blue-100",
  renderer: "text-green-600 bg-green-100",
} as const;

export function NodeDetailPanel({
  node,
  onOpenRenderer,
}: NodeDetailPanelProps) {
  const dispatch = useAppDispatch();
  const activePackageId = useAppSelector((s) => s.editor.activePackageId);
  const Icon = NODE_TYPE_ICONS[node.data.nodeType];

  // ── Resizable sidebar ──────────────────────────────────────────────────────
  const [panelWidth, setPanelWidth] = useState(288); // default w-72 = 288px
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(288);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = panelWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        // Dragging left (negative dx) increases width since panel is on the right
        const dx = startX.current - ev.clientX;
        setPanelWidth(Math.max(220, Math.min(600, startWidth.current + dx)));
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [panelWidth],
  );

  const handleClose = () =>
    dispatch(
      setSelectedCanvasNode({ packageId: activePackageId, nodeId: null }),
    );

  const handleDelete = () => {
    // Remove the canvas node
    dispatch(removeCanvasNode({ packageId: activePackageId, nodeId: node.id }));
    // Also remove the linked editor entity so it's gone from the editor too
    if (node.data.linkedId) {
      if (node.data.nodeType === "variable") {
        dispatch(removeVariable(node.data.linkedId));
      } else if (node.data.nodeType === "function") {
        dispatch(removeFunctionName(node.data.linkedId));
      }
    }
    // Unregister canvas runner entry if this is a renderer node
    if (node.data.nodeType === "renderer") {
      dispatch(unregisterRenderer(node.id));
    }
  };

  return (
    <div
      style={{ width: panelWidth }}
      className="relative h-full bg-white border-l border-gray-200 flex flex-col shadow-lg z-10 animate-in slide-in-from-right-4 duration-200 shrink-0"
    >
      {/* Resize handle — drag left edge to resize */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-blue-400 transition-colors z-20 group"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize panel"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-0.5 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md",
            NODE_TYPE_COLORS[node.data.nodeType],
          )}
        >
          <Icon size={13} />
        </div>
        <span className="flex-1 text-xs font-semibold text-gray-800 capitalize">
          {node.data.nodeType} — {node.data.label}
        </span>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete node and its editor entry"
        >
          <IconTrash size={13} />
        </button>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close panel"
        >
          <IconX size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {node.data.nodeType === "variable" && <VariablePanel node={node} />}
        {node.data.nodeType === "function" && <FunctionPanel node={node} />}
        {node.data.nodeType === "renderer" && (
          <RendererPanel node={node} onOpenRenderer={onOpenRenderer} />
        )}
      </div>
    </div>
  );
}
