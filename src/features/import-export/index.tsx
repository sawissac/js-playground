"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import React, { useRef, useState } from "react";
import {
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconFileExport,
  IconFileImport,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { importState, resetState } from "@/state/slices/editorSlice";
import { cn } from "@/lib/utils";
import { addLog } from "@/state/slices/logSlice";

const InstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5",
            "w-full",
            "text-left text-blue-700",
            "font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200",
            "hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2 text-xs">
          <p className="text-blue-900">
            Save and load your workspace state. Export includes all variables,
            functions, and runner steps.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>
              <strong>Export:</strong> Download workspace as JSON file
            </li>
            <li>
              <strong>Import:</strong> Load workspace from JSON file
            </li>
            <li>
              <strong>Reset:</strong> Clear all data (cannot be undone)
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ImportExport = () => {
  const dispatch = useAppDispatch();
  const editorState = useAppSelector((state) => state.editor);
  const activePackage = editorState.packages.find(
    (p) => p.id === editorState.activePackageId,
  )!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExport = () => {
    try {
      const exportData = {
        variables: activePackage.variables,
        functions: activePackage.functions,
        runner: activePackage.runner,
        codeSnippets: activePackage.codeSnippets || [],
        cdnPackages: activePackage.cdnPackages || [],
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `obit-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(
        addLog({
          type: "info",
          message: "Workspace exported successfully",
          context: "export",
        }),
      );
    } catch (error) {
      dispatch(
        addLog({
          type: "error",
          message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          context: "export",
        }),
      );
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (
          !importedData.variables &&
          !importedData.functions &&
          !importedData.runner
        ) {
          throw new Error("Invalid workspace file format");
        }

        dispatch(importState(importedData));
        dispatch(
          addLog({
            type: "info",
            message: `Workspace imported successfully (${importedData.variables?.length || 0} variables, ${importedData.functions?.length || 0} functions, ${importedData.runner?.length || 0} runners)`,
            context: "import",
          }),
        );
      } catch (error) {
        dispatch(
          addLog({
            type: "error",
            message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            context: "import",
          }),
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    dispatch(resetState());
    dispatch(
      addLog({
        type: "warning",
        message: "Workspace reset - all data cleared",
        context: "reset",
      }),
    );
    setShowConfirmReset(false);
  };

  const hasData =
    activePackage.variables.length > 0 ||
    activePackage.functions.length > 0 ||
    activePackage.runner.length > 0;

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
      <InstructionPanel />

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
