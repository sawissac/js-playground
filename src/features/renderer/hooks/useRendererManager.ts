import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  reorderPackages,
  addCdnPackage,
  updateCdnPackage,
} from "@/state/slices/editorSlice";
import { validateCDNUrl } from "@/lib/cdnSecurity";
import { auditLog } from "@/lib/securityAudit";
import { addLog } from "@/state/slices/logSlice";
import { useRunner } from "@/hooks/useRunner";

export const useRendererManager = () => {
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
  useEffect(() => {
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

  return {
    dispatch,
    packages,
    activePackageId,
    cdnPackages,
    logs,
    errorCount,
    warningCount,
    rendererId,
    mounting,
    copied,
    dragState,
    showPrompt,
    setShowPrompt,
    showAddCdn,
    setShowAddCdn,
    showPredefinedCdn,
    setShowPredefinedCdn,
    cdnName,
    setCdnName,
    cdnUrl,
    setCdnUrl,
    editingCdnId,
    setEditingCdnId,
    editCdnName,
    setEditCdnName,
    editCdnUrl,
    setEditCdnUrl,
    cdnValidationWarnings,
    setCdnValidationWarnings,
    isFullscreen,
    rendererRef,
    sidebarWidth,
    isMobile,
    run,
    runDisabled,
    allTyped,
    handleSidebarResizeStart,
    toggleFullscreen,
    handleCopyId,
    handleClearRenderer,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleAddCdn,
    handleAddPredefinedCdn,
    handleStartEditCdn,
    handleSaveEditCdn,
  };
};
