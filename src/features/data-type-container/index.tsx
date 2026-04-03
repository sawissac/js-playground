"use client";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { IconEyeMinus, IconEyePlus, IconInfoCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { updateDataType } from "@/state/slices/editorSlice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

const InstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left text-blue-700 font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200 hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Data Type Assignment
            </p>
            <p className="text-blue-800 line-clamp-3">
              Assign strong typing to your variables. Variables without a type cannot be used in Runner flows.
            </p>
          </div>
          
          <div className="bg-amber-100/50 p-2 rounded-md border border-amber-200 mt-2">
            <p className="text-amber-800 text-[11px] leading-tight">
              <strong>Tip:</strong> Save time by defining types inline in the Variables panel using the format <code className="bg-amber-200/50 px-1 rounded font-mono">myVar:string</code>.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DataTypeContainer = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .variables,
  );
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const [showDetail, setShowDetail] = React.useState(true);

  const typedCount = variables.filter((v) => v.type).length;
  const totalCount = variables.length;

  const handleChange = (variableId: string, type: string) => {
    dispatch(updateDataType({ id: variableId, type }));
  };

  return (
    <div className="w-full shadow-slate-200 rounded-md space-y-1.5">
      <InstructionPanel />
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
