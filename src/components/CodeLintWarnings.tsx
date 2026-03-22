"use client";

import React from "react";
import { LintIssue, getLintStats } from "@/lib/codeLinting";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

interface CodeLintWarningsProps {
  issues: LintIssue[];
  className?: string;
}

export function CodeLintWarnings({ issues, className }: CodeLintWarningsProps) {
  if (issues.length === 0) {
    return (
      <div className={cn("text-xs text-green-600 flex items-center gap-1.5", className)}>
        <IconInfoCircle size={14} />
        <span>No issues found ✓</span>
      </div>
    );
  }

  const stats = getLintStats({ issues, hasErrors: false, hasWarnings: false });

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Summary */}
      <div className="flex items-center gap-2">
        {stats.errors > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5">
            {stats.errors} error{stats.errors !== 1 ? "s" : ""}
          </Badge>
        )}
        {stats.warnings > 0 && (
          <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-300">
            {stats.warnings} warning{stats.warnings !== 1 ? "s" : ""}
          </Badge>
        )}
        {stats.info > 0 && (
          <Badge variant="outline" className="text-[10px] h-5">
            {stats.info} suggestion{stats.info !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Issue list */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {issues.slice(0, 10).map((issue, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-2 text-[10px] p-1.5 rounded",
              issue.severity === "error" && "bg-red-50 text-red-700",
              issue.severity === "warning" && "bg-amber-50 text-amber-700",
              issue.severity === "info" && "bg-blue-50 text-blue-700"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {issue.severity === "error" && <IconAlertCircle size={12} />}
              {issue.severity === "warning" && <IconAlertTriangle size={12} />}
              {issue.severity === "info" && <IconInfoCircle size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono">
                Line {issue.line}:{issue.column}
              </div>
              <div className="text-[9px] opacity-80">{issue.message}</div>
              <div className="text-[9px] opacity-60 font-mono">{issue.rule}</div>
            </div>
          </div>
        ))}
        {issues.length > 10 && (
          <div className="text-[10px] text-slate-500 text-center py-1">
            ... and {issues.length - 10} more issue{issues.length - 10 !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline version for code editor
 */
export function CodeLintBadge({ issues }: { issues: LintIssue[] }) {
  if (issues.length === 0) {
    return (
      <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-50 text-green-700 border-green-300">
        ✓ Clean
      </Badge>
    );
  }

  const stats = getLintStats({ issues, hasErrors: false, hasWarnings: false });

  if (stats.errors > 0) {
    return (
      <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
        {stats.errors} error{stats.errors !== 1 ? "s" : ""}
      </Badge>
    );
  }

  if (stats.warnings > 0) {
    return (
      <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-300">
        {stats.warnings} warning{stats.warnings !== 1 ? "s" : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
      {stats.info} suggestion{stats.info !== 1 ? "s" : ""}
    </Badge>
  );
}
