"use client";

import React, { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { 
  addPackage, 
  removePackage, 
  renamePackage, 
  setActivePackage,
  setProjectName,
  importProject,
  importPackage,
  resetState,
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
} from "@tabler/icons-react";
import { addLog } from "@/state/slices/logSlice";
import { Package } from "@/state/types";

const ProjectSidebar = () => {
  const dispatch = useAppDispatch();
  const editorState = useAppSelector((state) => state.editor);
  
  const packageFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState(editorState.projectName);

  // --- Package Actions ---

  const handleAddPackage = () => {
    const defaultName = `Package ${editorState.packages.length + 1}`;
    dispatch(addPackage({ name: defaultName }));
    dispatch(addLog({ type: "info", message: `Created new package: ${defaultName}`, context: "project" }));
  };

  const handleRemovePackage = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editorState.packages.length <= 1) {
      dispatch(addLog({ type: "warning", message: "Cannot delete the last package", context: "project" }));
      return;
    }
    if (confirm(`Are you sure you want to delete package "${name}"?`)) {
      dispatch(removePackage(id));
      dispatch(addLog({ type: "info", message: `Deleted package: ${name}`, context: "project" }));
    }
  };

  const startRenamePackage = (id: string, name: string, e: React.MouseEvent) => {
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

  // --- Export / Import ---

  const handleExportPackage = () => {
    const activePkg = editorState.packages.find((p) => p.id === editorState.activePackageId);
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
      dispatch(addLog({ type: "info", message: `Exported package "${activePkg.name}"`, context: "export" }));
    } catch (e) {
      dispatch(addLog({ type: "error", message: `Package export failed`, context: "export" }));
    }
  };

  const handleImportPackage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as Package;
        if (!importedData.variables) throw new Error("Invalid format");
        dispatch(importPackage(importedData));
        dispatch(addLog({ type: "info", message: `Imported package successfully`, context: "import" }));
      } catch (err) {
        dispatch(addLog({ type: "error", message: `Package import failed`, context: "import" }));
      }
    };
    reader.readAsText(file);
    if (packageFileInputRef.current) packageFileInputRef.current.value = "";
  };

  const handleExportProject = () => {
    try {
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
      dispatch(addLog({ type: "info", message: `Exported project "${editorState.projectName}"`, context: "export" }));
    } catch (e) {
      dispatch(addLog({ type: "error", message: `Project export failed`, context: "export" }));
    }
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (!importedData.packages) throw new Error("Invalid project format");
        dispatch(importProject(importedData));
        dispatch(addLog({ type: "info", message: `Imported project successfully`, context: "import" }));
      } catch (err) {
        dispatch(addLog({ type: "error", message: `Project import failed`, context: "import" }));
      }
    };
    reader.readAsText(file);
    if (projectFileInputRef.current) projectFileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 p-2 gap-4">
      {/* Project Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] bg-slate-200">
            Project Workspace
          </Badge>
        </div>
        
        {isEditingProject ? (
          <div className="flex items-center gap-1">
            <input 
              className="flex-1 text-sm border rounded px-1.5 py-1"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveProjectName()}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={saveProjectName}>
              <IconCheck size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <IconFolder size={18} className="text-blue-500" />
              <span className="truncate" title={editorState.projectName}>{editorState.projectName}</span>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={() => {
                setEditProjectName(editorState.projectName);
                setIsEditingProject(true);
              }}
            >
              <IconEdit size={14} />
            </Button>
          </div>
        )}

        <div className="flex gap-1 mt-1">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1" onClick={handleExportProject}>
            <IconDownload size={12} /> Export
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1" onClick={() => projectFileInputRef.current?.click()}>
            <IconUpload size={12} /> Import
          </Button>
          <input ref={projectFileInputRef} type="file" accept=".json" onChange={handleImportProject} className="hidden" />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Packages List */}
      <div className="flex-1 flex flex-col overflow-y-auto gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Packages</span>
          <Button size="icon" variant="ghost" className="h-5 w-5 hover:bg-slate-200" onClick={handleAddPackage} title="Add Package">
            <IconPlus size={14} />
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {editorState.packages.map((pkg) => {
            const isActive = pkg.id === editorState.activePackageId;
            return (
              <div 
                key={pkg.id}
                onClick={() => dispatch(setActivePackage(pkg.id))}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border",
                  isActive 
                    ? "bg-white border-blue-400 shadow-sm" 
                    : "bg-transparent border-transparent hover:bg-slate-100"
                )}
              >
                {editingPkgId === pkg.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input 
                      className="flex-1 text-xs border rounded px-1.5 py-0.5 w-full"
                      value={editPkgName}
                      onChange={(e) => setEditPkgName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRenamePackage(pkg.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={(e) => saveRenamePackage(pkg.id, e)}>
                      <IconCheck size={12} className="text-green-600" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconPackage size={14} className={isActive ? "text-blue-500" : "text-slate-400"} />
                      <span className={cn("text-xs truncate", isActive ? "font-medium text-slate-900" : "text-slate-600")}>
                        {pkg.name}
                      </span>
                    </div>
                    
                    <div className={cn("flex items-center gap-0.5", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => startRenamePackage(pkg.id, pkg.name, e)}>
                        <IconEdit size={12} className="text-slate-400 hover:text-blue-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => handleRemovePackage(pkg.id, pkg.name, e)}>
                        <IconTrash size={12} className="text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Package Export/Import */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-slate-500 font-medium px-1">Active Package Options</span>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" className="flex-1 h-7 text-[10px] gap-1" onClick={handleExportPackage}>
            <IconDownload size={12} /> Export
          </Button>
          <Button size="sm" variant="secondary" className="flex-1 h-7 text-[10px] gap-1" onClick={() => packageFileInputRef.current?.click()}>
            <IconUpload size={12} /> Import
          </Button>
          <input ref={packageFileInputRef} type="file" accept=".json" onChange={handleImportPackage} className="hidden" />
        </div>
      </div>

    </div>
  );
};

export default ProjectSidebar;
