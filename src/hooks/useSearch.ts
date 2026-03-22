"use client";

import { useState, useMemo } from "react";
import { useAppSelector } from "@/state/hooks";
import type { VariableInterface, FunctionInterface, Runner } from "@/state/types";

export interface SearchResult {
  id: string;
  type: "variable" | "function" | "runner";
  packageId: string;
  packageName: string;
  name: string;
  value?: any;
  description?: string;
}

/**
 * Hook for searching across variables, functions, and runners
 */
export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "variable" | "function" | "runner">("all");
  
  const packages = useAppSelector((state) => state.editor.packages);
  const activePackageId = useAppSelector((state) => state.editor.activePackageId);

  // Build searchable items
  const searchableItems = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [];

    packages.forEach((pkg) => {
      // Variables
      pkg.variables.forEach((variable: VariableInterface) => {
        items.push({
          id: variable.id,
          type: "variable",
          packageId: pkg.id,
          packageName: pkg.name,
          name: variable.name,
          value: variable.value,
          description: `${variable.type} variable`,
        });
      });

      // Functions
      pkg.functions.forEach((func: FunctionInterface) => {
        items.push({
          id: func.id,
          type: "function",
          packageId: pkg.id,
          packageName: pkg.name,
          name: func.name,
          description: `Function with ${func.actions.length} actions`,
        });
      });

      // Runners
      pkg.runner.forEach((runner: Runner, index: number) => {
        const name = runner.type === "code" 
          ? `Code → ${runner.target[0]}`
          : runner.type === "set"
          ? `Set ${runner.target[0]} = ${runner.target[1]}`
          : `Call ${runner.target[1]} on ${runner.target[0]}`;

        items.push({
          id: runner.id,
          type: "runner",
          packageId: pkg.id,
          packageName: pkg.name,
          name,
          description: `Runner step ${index + 1}`,
        });
      });
    });

    return items;
  }, [packages]);

  // Filter and search
  const filteredResults = useMemo(() => {
    let results = searchableItems;

    // Filter by type
    if (filterType !== "all") {
      results = results.filter((item) => item.type === filterType);
    }

    // Search by query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const packageMatch = item.packageName.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return nameMatch || packageMatch || descMatch;
      });
    }

    return results;
  }, [searchableItems, searchQuery, filterType]);

  // Search in current package only
  const currentPackageResults = useMemo(() => {
    return filteredResults.filter((item) => item.packageId === activePackageId);
  }, [filteredResults, activePackageId]);

  // Recent items (last 10 accessed)
  const recentItems = useMemo(() => {
    // In a real implementation, this would track user interactions
    // For now, return the first 10 items
    return searchableItems.slice(0, 10);
  }, [searchableItems]);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    results: filteredResults,
    currentPackageResults,
    recentItems,
    totalCount: searchableItems.length,
  };
}

/**
 * Hook for quick jump navigation (Cmd/Ctrl+P style)
 */
export function useQuickJump() {
  const [isOpen, setIsOpen] = useState(false);
  const search = useSearch();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle,
    ...search,
  };
}
