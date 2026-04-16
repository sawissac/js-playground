"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import {
  IconCircleDashedPlus,
  IconEdit,
  IconEyeMinus,
  IconEyePlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { VariableInstructionPanel } from "./components/VariableInstructionPanel";
import { useVariableManager } from "./hooks/useVariableManager";

const DataTypeContainer = () => {
  const {
    variables,
    newVariable,
    isEditing,
    showDetail,
    setShowDetail,
    typeSuggestions,
    setTypeSuggestions,
    rangePreview,
    inputRef,
    buttonRef,
    handleOnChange,
    handleKeyDown,
    handleAddVariable,
    handleUpdateVariable,
    handleRemoveVariable,
    handleCancelUpdate,
    insertType
  } = useVariableManager();

  return (
    <div
      className={cn(
        "w-full shadow-slate-200 rounded-md space-y-1.5",
        " transition-all duration-200",
      )}
    >
      <VariableInstructionPanel />

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
