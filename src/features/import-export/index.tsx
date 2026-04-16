"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  IconDownload,
  IconUpload,
  IconFileExport,
  IconFileImport,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ImportExportInstructionPanel } from "./components/ImportExportInstructionPanel";
import { useImportExportManager } from "./hooks/useImportExportManager";

const ImportExport = () => {
  const {
    activePackage,
    fileInputRef,
    showConfirmReset,
    setShowConfirmReset,
    handleExport,
    handleImport,
    handleReset,
    hasData
  } = useImportExportManager();

  return (
    <div
      className={cn(
        "w-full p-2",
        "shadow-sm shadow-slate-200",
        "rounded-md",
        "space-y-1.5",
        "border border-slate-200",
        "transition-all duration-200",
        "hover:shadow-md hover:border-slate-300",
      )}
    >
      <ImportExportInstructionPanel />

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[11px] py-0 px-1.5">
          Import/Export
        </Badge>
        {hasData && (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] py-0 px-1.5",
              "transition-all duration-200",
              "bg-green-50 text-green-700 border-green-200",
            )}
          >
            {activePackage.variables.length +
              activePackage.functions.length +
              activePackage.runner.length}{" "}
            items
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Button
            onClick={handleExport}
            disabled={!hasData}
            size="sm"
            variant="outline"
            className={cn(
              "flex-1 h-7",
              "gap-1.5 text-xs",
              "transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "hover:bg-green-50 hover:text-green-700 hover:border-green-300",
            )}
          >
            <IconFileExport size={14} />
            Export
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="outline"
            className={cn(
              "flex-1 h-7",
              "gap-1.5 text-xs",
              "transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
            )}
          >
            <IconFileImport size={14} />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {hasData && (
          <div
            className={cn(
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            {!showConfirmReset ? (
              <Button
                onClick={() => setShowConfirmReset(true)}
                size="sm"
                variant="outline"
                className={cn(
                  "w-full h-7",
                  "gap-1.5 text-xs",
                  "transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "hover:bg-red-50 hover:text-red-700 hover:border-red-300",
                )}
              >
                <IconTrash size={14} />
                Reset All
              </Button>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  "rounded-md",
                  "bg-red-50 border border-red-200 p-1.5",
                  "animate-in fade-in slide-in-from-top-2 duration-200",
                )}
              >
                <IconAlertTriangle
                  size={14}
                  className="text-red-600 shrink-0"
                />
                <span className="text-[10px] text-red-700 font-medium flex-1">
                  Reset all data?
                </span>
                <Button
                  onClick={handleReset}
                  size="sm"
                  variant="destructive"
                  className={cn(
                    "h-6 px-2",
                    "text-[10px]",
                    "transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                  )}
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => setShowConfirmReset(false)}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-6 px-2",
                    "text-[10px]",
                    "transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                  )}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {!hasData && (
        <p
          className={cn(
            "text-xs text-muted-foreground py-1",
            "animate-in fade-in duration-200",
          )}
        >
          No data to export. Create variables, functions, or runners first.
        </p>
      )}
    </div>
  );
};

export default ImportExport;
