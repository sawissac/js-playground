import React from "react";
import { useAppSelector } from "@/state/hooks";
import { ObjectCard } from "./ObjectCard";

export const ObjectsTab = () => {
  const variables = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!
        .variables,
  );
  const dataTypes = useAppSelector((s) => s.editor.dataTypes);

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-12">
        <p className="font-mono text-slate-400">{"{ }"}</p>
        <p className="mt-2">No variables defined yet.</p>
        <p className="text-slate-400">
          Add variables in the Variables panel to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {variables.map((v) => (
        <ObjectCard key={v.id} variable={v} dataTypes={dataTypes} />
      ))}
    </div>
  );
};
