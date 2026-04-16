import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useRef, useState } from "react";
import { importState, resetState } from "@/state/slices/editorSlice";
import { addLog } from "@/state/slices/logSlice";

export const useImportExportManager = () => {
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

  return {
    activePackage,
    fileInputRef,
    showConfirmReset,
    setShowConfirmReset,
    handleExport,
    handleImport,
    handleReset,
    hasData
  };
};
