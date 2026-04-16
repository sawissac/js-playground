"use client";

import { Badge } from "@/components/ui/badge";
import { IconEyeMinus, IconEyePlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { DataTypeInstructionPanel } from "./components/DataTypeInstructionPanel";
import { useDataTypeManager } from "./hooks/useDataTypeManager";

const DataTypeContainer = () => {
  const {
    variables,
    dataTypes,
    showDetail,
    setShowDetail,
    typedCount,
    totalCount,
    handleChange
  } = useDataTypeManager();

  return (
    <div className="w-full shadow-slate-200 rounded-md space-y-1.5">
      <DataTypeInstructionPanel />
      <div className="flex flex-row gap-1.5 items-center">
        <Badge variant="secondary" className="text-xs py-0">
          Data Types
        </Badge>
        <Badge variant="outline" className="text-xs py-0">
          {typedCount}/{totalCount}
        </Badge>
        {typedCount < totalCount && totalCount > 0 && (
          <span className="text-xs text-amber-600">
            {totalCount - typedCount} untyped
          </span>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto h-6 w-6"
          disabled={!variables.length}
          onClick={() => setShowDetail((v) => !v)}
        >
          {showDetail ? <IconEyeMinus size={14} /> : <IconEyePlus size={14} />}
        </Button>
      </div>

      {variables.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 border border-dashed rounded-md text-center">
          No variables yet.
        </p>
      ) : showDetail ? (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {variables.map((variable) => (
            <div
              key={variable.id}
              className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted/50 min-w-0"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  variable.type ? "bg-green-500" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] font-mono truncate flex-1 min-w-0">
                {variable.name}
              </span>
              <Select
                value={variable.type || ""}
                onValueChange={(value) => handleChange(variable.id, value)}
              >
                <SelectTrigger className="w-[72px] h-5 text-[11px] border-0 bg-muted/60 focus:ring-0 shrink-0 px-1.5">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default DataTypeContainer;
