import { useState, useRef, useEffect } from "react";
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
import { addLog } from "@/state/slices/logSlice";
import localforage from "localforage";
import {
  validateProjectImport,
  sanitizeProjectData,
  validateProjectExport,
} from "@/lib/projectValidation";
import { auditLog } from "@/lib/securityAudit";
import { useDialog } from "@/hooks/useDialog";
import { Package } from "@/state/types";

const LOCAL_STORAGE_KEY = "js_playground_project_save";

export const useProjectManager = () => {
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

  return {
    editorState,
    dispatch,
    packageFileInputRef,
    projectFileInputRef,
    editingPkgId,
    editPkgName,
    setEditPkgName,
    isEditingProject,
    setIsEditingProject,
    editProjectName,
    setEditProjectName,
    isSavedRecently,
    handleAddPackage,
    handleRemovePackage,
    startRenamePackage,
    saveRenamePackage,
    saveProjectName,
    handleSaveToBrowser,
    handleExportPackage,
    handleImportPackage,
    handleExportProject,
    handleImportProject,
  };
};
