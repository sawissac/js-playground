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
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Variable Management
            </p>
            <p className="text-blue-800 line-clamp-3">
              Define state variables to track data inside this package.
            </p>
          </div>
          
          <div className="space-y-1.5">
            <p className="font-semibold text-blue-900 border-b border-blue-100 pb-1">Features & Shortcuts:</p>
            <div className="space-y-2 text-blue-800 mt-1.5">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Define inline types:</p>
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">myVar:string</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Bulk definition:</p>
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">a:string, b:array, c</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Range creation:</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">x(1-3)</code>
                    <span className="text-[10px] text-blue-500">→</span>
                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">x1, x2, x3</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-100/50 p-2 rounded-md border border-blue-200 mt-2 flex items-center justify-between text-blue-800">
            <span className="text-[11px] flex gap-1 items-center">
              <kbd className="bg-white border border-blue-200 shadow-sm px-1 rounded text-[9px] font-mono">⌘ 1</kbd>
              Focus input
            </span>
            <span className="text-[11px] flex gap-1 items-center">
              <kbd className="bg-white border border-blue-200 shadow-sm px-1 rounded text-[9px] font-mono">Enter</kbd>
              Submit
            </span>
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
    expanded.split(",").forEach((vc) => {
      const trimmedVc = vc.trim();
      if (!trimmedVc) return;
      
      const hasPrefix = trimmedVc.includes(":");
      if (hasPrefix) {
        const [vName, dType] = trimmedVc.split(":");
        if (temp.includes(vName.trim()) || variableNameLists.includes(vName.trim())) {
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
        if (temp.includes(trimmedVc) || variableNameLists.includes(trimmedVc)) {
          dispatch(
            addLog({
              type: "warning",
              message: "Variable name already exists",
            }),
          );
          return;
        }
        temp.push(trimmedVc);
        dispatch(addVariable({ id: uuidv4(), name: trimmedVc }));
      }
    });

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
    const hasRange = val
      .split(",")
      .some((seg) => /^[^(]+\(\d+-\d+\).*$/.test(seg.trim()));
    if (hasRange) {
      const expanded = expandRanges(val);
      setRangePreview(
        expanded
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
    setRangePreview(null);
    setTypeSuggestions(null);
  };

  return (
    <div
      className={cn(
        "w-full shadow-slate-200 rounded-md space-y-1.5",
        " transition-all duration-200",
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
