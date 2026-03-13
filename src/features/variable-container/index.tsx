"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import React, { useEffect, useState } from "react";
import {
  IconCircleDashedPlus,
  IconEdit,
  IconEyeMinus,
  IconEyePlus,
  IconInfoCircle,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  addVariable,
  removeVariable,
  updateDataType,
  updateVariable,
} from "@/state/slices/editorSlice";
import { cn } from "@/lib/utils";
import { listenToKeys } from "@/lib/keyListener-utils";
import { addLog } from "@/state/slices/logSlice";
import { v4 as uuidv4 } from "uuid";

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
        <div className="space-y-2 text-xs">
          <p className="text-blue-900">
            Create named variables. Use{" "}
            <code className="bg-blue-100 px-1 rounded">name:type</code> inline,
            comma-separate to create multiple.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>
              <code className="bg-blue-100 px-1 rounded">myVar:string</code>
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">
                a:string, b:array, c
              </code>
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">x(1-3)</code>
              {" → "}
              <code className="bg-blue-100 px-1 rounded">x1, x2, x3</code>
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">x(1-2):number</code>
              {" → "}
              <code className="bg-blue-100 px-1 rounded">x1:number, x2:number</code>
            </li>
            <li>
              <kbd className="bg-blue-100 px-1 rounded">Alt/Cmd/Ctrl+1</kbd>{" "}
              focus · <kbd className="bg-blue-100 px-1 rounded">Enter</kbd>{" "}
              submit
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DataTypeContainer = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.editor.variables);
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const [oldVariable, setOldVariable] = useState("");
  const [newVariable, setNewVariable] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const inputStopListening = listenToKeys((e: KeyboardEvent) => {
      if (
        e.key === "e" &&
        (e.altKey || e.metaKey || e.ctrlKey) &&
        inputRef.current &&
        inputRef.current === document.activeElement
      ) {
        e.preventDefault();
        buttonRef.current?.click();
      }
    }, inputRef.current);
    const stopListening = listenToKeys((e: KeyboardEvent) => {
      if (
        e.key === "1" &&
        (e.altKey || e.metaKey || e.ctrlKey) &&
        inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    });
    return () => {
      inputStopListening();
      stopListening();
    };
  }, []);

  const expandRanges = (input: string): string => {
    return input
      .split(",")
      .flatMap((seg) => {
        const match = seg.trim().match(/^([^(]+)\((\d+)-(\d+)\)(.*)$/);
        if (!match) return [seg.trim()];
        const [, prefix, startStr, endStr, suffix] = match;
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (start > end) return [seg.trim()];
        const results: string[] = [];
        for (let i = start; i <= end; i++) {
          results.push(`${prefix.trim()}${i}${suffix.trim()}`);
        }
        return results;
      })
      .join(", ");
  };

  const handleAddVariable = () => {
    const variableNameLists = variables.map((variable) => variable.name);
    const temp: string[] = [];
    if (newVariable.trim() === "") {
      dispatch(
        addLog({ type: "warning", message: "Variable name cannot be empty" }),
      );
      return;
    }
    if (isEditing) {
      const variable = variables.find((v) => v.name === oldVariable);
      if (variable)
        dispatch(updateVariable({ id: variable.id, newName: newVariable }));
      handleCancelUpdate();
      return;
    }
    const expanded = expandRanges(newVariable);
    const isComma = expanded.includes(",");
    if (isComma) {
      expanded.split(",").forEach((vc) => {
        if (temp.includes(vc.trim())) {
          dispatch(
            addLog({
              type: "warning",
              message: "Variable name already exists",
            }),
          );
          return;
        }
        const hasPrefix = vc.trim().includes(":");
        if (hasPrefix) {
          const [vName, dType] = vc.trim().split(":");
          if (variableNameLists.includes(vName.trim())) {
            dispatch(
              addLog({
                type: "warning",
                message: "Variable name already exists",
              }),
            );
            return;
          }
          if (!dataTypes.includes(dType.trim())) {
            dispatch(
              addLog({ type: "warning", message: "Data type does not exist" }),
            );
            return;
          }
          const p = { id: uuidv4(), name: vName.trim() };
          temp.push(p.name);
          dispatch(addVariable(p));
          dispatch(updateDataType({ id: p.id, type: dType }));
        } else {
          temp.push(vc.trim());
          dispatch(addVariable({ id: uuidv4(), name: vc.trim() }));
        }
      });
    }
    if (!isComma) {
      const hasPrefix = expanded.trim().includes(":");
      if (hasPrefix) {
        const [vName, dType] = expanded.trim().split(":");
        if (variableNameLists.includes(vName.trim())) {
          dispatch(
            addLog({
              type: "warning",
              message: "Variable name already exists",
            }),
          );
          return;
        }
        if (!dataTypes.includes(dType.trim())) {
          dispatch(
            addLog({ type: "warning", message: "Data type does not exist" }),
          );
          return;
        }
        const p = { id: uuidv4(), name: vName.trim() };
        dispatch(addVariable(p));
        dispatch(updateDataType({ id: p.id, type: dType }));
      } else {
        dispatch(addVariable({ id: uuidv4(), name: expanded.trim() }));
      }
    }
    handleCancelUpdate();
  };

  const handleRemoveVariable = (variableId: string) => {
    dispatch(removeVariable(variableId));
    handleCancelUpdate();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddVariable();
  };
  const [typeSuggestions, setTypeSuggestions] = React.useState<string[] | null>(
    null,
  );

  const [rangePreview, setRangePreview] = React.useState<string[] | null>(null);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewVariable(val);

    // Range preview: show expanded names when any segment has name(n-m) pattern
    const hasRange = val.split(",").some((seg) =>
      /^[^(]+\(\d+-\d+\).*$/.test(seg.trim()),
    );
    if (hasRange) {
      const expanded = expandRanges(val);
      setRangePreview(
        expanded.split(",").map((s) => s.trim()).filter(Boolean),
      );
      setTypeSuggestions(null);
      return;
    }
    setRangePreview(null);

    // Suggest data types when user is typing after `:` in the last segment
    const lastSegment = val.split(",").pop() ?? "";
    const colonIdx = lastSegment.lastIndexOf(":");
    if (colonIdx !== -1) {
      const typeQuery = lastSegment.slice(colonIdx + 1).toLowerCase();
      setTypeSuggestions(dataTypes.filter((dt) => dt.startsWith(typeQuery)));
    } else {
      setTypeSuggestions(null);
    }
  };

  const insertType = (dt: string) => {
    const lastComma = newVariable.lastIndexOf(",");
    const prefix =
      lastComma === -1 ? "" : newVariable.slice(0, lastComma + 1) + " ";
    const lastSegment =
      lastComma === -1 ? newVariable : newVariable.slice(lastComma + 2);
    const colonIdx = lastSegment.indexOf(":");
    const newVal =
      prefix +
      (colonIdx === -1
        ? lastSegment + ":"
        : lastSegment.slice(0, colonIdx + 1)) +
      dt;
    setNewVariable(newVal);
    setTypeSuggestions(null);
    inputRef.current?.focus();
  };
  const handleUpdateVariable = (name: string) => {
    setOldVariable(name);
    setNewVariable(name);
    setIsEditing(true);
  };
  const handleCancelUpdate = () => {
    setNewVariable("");
    setOldVariable("");
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "w-full p-2 shadow-sm shadow-slate-200 rounded-md space-y-1.5",
        "border border-slate-200 transition-all duration-200",
        "hover:shadow-md hover:border-slate-300",
      )}
    >
      <InstructionPanel />

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[11px] py-0 px-1.5">
          Variables
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] py-0 px-1.5 transition-all duration-200",
            variables.length > 0 &&
              "bg-green-50 text-green-700 border-green-200",
          )}
        >
          {variables.length}
        </Badge>
        {isEditing && (
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer gap-1 text-[11px] py-0 ml-1 px-1.5",
              "animate-in fade-in slide-in-from-left-2 duration-200",
              "bg-amber-100 text-amber-700 border-amber-200",
            )}
          >
            editing
            <button
              onClick={handleCancelUpdate}
              className="hover:scale-110 transition-transform"
            >
              <IconX size={11} />
            </button>
          </Badge>
        )}
        <Button
          ref={buttonRef}
          onClick={() => setShowDetail((v) => !v)}
          size="icon"
          variant="ghost"
          className={cn(
            "ml-auto h-6 w-6 transition-all duration-200",
            "hover:scale-110 hover:bg-slate-100",
          )}
          disabled={!variables.length}
        >
          {showDetail ? <IconEyeMinus size={13} /> : <IconEyePlus size={13} />}
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={newVariable}
          onChange={handleOnChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setTypeSuggestions(null), 150)}
          placeholder="e.g. myVar:string, count, x(1-3)"
          className={cn(
            "h-7 text-xs transition-all duration-200",
            "focus:ring-2 focus:ring-primary/20",
          )}
        />
        <Button
          onClick={handleAddVariable}
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 transition-all duration-200",
            "hover:scale-105 active:scale-95",
          )}
        >
          <IconCircleDashedPlus size={14} />
        </Button>
      </div>

      {rangePreview && rangePreview.length > 0 && (
        <div
          className={cn(
            "rounded-md bg-slate-50 border border-slate-200 p-2 text-xs space-y-1",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            will create
          </p>
          <div className="flex gap-1 flex-wrap">
            {rangePreview.map((name) => (
              <span
                key={name}
                className="font-mono bg-white border border-green-200 rounded px-2 py-0.5 text-[11px] text-green-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {typeSuggestions && typeSuggestions.length > 0 && (
        <div
          className={cn(
            "rounded-md bg-slate-50 border border-slate-200 p-2 text-xs space-y-1",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            data types
          </p>
          <div className="flex gap-1 flex-wrap">
            {typeSuggestions.map((dt) => (
              <button
                key={dt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertType(dt);
                }}
                className={cn(
                  "font-mono bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px]",
                  "transition-all duration-150",
                  "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:scale-105",
                  "active:scale-95",
                )}
              >
                {dt}
              </button>
            ))}
          </div>
        </div>
      )}

      {showDetail && (
        <div
          className={cn(
            "flex flex-wrap gap-1",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          )}
        >
          {variables.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No variables yet.
            </p>
          ) : (
            variables.map((variable, idx) => (
              <Badge
                key={variable.id}
                variant="outline"
                className={cn(
                  "group hover:bg-accent hover:text-accent-foreground cursor-pointer gap-0.5 text-[11px] py-0 px-1.5",
                  "transition-all duration-200 hover:scale-105 hover:shadow-sm",
                  "animate-in fade-in slide-in-from-left-2",
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <span className="font-mono">{variable.name}</span>
                {variable.type && (
                  <span className="text-blue-500 font-mono">
                    :{variable.type}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdateVariable(variable.name)}
                  className={cn(
                    "group-hover:inline hidden transition-transform duration-150",
                    "hover:scale-125 hover:text-blue-600",
                    isEditing && "group-hover:hidden",
                  )}
                >
                  <IconEdit size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveVariable(variable.id)}
                  className={cn(
                    "group-hover:inline hidden transition-transform duration-150",
                    "hover:scale-125 hover:text-red-600",
                    isEditing && "group-hover:hidden",
                  )}
                >
                  <IconTrash size={11} />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DataTypeContainer;
