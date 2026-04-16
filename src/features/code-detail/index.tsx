"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { IconEyeMinus, IconEyePlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import LogContainer from "@/features/log-container";
import CodeSidebar from "@/features/code-sidebar";
import { ObjectsTab } from "./components/ObjectsTab";
import { FlowChartTab } from "./components/FlowChartTab";
import { ExportPreviewTab } from "./components/ExportPreviewTab";
import { useCodeDetailManager } from "./hooks/useCodeDetailManager";

const CodeDetail = ({
  onToggle,
  isCollapsed,
}: {
  onToggle?: () => void;
  isCollapsed?: boolean;
}) => {
  const { activeTab, setActiveTab, tabs } = useCodeDetailManager();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab navigation */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-xs px-3 py-2 transition-all relative whitespace-nowrap",
              activeTab === tab.id
                ? "text-slate-900 font-medium"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 mr-1"
            onClick={onToggle}
            title={isCollapsed ? "Show content" : "Hide content"}
          >
            {isCollapsed ? (
              <IconEyePlus size={14} />
            ) : (
              <IconEyeMinus size={14} />
            )}
          </Button>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" && <CodeSidebar />}
        {activeTab === "objects" && <ObjectsTab />}
        {activeTab === "flowchart" && <FlowChartTab />}
        {activeTab === "export" && <ExportPreviewTab />}
        {activeTab === "log" && (
          <div className="h-full bg-slate-800 p-2">
            <LogContainer />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDetail;
