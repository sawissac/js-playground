"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSearch, SearchResult } from "@/hooks/useSearch";
import { useAppDispatch } from "@/state/hooks";
import { setActivePackage } from "@/state/slices/editorSlice";
import { 
  IconVariable, 
  IconFunction, 
  IconPlayerPlay,
  IconSearch,
  IconFilter
} from "@tabler/icons-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const dispatch = useAppDispatch();
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    results,
    currentPackageResults,
    recentItems,
  } = useSearch();

  const [scope, setScope] = useState<"all" | "current">("all");
  const displayResults = scope === "current" ? currentPackageResults : results;

  const handleSelectResult = (result: SearchResult) => {
    // Switch to the package containing this item
    dispatch(setActivePackage(result.packageId));
    
    // Close the dialog
    onOpenChange(false);
    
    // In a real implementation, we would also scroll to/highlight the item
    // For now, just switching packages is helpful
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "variable":
        return <IconVariable size={16} className="text-blue-500" />;
      case "function":
        return <IconFunction size={16} className="text-purple-500" />;
      case "runner":
        return <IconPlayerPlay size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg flex items-center gap-2">
            <IconSearch size={20} />
            Quick Search
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-4 space-y-3">
          <Input
            placeholder="Search variables, functions, runners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="h-10"
          />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <IconFilter size={14} className="text-slate-400" />
            <div className="flex gap-2">
              <Badge
                variant={filterType === "all" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilterType("all")}
              >
                All
              </Badge>
              <Badge
                variant={filterType === "variable" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilterType("variable")}
              >
                Variables
              </Badge>
              <Badge
                variant={filterType === "function" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilterType("function")}
              >
                Functions
              </Badge>
              <Badge
                variant={filterType === "runner" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilterType("runner")}
              >
                Runners
              </Badge>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge
                variant={scope === "all" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setScope("all")}
              >
                All Packages
              </Badge>
              <Badge
                variant={scope === "current" ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setScope("current")}
              >
                Current Package
              </Badge>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!searchQuery && displayResults.length === 0 && (
            <div className="text-center py-12">
              <IconSearch size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">
                Start typing to search across all packages
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Try searching for variable names, function names, or runner steps
              </p>
            </div>
          )}

          {searchQuery && displayResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No results found</p>
              <p className="text-xs text-slate-400 mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {!searchQuery && recentItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Recent Items
              </h3>
              <div className="space-y-1">
                {recentItems.slice(0, 5).map((item) => (
                  <ResultItem
                    key={item.id}
                    result={item}
                    onSelect={handleSelectResult}
                    getIcon={getIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {displayResults.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Results ({displayResults.length})
              </h3>
              <div className="space-y-1">
                {displayResults.map((item) => (
                  <ResultItem
                    key={item.id}
                    result={item}
                    onSelect={handleSelectResult}
                    getIcon={getIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border">↑↓</span> Navigate
          <span className="mx-2">·</span>
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border">↵</span> Select
          <span className="mx-2">·</span>
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border">Esc</span> Close
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultItem({
  result,
  onSelect,
  getIcon,
}: {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  getIcon: (type: string) => React.ReactNode;
}) {
  return (
    <div
      onClick={() => onSelect(result)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
        "hover:bg-blue-50 hover:border-blue-200 border border-transparent"
      )}
    >
      <div className="shrink-0">{getIcon(result.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800 truncate">
            {result.name}
          </span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {result.type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500 truncate">
            {result.packageName}
          </span>
          {result.description && (
            <>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400 truncate">
                {result.description}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
