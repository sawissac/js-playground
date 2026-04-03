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
  addFunctionName,
  removeFunctionName,
  updateFunctionName,
} from "@/state/slices/editorSlice";
import { cn } from "@/lib/utils";
import { listenToKeys } from "@/lib/keyListener-utils";
import { addLog } from "@/state/slices/logSlice";

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
            Register named functions. Then define their logic in the{" "}
            <strong>Function Definer</strong> panel.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>
              <code className="bg-blue-100 px-1 rounded">fn1, fn2</code> —
              create multiple
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">f(1-3)</code>
              {" → "}
              <code className="bg-blue-100 px-1 rounded">f1, f2, f3</code>
            </li>
            <li>
              <kbd className="bg-blue-100 px-1 rounded">Alt/Cmd/Ctrl+3</kbd>{" "}
              focus · <kbd className="bg-blue-100 px-1 rounded">Enter</kbd>{" "}
              submit
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const FunctionsContainer = () => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const [oldFunctionName, setOldFunctionName] = useState("");
  const [newFunctionName, setNewFunctionName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [rangePreview, setRangePreview] = useState<string[] | null>(null);

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

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewFunctionName(val);

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
      return;
    }
    setRangePreview(null);
  };

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
        e.key === "3" &&
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

  const handleAddFunction = () => {
    const functionNameLists = functions.map((fun) => fun.name);
    const temp: string[] = [];
    if (newFunctionName.trim() === "") {
      dispatch(
        addLog({ type: "warning", message: "Function name cannot be empty" }),
      );
      return;
    }
    if (isEditing) {
      if (functionNameLists.includes(newFunctionName.trim()) && newFunctionName.trim() !== oldFunctionName) {
        dispatch(
          addLog({ type: "warning", message: "Function name already exists" }),
        );
        return;
      }
      const func = functions.find((f) => f.name === oldFunctionName);
      if (func)
        dispatch(updateFunctionName({ id: func.id, newName: newFunctionName }));
      handleCancelUpdate();
      return;
    }

    const expanded = expandRanges(newFunctionName);
    expanded.split(",").forEach((vc) => {
      const trimmedVc = vc.trim();
      if (!trimmedVc) return;
      if (temp.includes(trimmedVc) || functionNameLists.includes(trimmedVc)) {
        dispatch(
          addLog({
            type: "warning",
            message: "Function name already exists",
          }),
        );
        return;
      }
      temp.push(trimmedVc);
      dispatch(addFunctionName(trimmedVc));
    });

    handleCancelUpdate();
  };

  const handleRemoveFunction = (id: string) => {
    dispatch(removeFunctionName(id));
    handleCancelUpdate();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddFunction();
  };
  const handleUpdateVariable = (name: string) => {
    setOldFunctionName(name);
    setNewFunctionName(name);
    setIsEditing(true);
  };
  const handleCancelUpdate = () => {
    setNewFunctionName("");
    setOldFunctionName("");
    setIsEditing(false);
    setRangePreview(null);
  };

  return (
    <div
      className={cn(
        "w-fullrounded-md space-y-1.5",
        "transition-all duration-200",
      )}
    >
      <InstructionPanel />

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[11px] py-0 px-1.5">
          Functions
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] py-0 px-1.5 transition-all duration-200",
            functions.length > 0 &&
              "bg-green-50 text-green-700 border-green-200",
          )}
        >
          {functions.length}
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
          disabled={!functions.length}
        >
          {showDetail ? <IconEyeMinus size={13} /> : <IconEyePlus size={13} />}
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={newFunctionName}
          onChange={handleOnChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. processText, calc(1-3)"
          className={cn(
            "h-7 text-xs transition-all duration-200",
            "focus:ring-2 focus:ring-primary/20",
          )}
        />
        <Button
          onClick={handleAddFunction}
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

      {showDetail && (
        <div
          className={cn(
            "flex flex-wrap gap-1",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          )}
        >
          {functions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No functions yet.
            </p>
          ) : (
            functions.map((fn, idx) => (
              <Badge
                key={fn.id}
                variant="outline"
                className={cn(
                  "group hover:bg-accent hover:text-accent-foreground cursor-pointer gap-0.5 text-[11px] py-0 px-1.5",
                  "transition-all duration-200 hover:scale-105 hover:shadow-sm",
                  "animate-in fade-in slide-in-from-left-2",
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <span className="text-muted-foreground">fn</span>
                <span className="font-mono">{fn.name}</span>
                {fn.actions.length > 0 && (
                  <span className="text-muted-foreground">
                    ({fn.actions.length})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdateVariable(fn.name)}
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
                  onClick={() => handleRemoveFunction(fn.id)}
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

export default FunctionsContainer;
