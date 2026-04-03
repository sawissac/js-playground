"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/state/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  IconSearch, 
  IconEye, 
  IconEyeOff, 
  IconChevronRight, 
  IconChevronDown,
  IconPackage,
  IconVariable,
  IconFunction
} from "@tabler/icons-react";

export const PackageInspector = () => {
  const packages = useAppSelector((state) => state.editor.packages);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());
  
  // By default expand the first package
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(
    new Set(packages.length > 0 ? [packages[0].id] : [])
  );
  
  // Keep track of which specific lists are expanded within a package
  const [expandedVarLists, setExpandedVarLists] = useState<Set<string>>(
    new Set(packages.length > 0 ? [packages[0].id] : [])
  );
  const [expandedFuncLists, setExpandedFuncLists] = useState<Set<string>>(new Set());

  const uniqueTypes = Array.from(
    new Set(packages.flatMap((p) => p.variables.map((v) => v.type)))
  );

  const toggleExpandPackage = (pkgId: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const toggleExpandVarList = (pkgId: string) => {
    setExpandedVarLists((prev) => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const toggleExpandFuncList = (pkgId: string) => {
    setExpandedFuncLists((prev) => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const toggleExpandVar = (varId: string) => {
    setExpandedVars((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
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
      {/* Search */}
      <div className="relative">
        <IconSearch
          size={14}
          className="absolute left-2.5 top-2.5 text-slate-400"
        />
        <Input
          placeholder="Search items..."
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
          All Types
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

      {/* Packages Tree */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {packages.map((pkg) => {
          const isPkgExpanded = expandedPackages.has(pkg.id);
          
          const filteredVars = pkg.variables.filter((v) => {
            const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === "all" || v.type === typeFilter;
            return matchesSearch && matchesType;
          });

          const filteredFuncs = pkg.functions.filter((f) => {
            if (typeFilter !== "all" && typeFilter !== "function" && typeFilter !== f.dataType) return false;
            return f.name.toLowerCase().includes(searchQuery.toLowerCase());
          });

          if (searchQuery && filteredVars.length === 0 && filteredFuncs.length === 0) {
            return null;
          }

          return (
            <div key={pkg.id} className="border rounded-md border-slate-200 overflow-hidden bg-white/50">
              {/* Package Header */}
              <div 
                className="flex items-center p-2 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold"
                onClick={() => toggleExpandPackage(pkg.id)}
              >
                <div className="w-4 h-4 mr-1 flex items-center justify-center text-slate-500">
                  {isPkgExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </div>
                <IconPackage size={14} className="mr-1.5 text-blue-500" />
                <span className="flex-1 truncate">{pkg.name}</span>
                <span className="text-[10px] text-slate-400 font-normal ml-2">
                  {pkg.variables.length} vars, {pkg.functions.length} fns
                </span>
              </div>

              {/* Package Content */}
              {isPkgExpanded && (
                <div className="p-2 pl-4 space-y-2">
                  
                  {/* Variables Section */}
                  {filteredVars.length > 0 && (
                    <div className="space-y-1">
                      <div 
                        className="flex items-center text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                        onClick={() => toggleExpandVarList(pkg.id)}
                      >
                        <div className="w-4 h-4 mr-1 flex items-center justify-center">
                          {expandedVarLists.has(pkg.id) ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                        </div>
                        <IconVariable size={12} className="mr-1.5 text-green-500" />
                        Variables ({filteredVars.length})
                      </div>
                      
                      {expandedVarLists.has(pkg.id) && (
                        <div className="pl-5 space-y-2 mt-1">
                          {filteredVars.map((variable) => {
                            const isExpanded = expandedVars.has(variable.id);
                            const formattedValue = formatValue(variable.value, variable.type);
                            const isComplex = variable.type === "array" || variable.type === "object";

                            return (
                              <div
                                key={variable.id}
                                className={cn(
                                  "p-2 rounded-md border bg-white",
                                  "hover:border-slate-300 transition-colors",
                                  getTypeColor(variable.type)
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-semibold truncate">
                                        {variable.name}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">
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
                                            isExpanded && "mt-1 p-2 bg-slate-50 rounded border"
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
                                      onClick={() => toggleExpandVar(variable.id)}
                                    >
                                      {isExpanded ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Functions Section */}
                  {filteredFuncs.length > 0 && (
                    <div className="space-y-1">
                      <div 
                        className="flex items-center text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                        onClick={() => toggleExpandFuncList(pkg.id)}
                      >
                        <div className="w-4 h-4 mr-1 flex items-center justify-center">
                          {expandedFuncLists.has(pkg.id) ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                        </div>
                        <IconFunction size={12} className="mr-1.5 text-purple-500" />
                        Functions ({filteredFuncs.length})
                      </div>
                      
                      {expandedFuncLists.has(pkg.id) && (
                        <div className="pl-5 space-y-1.5 mt-1">
                          {filteredFuncs.map((func) => (
                            <div
                              key={func.id}
                              className="p-1.5 px-2.5 rounded-md border text-xs font-mono bg-white border-slate-200 flex items-center justify-between"
                            >
                              <span className="truncate">{func.name}()</span>
                              {func.dataType && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                  {func.dataType}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {filteredVars.length === 0 && filteredFuncs.length === 0 && (
                    <div className="text-[10px] text-slate-400 p-2 italic text-center">
                      No matches found
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          );
        })}
        {packages.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            No packages available
          </p>
        )}
      </div>
    </div>
  );
};
