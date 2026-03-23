"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/state/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconSearch, IconEye, IconEyeOff } from "@tabler/icons-react";

export const VariableInspector = () => {
  const packages = useAppSelector((state) => state.editor.packages);
  const activePackageId = useAppSelector(
    (state) => state.editor.activePackageId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());

  const activePackage = packages.find((p) => p.id === activePackageId);
  const variables = activePackage?.variables || [];

  const filteredVariables = variables.filter((v) => {
    const matchesSearch = v.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(variables.map((v) => v.type)));

  const toggleExpand = (varId: string) => {
    setExpandedVars((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) {
        next.delete(varId);
      } else {
        next.add(varId);
      }
      return next;
    });
  };

  const formatValue = (value: unknown, type: string): string => {
    if (value === undefined || value === null) return "null";
    if (type === "array" || type === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      string: "bg-green-100 text-green-700 border-green-300",
      number: "bg-blue-100 text-blue-700 border-blue-300",
      boolean: "bg-purple-100 text-purple-700 border-purple-300",
      array: "bg-orange-100 text-orange-700 border-orange-300",
      object: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
      {/* Count Badge */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-slate-500 font-medium">
          {filteredVariables.length}/{variables.length} variables
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch
          size={14}
          className="absolute left-2.5 top-2.5 text-slate-400"
        />
        <Input
          placeholder="Search variables..."
          className="pl-8 h-8 text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Type Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge
          variant={typeFilter === "all" ? "default" : "outline"}
          className="cursor-pointer text-[10px] px-2 py-0.5"
          onClick={() => setTypeFilter("all")}
        >
          All
        </Badge>
        {uniqueTypes.map((type: string) => (
          <Badge
            key={type}
            variant={typeFilter === type ? "default" : "outline"}
            className="cursor-pointer text-[10px] px-2 py-0.5"
            onClick={() => setTypeFilter(type)}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredVariables.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {searchQuery || typeFilter !== "all"
              ? "No variables match filters"
              : "No variables defined"}
          </p>
        ) : (
          filteredVariables.map((variable) => {
            const isExpanded = expandedVars.has(variable.id);
            const formattedValue = formatValue(variable.value, variable.type);
            const isComplex =
              variable.type === "array" || variable.type === "object";

            return (
              <div
                key={variable.id}
                className={cn(
                  "p-2 rounded-md border bg-white",
                  "hover:border-slate-300 transition-colors",
                  getTypeColor(variable.type),
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold truncate">
                        {variable.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1.5"
                      >
                        {variable.type}
                      </Badge>
                    </div>
                    <div className="mt-1">
                      {isComplex && !isExpanded ? (
                        <span className="text-[10px] text-slate-600 font-mono">
                          {variable.type === "array"
                            ? `[${Array.isArray(variable.value) ? variable.value.length : 0} items]`
                            : `{${Object.keys(variable.value || {}).length} props}`}
                        </span>
                      ) : (
                        <pre
                          className={cn(
                            "text-[10px] font-mono text-slate-700 whitespace-pre-wrap break-all",
                            isExpanded && "mt-1 p-2 bg-slate-50 rounded border",
                          )}
                        >
                          {isExpanded
                            ? formattedValue
                            : formattedValue.slice(0, 50) +
                              (formattedValue.length > 50 ? "..." : "")}
                        </pre>
                      )}
                    </div>
                  </div>
                  {isComplex && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => toggleExpand(variable.id)}
                    >
                      {isExpanded ? (
                        <IconEyeOff size={12} />
                      ) : (
                        <IconEye size={12} />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
