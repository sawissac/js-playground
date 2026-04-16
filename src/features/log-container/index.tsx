"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconTrash,
  IconEyeMinus,
  IconEyePlus,
} from "@tabler/icons-react";
import { useLogManager } from "./hooks/useLogManager";
import { LOG_EMPTY_MESSAGES } from "./constants";
import { LogRow } from "./components/LogRow";

const LogContainer = ({
  onToggle,
  isCollapsed,
}: {
  onToggle?: () => void;
  isCollapsed?: boolean;
}) => {
  const {
    logs,
    selectedLog,
    setSelectedLog,
    scrollRef,
    filteredLogs,
    baseTime,
    handleClearLogs
  } = useLogManager();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 sticky top-0 z-10 bg-slate-800 pb-1 shrink-0">
        <Badge
          variant="default"
          className="text-white gap-0.5 text-[10px] py-0 bg-slate-700"
        >
          <IconInfoCircle size={10} />
          Output
        </Badge>

        <Badge
          variant="destructive"
          className={cn(
            "cursor-pointer gap-0.5 text-[10px] py-0 bg-red-700/80",
            selectedLog === "error" && "bg-red-500 ring-1 ring-red-300",
          )}
          onClick={() => setSelectedLog("error")}
        >
          <IconAlertCircle size={10} />
          {logs.filter((l) => l.type === "error").length}
          {selectedLog === "error" && <IconCheck size={9} />}
        </Badge>

        <Badge
          variant="default"
          className={cn(
            "cursor-pointer gap-0.5 text-[10px] py-0 bg-amber-700/80",
            selectedLog === "warning" && "bg-amber-500 ring-1 ring-amber-300",
          )}
          onClick={() => setSelectedLog("warning")}
        >
          <IconAlertCircle size={10} />
          {logs.filter((l) => l.type === "warning").length}
          {selectedLog === "warning" && <IconCheck size={9} />}
        </Badge>

        <Badge
          variant="default"
          className={cn(
            "cursor-pointer gap-0.5 text-[10px] py-0 bg-blue-700/80",
            selectedLog === "info" && "bg-blue-500 ring-1 ring-blue-300",
          )}
          onClick={() => setSelectedLog("info")}
        >
          <IconInfoCircle size={10} />
          {logs.filter((l) => l.type === "info").length}
          {selectedLog === "info" && <IconCheck size={9} />}
        </Badge>

        {onToggle && (
          <Button
            variant="default"
            size="icon"
            className="bg-transparent ml-auto h-5 w-5"
            onClick={onToggle}
            title={isCollapsed ? "Show logs" : "Hide logs"}
          >
            {isCollapsed ? (
              <IconEyePlus size={11} className="text-slate-400" />
            ) : (
              <IconEyeMinus size={11} className="text-slate-400" />
            )}
          </Button>
        )}
        {!onToggle && <div className="ml-auto" />}
        <Button
          variant="default"
          size="icon"
          className="bg-transparent h-5 w-5"
          onClick={handleClearLogs}
          disabled={!logs.length}
          title="Clear logs"
        >
          <IconTrash size={11} className="text-slate-400" />
        </Button>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {logs.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-4">
            No logs yet — click <strong className="text-slate-400">Run</strong>.
          </p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-4">
            {LOG_EMPTY_MESSAGES[selectedLog]}
          </p>
        ) : (
          filteredLogs.map((log, index) => (
            <LogRow key={index} log={log} baseTime={baseTime} />
          ))
        )}
      </div>
    </div>
  );
};

export default LogContainer;
