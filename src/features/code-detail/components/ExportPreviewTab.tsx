import React from "react";
import { useAppSelector } from "@/state/hooks";

export const ExportPreviewTab = () => {
  const editorState = useAppSelector((s) => s.editor);
  const activePackage = editorState.packages.find(
    (p) => p.id === editorState.activePackageId,
  )!;

  const exportData = {
    variables: activePackage.variables,
    functions: activePackage.functions,
    runner: activePackage.runner,
    codeSnippets: activePackage.codeSnippets || [],
    cdnPackages: activePackage.cdnPackages || [],
    exportDate: new Date().toISOString(),
    version: "1.0",
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const hasData =
    activePackage.variables.length > 0 ||
    activePackage.functions.length > 0 ||
    activePackage.runner.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-12">
        <p className="font-mono text-slate-400">{"{ }"}</p>
        <p className="mt-2">No data to export.</p>
        <p className="text-slate-400">
          Create variables, functions, or runners to see export preview.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-3">
      <pre className="text-[10px] leading-relaxed font-mono text-slate-300">
        {jsonString}
      </pre>
    </div>
  );
};
