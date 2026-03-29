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
  IconFileImport,
  IconDownload,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  IconX,
  IconEdit,
  IconUpload,
  IconCheck,
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
import { useDialog } from "@/hooks/useDialog";

const LOCAL_STORAGE_KEY = "js_playground_project_save";

interface ProjectSidebarProps {}

const ProjectSidebar = ({}: ProjectSidebarProps = {}) => {
  const dispatch = useAppDispatch();
  const editorState = useAppSelector((state) => state.editor);
  const dialog = useDialog();

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

  const handleRemovePackage = async (
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
    const confirmed = await dialog.confirm(
      `Are you sure you want to delete package "${name}"?`,
      {
        title: "Delete Package",
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    );

    if (confirmed) {
      dispatch(removePackage(id));
      dispatch(
        addLog({
          type: "info",
          message: `Package "${name}" deleted`,
          context: "package",
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

  const handleExportProject = async () => {
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
        dialog.alert(
          `Cannot export project:\n\n${validation.errors.join("\n")}`,
          {
            type: "error",
            title: "Export Failed",
          },
        );
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

        const proceed = await dialog.confirm(
          `Security warnings detected:\n\n${validation.warnings.join("\n")}\n\nProceed with export?`,
          {
            type: "warning",
            title: "Export Warning",
            confirmText: "Export Anyway",
            cancelText: "Cancel",
          },
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
    reader.onload = async (e) => {
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
          dialog.alert(
            `Cannot import project:\n\n${validation.errors.join("\n")}\n\nPlease fix these issues and try again.`,
            {
              type: "error",
              title: "Import Failed",
            },
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

          const proceed = await dialog.confirm(
            `Security warnings detected:\n\n${warningMessage}\n\nProceed with import?`,
            {
              type: "warning",
              title: "Import Warning",
              confirmText: "Import Anyway",
              cancelText: "Cancel",
            },
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
    <div className="flex flex-row items-center w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-2 gap-2 h-11 shrink-0 z-40 overflow-x-auto shadow-sm transition-all duration-300">
      {/* Project Header Area */}
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200/50">
        {isEditingProject ? (
          <input
            className="w-32 text-xs font-medium border border-blue-400 bg-blue-50/50 focus:outline-none rounded px-1.5 py-0.5 transition-all"
            value={editProjectName}
            onChange={(e) => setEditProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveProjectName()}
            onBlur={saveProjectName}
            autoFocus
          />
        ) : (
          <div
            className="flex items-center gap-1.5 group cursor-pointer"
            onClick={() => {
              setEditProjectName(editorState.projectName);
              setIsEditingProject(true);
            }}
          >
            <IconFolder size={14} className="text-blue-600 shrink-0" />
            <span
              className="text-xs font-semibold text-slate-800 truncate max-w-[120px] group-hover:text-blue-600 transition-colors"
              title={editorState.projectName}
            >
              {editorState.projectName}
            </span>
          </div>
        )}
        <div className="flex items-center gap-0.5 ml-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-5 w-5 rounded transition-all",
              isSavedRecently
                ? "bg-green-100 text-green-600"
                : "hover:bg-blue-50 hover:text-blue-600 text-slate-400",
            )}
            onClick={handleSaveToBrowser}
            title="Save to Browser"
          >
            {isSavedRecently ? (
              <IconCheck size={12} className="animate-in zoom-in" />
            ) : (
              <IconDeviceFloppy size={12} />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
            onClick={handleExportProject}
            title="Export Project"
          >
            <IconUpload size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
            onClick={() => projectFileInputRef.current?.click()}
            title="Import Project"
          >
            <IconDownload size={12} />
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

      {/* Packages List */}
      <div className="flex-1 flex items-center gap-1.5 overflow-hidden h-full">
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 shrink-0 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all rounded"
          onClick={handleAddPackage}
          title="Add Package"
        >
          <IconPlus size={12} />
        </Button>

        <div className="flex flex-row items-center gap-1.5 overflow-x-auto h-full px-1 scrollbar-hide flex-1">
          {editorState.packages.map((pkg) => {
            const isActive = pkg.id === editorState.activePackageId;
            return (
              <div
                key={pkg.id}
                onClick={() => dispatch(setActivePackage(pkg.id))}
                className={cn(
                  "group flex flex-row items-center gap-1.5 py-1 px-2.5 rounded-md cursor-pointer transition-all duration-200 border shrink-0 max-w-[180px]",
                  isActive
                    ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100"
                    : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200",
                )}
              >
                {editingPkgId === pkg.id ? (
                  <input
                    className="text-xs font-medium border border-blue-300 focus:border-blue-500 rounded px-1.5 py-0.5 w-full min-w-[60px] focus:outline-none transition-colors"
                    value={editPkgName}
                    onChange={(e) => setEditPkgName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && saveRenamePackage(pkg.id)
                    }
                    onBlur={() => saveRenamePackage(pkg.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <>
                    <IconPackage
                      size={12}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-blue-600" : "text-slate-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs truncate transition-all",
                        isActive
                          ? "font-semibold text-slate-800"
                          : "font-medium text-slate-600 group-hover:text-slate-800",
                      )}
                    >
                      {pkg.name}
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-0.5 shrink-0 transition-opacity duration-200",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <button
                        className="p-0.5 rounded hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"
                        onClick={(e) => startRenamePackage(pkg.id, pkg.name, e)}
                        title="Rename"
                      >
                        <IconEdit size={11} />
                      </button>
                      <button
                        className="p-0.5 rounded hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                        onClick={(e) =>
                          handleRemovePackage(pkg.id, pkg.name, e)
                        }
                        title="Delete"
                      >
                        <IconTrash size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Package Export/Import */}
      <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-200/50 hidden sm:flex">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] font-medium px-2 gap-1 text-slate-500 hover:text-slate-700 rounded transition-colors"
          onClick={handleExportPackage}
          title="Export Active Package"
        >
          <IconUpload size={12} /> Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] font-medium px-2 gap-1 text-slate-500 hover:text-slate-700 rounded transition-colors"
          onClick={() => packageFileInputRef.current?.click()}
          title="Import Package"
        >
          <IconDownload size={12} /> Import
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
  );
};

export default ProjectSidebar;
