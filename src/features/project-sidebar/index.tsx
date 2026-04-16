"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconFolder,
  IconPackage,
  IconPlus,
  IconDownload,
  IconTrash,
  IconEdit,
  IconUpload,
  IconCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useProjectManager } from "./hooks/useProjectManager";
import { setActivePackage } from "@/state/slices/editorSlice";

interface ProjectSidebarProps {
  onOpenStartup?: () => void;
}

const ProjectSidebar = ({ onOpenStartup }: ProjectSidebarProps = {}) => {
  const {
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
  } = useProjectManager();

  return (
    <div className="flex flex-row items-center w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-2 gap-1 sm:gap-2 h-11 shrink-0 z-40 overflow-x-hidden shadow-sm transition-all duration-300">
      {/* Project Header Area */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pr-1.5 sm:pr-2 border-r border-slate-200/50">
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
              className="text-xs font-semibold text-slate-800 truncate max-w-[72px] sm:max-w-[120px] group-hover:text-blue-600 transition-colors"
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
          <div className="w-px h-4 bg-slate-200/50 mx-1 border-gray-300"></div>
          {onOpenStartup && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
              onClick={onOpenStartup}
              title="Open Dashboard"
            >
              <IconPackage size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Packages List */}
      <div className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-hidden h-full min-w-0">
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 shrink-0 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all rounded"
          onClick={handleAddPackage}
          title="Add Package"
        >
          <IconPlus size={12} />
        </Button>

        <div className="flex flex-row items-center gap-1 sm:gap-1.5 overflow-x-auto h-full px-1 scrollbar-hide flex-1 min-w-0">
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
