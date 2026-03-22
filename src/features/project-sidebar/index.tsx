"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  addPackage,
  removePackage,
  renamePackage,
  setActivePackage,
  setProjectName,
  importProject,
  importPackage,
} from "@/state/slices/editorSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconFolder,
  IconPackage,
  IconPlus,
  IconTrash,
  IconEdit,
  IconDownload,
  IconUpload,
  IconCheck,
  IconX,
  IconDeviceFloppy,
  IconRefresh,
} from "@tabler/icons-react";
import { addLog } from "@/state/slices/logSlice";
import { Package } from "@/state/types";
import localforage from "localforage";
import {
  validateProjectImport,
  sanitizeProjectData,
  validateProjectExport,
} from "@/lib/projectValidation";
import { auditLog } from "@/lib/securityAudit";

const LOCAL_STORAGE_KEY = "js_playground_project_save";

const ProjectSidebar = () => {
  const dispatch = useAppDispatch();
  const editorState = useAppSelector((state) => state.editor);

  const packageFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState(
    editorState.projectName,
  );
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [hasLoadedInit, setHasLoadedInit] = useState(false);

  // --- Auto Load on Mount ---
  useEffect(() => {
    if (hasLoadedInit) return;

    const loadData = async () => {
      try {
        let savedData = await localforage.getItem<string>(LOCAL_STORAGE_KEY);

        // Fallback for migrating existing data from localStorage to localforage
        if (!savedData) {
          savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedData) {
            await localforage.setItem(LOCAL_STORAGE_KEY, savedData); // migrate!
          }
        }

        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed && parsed.packages) {
            dispatch(importProject(parsed));
            dispatch(
              addLog({
                type: "info",
                message: "Restored workspace from browser storage",
                context: "system",
              }),
            );
          }
        }
      } catch (e) {
        console.warn("Could not load from browser storage", e);
      }
    };

    loadData();
    setHasLoadedInit(true);
  }, [dispatch, hasLoadedInit]);

  // --- Package Actions ---

  const handleAddPackage = () => {
    const defaultName = `Package ${editorState.packages.length + 1}`;
    dispatch(addPackage({ name: defaultName }));
    dispatch(
      addLog({
        type: "info",
        message: `Created new package: ${defaultName}`,
        context: "project",
      }),
    );
  };

  const handleRemovePackage = (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (editorState.packages.length <= 1) {
      dispatch(
        addLog({
          type: "warning",
          message: "Cannot delete the last package",
          context: "project",
        }),
      );
      return;
    }
    if (confirm(`Are you sure you want to delete package "${name}"?`)) {
      dispatch(removePackage(id));
      dispatch(
        addLog({
          type: "info",
          message: `Deleted package: ${name}`,
          context: "project",
        }),
      );
    }
  };

  const startRenamePackage = (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingPkgId(id);
    setEditPkgName(name);
  };

  const saveRenamePackage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editPkgName.trim()) {
      dispatch(renamePackage({ id, name: editPkgName.trim() }));
    }
    setEditingPkgId(null);
  };

  // --- Project Actions ---

  const saveProjectName = () => {
    if (editProjectName.trim()) {
      dispatch(setProjectName(editProjectName.trim()));
    }
    setIsEditingProject(false);
  };

  // --- Local Save ---
  const handleSaveToBrowser = async () => {
    try {
      await localforage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editorState));
      setIsSavedRecently(true);
      dispatch(
        addLog({
          type: "info",
          message: "Workspace saved to browser storage",
          context: "system",
        }),
      );
      setTimeout(() => setIsSavedRecently(false), 2000);
    } catch (e) {
      dispatch(
        addLog({
          type: "error",
          message: "Failed to save to browser storage",
          context: "system",
        }),
      );
    }
  };

  // --- Export / Import ---

  const handleExportPackage = () => {
    const activePkg = editorState.packages.find(
      (p) => p.id === editorState.activePackageId,
    );
    if (!activePkg) return;
    try {
      const dataStr = JSON.stringify(activePkg, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `package-${activePkg.name.replace(/\s+/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      dispatch(
        addLog({
          type: "info",
          message: `Exported package "${activePkg.name}"`,
          context: "export",
        }),
      );
    } catch (e) {
      dispatch(
        addLog({
          type: "error",
          message: `Package export failed`,
          context: "export",
        }),
      );
    }
  };

  const handleImportPackage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedData = JSON.parse(jsonString) as Package;

        // Basic validation
        if (
          !importedData.variables &&
          !importedData.functions &&
          !importedData.runner
        ) {
          throw new Error("Invalid package format: missing required fields");
        }

        // Ensure required fields exist
        if (!importedData.id) importedData.id = `pkg_${Date.now()}`;
        if (!importedData.name) importedData.name = "Imported Package";
        if (!importedData.variables) importedData.variables = [];
        if (!importedData.functions) importedData.functions = [];
        if (!importedData.runner) importedData.runner = [];
        if (!importedData.codeSnippets) importedData.codeSnippets = [];
        if (!importedData.cdnPackages) importedData.cdnPackages = [];

        dispatch(importPackage(importedData));
        dispatch(
          addLog({
            type: "info",
            message: `Imported package "${importedData.name}"`,
            context: "import",
          }),
        );
      } catch (err) {
        dispatch(
          addLog({
            type: "error",
            message: `Package import failed: ${err instanceof Error ? err.message : "Unknown error"}`,
            context: "import",
          }),
        );
      }
    };

    reader.readAsText(file);
    if (packageFileInputRef.current) packageFileInputRef.current.value = "";
  };

  const handleExportProject = () => {
    try {
      const validation = validateProjectExport(editorState);

      if (!validation.valid) {
        dispatch(
          addLog({
            type: "error",
            message: `Export validation failed: ${validation.errors.join(", ")}`,
            context: "export",
          }),
        );
        alert(`Cannot export project:\n\n${validation.errors.join("\n")}`);
        return;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        dispatch(
          addLog({
            type: "warning",
            message: `Export warnings: ${validation.warnings.join(", ")}`,
            context: "export",
          }),
        );

        const proceed = confirm(
          `⚠️ Security warnings detected:\n\n${validation.warnings.join("\n")}\n\nProceed with export?`,
        );
        if (!proceed) return;
      }

      const dataStr = JSON.stringify(editorState, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `project-${editorState.projectName.replace(/\s+/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      auditLog.projectExport(
        editorState.projectName,
        dataStr.length,
        validation.stats,
      );

      dispatch(
        addLog({
          type: "info",
          message: `Exported project "${editorState.projectName}"`,
          context: "export",
        }),
      );
    } catch (e) {
      dispatch(
        addLog({
          type: "error",
          message: `Project export failed`,
          context: "export",
        }),
      );
      auditLog.projectExport(editorState.projectName, 0, { error: String(e) });
    }
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const validation = validateProjectImport(jsonString);

        if (!validation.valid) {
          dispatch(
            addLog({
              type: "error",
              message: `Import validation failed: ${validation.errors.join(", ")}`,
              context: "import",
            }),
          );
          alert(
            `❌ Cannot import project:\n\n${validation.errors.join("\n")}\n\nPlease fix these issues and try again.`,
          );
          auditLog.projectImport(false, { errors: validation.errors });
          return;
        }

        if (validation.warnings && validation.warnings.length > 0) {
          dispatch(
            addLog({
              type: "warning",
              message: `Import warnings: ${validation.warnings.join(", ")}`,
              context: "import",
            }),
          );

          const warningMessage =
            validation.warnings.length > 5
              ? `${validation.warnings.slice(0, 5).join("\n")}\n... and ${validation.warnings.length - 5} more warnings`
              : validation.warnings.join("\n");

          const proceed = confirm(
            `⚠️ Security warnings detected:\n\n${warningMessage}\n\nProceed with import?`,
          );
          if (!proceed) {
            auditLog.projectImport(false, {
              warnings: validation.warnings,
              userCancelled: true,
            });
            return;
          }
        }

        const importedData = JSON.parse(jsonString);
        const sanitizedData = sanitizeProjectData(importedData);

        dispatch(importProject(sanitizedData));

        const statsMessage = validation.stats
          ? `${validation.stats.packages} packages, ${validation.stats.variables} variables, ${validation.stats.functions} functions`
          : "imported successfully";

        dispatch(
          addLog({
            type: "info",
            message: `Imported project: ${statsMessage}`,
            context: "import",
          }),
        );

        auditLog.projectImport(true, validation.stats);
      } catch (err) {
        dispatch(
          addLog({
            type: "error",
            message: `Project import failed: ${err instanceof Error ? err.message : "Unknown error"}`,
            context: "import",
          }),
        );
        auditLog.projectImport(false, { error: String(err) });
      }
    };

    reader.readAsText(file);
    if (projectFileInputRef.current) projectFileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-row items-center w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 p-2 gap-4 h-[72px] shrink-0 z-40 overflow-x-auto shadow-sm transition-all duration-300">
      {/* Project Header Area */}
      <div className="flex flex-col gap-1.5 shrink-0 px-3 min-w-[220px] pr-6 border-r border-slate-200/50">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200/50 shadow-sm"
          >
            Workspace
          </Badge>
          <div className="flex gap-1 ml-4 md:flex items-center">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-6 w-6 rounded-full transition-all duration-300 relative group",
                isSavedRecently
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "hover:bg-blue-50 hover:text-blue-600 text-slate-500",
              )}
              onClick={handleSaveToBrowser}
              title="Save to Browser"
            >
              {isSavedRecently ? (
                <IconCheck size={14} className="animate-in zoom-in" />
              ) : (
                <IconDeviceFloppy size={14} />
              )}
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              onClick={handleExportProject}
              title="Export Full Project (JSON)"
            >
              <IconDownload size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              onClick={() => projectFileInputRef.current?.click()}
              title="Import Project (JSON)"
            >
              <IconUpload size={14} />
            </Button>
            <input
              ref={projectFileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportProject}
              className="hidden"
            />
          </div>
        </div>

        {isEditingProject ? (
          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
            <input
              className="w-40 text-sm font-medium border-2 border-blue-400 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md px-2 py-1 shadow-inner transition-all"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveProjectName()}
              onBlur={saveProjectName}
              autoFocus
            />
          </div>
        ) : (
          <div
            className="flex items-center group cursor-pointer"
            onClick={() => {
              setEditProjectName(editorState.projectName);
              setIsEditingProject(true);
            }}
          >
            <div className="flex items-center gap-2 font-bold text-slate-800 transition-colors group-hover:text-blue-600">
              <div className="p-1.5 bg-blue-100/50 rounded-md group-hover:bg-blue-100 transition-colors">
                <IconFolder size={16} className="text-blue-600" />
              </div>
              <span
                className="truncate max-w-[150px] text-sm tracking-tight"
                title={editorState.projectName}
              >
                {editorState.projectName}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all ml-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 scale-90 group-hover:scale-100"
              onClick={(e) => {
                e.stopPropagation();
                setEditProjectName(editorState.projectName);
                setIsEditingProject(true);
              }}
            >
              <IconEdit size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* Packages List */}
      <div className="flex-1 flex items-center gap-3 overflow-hidden h-full">
        <div className="flex flex-col shrink-0 pl-1 pr-3 gap-1.5 justify-center items-center border-r border-slate-200/50 h-full">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500 transition-colors">
            Packages
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-full flex items-center gap-1 shadow-sm"
            onClick={handleAddPackage}
            title="Add Package"
          >
            <IconPlus size={14} />
            <span className="text-xs font-medium">New</span>
          </Button>
        </div>

        <div className="flex flex-row items-center gap-2.5 overflow-x-auto h-full px-2 scrollbar-hide py-1 flex-1 relative">
          {editorState.packages.map((pkg) => {
            const isActive = pkg.id === editorState.activePackageId;
            return (
              <div
                key={pkg.id}
                onClick={() => dispatch(setActivePackage(pkg.id))}
                className={cn(
                  "group flex flex-row items-center gap-2 p-1.5 px-3 rounded-full cursor-pointer transition-all duration-300 border shrink-0 min-w-[140px] max-w-[220px] relative",
                  isActive
                    ? "bg-white border-blue-200 shadow-md shadow-blue-900/5 scale-100 ring-1 ring-blue-100"
                    : "bg-slate-50/50 border-transparent hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm scale-[0.98]",
                )}
              >
                {isActive && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-sm -z-10 opacity-50" />
                )}
                {editingPkgId === pkg.id ? (
                  <div className="flex items-center gap-1 w-full animate-in fade-in">
                    <input
                      className="flex-1 text-xs font-medium border-2 border-blue-300 focus:border-blue-500 rounded-full px-2.5 py-0.5 w-full min-w-[80px] focus:outline-none transition-colors"
                      value={editPkgName}
                      onChange={(e) => setEditPkgName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveRenamePackage(pkg.id)
                      }
                      onBlur={() => saveRenamePackage(pkg.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <div
                        className={cn(
                          "p-1 rounded-full transition-colors",
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-200 text-slate-500 group-hover:bg-slate-300",
                        )}
                      >
                        <IconPackage size={12} className="shrink-0" />
                      </div>
                      <span
                        className={cn(
                          "text-[13px] truncate transition-all",
                          isActive
                            ? "font-semibold text-slate-800"
                            : "font-medium text-slate-600 group-hover:text-slate-800",
                        )}
                      >
                        {pkg.name}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-0.5 shrink-0 transition-opacity duration-200",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"
                        onClick={(e) => startRenamePackage(pkg.id, pkg.name, e)}
                        title="Rename Package"
                      >
                        <IconEdit size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                        onClick={(e) =>
                          handleRemovePackage(pkg.id, pkg.name, e)
                        }
                        title="Delete Package"
                      >
                        <IconTrash size={13} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Package Export/Import */}
      <div className="flex flex-col gap-1.5 shrink-0 px-4 justify-center hidden sm:flex border-l border-slate-200/50">
        <span className="text-[9px] text-slate-400 font-bold px-1 text-center uppercase tracking-widest">
          Active Pkg
        </span>
        <div className="flex gap-1.5 justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-[11px] font-medium px-2.5 gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
            onClick={handleExportPackage}
            title="Download Package"
          >
            <IconDownload size={13} className="text-slate-500" /> Export
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-[11px] font-medium px-2.5 gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
            onClick={() => packageFileInputRef.current?.click()}
            title="Upload Package"
          >
            <IconUpload size={13} className="text-slate-500" /> Import
          </Button>
          <input
            ref={packageFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportPackage}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;
