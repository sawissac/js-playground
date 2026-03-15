"use client";

import { useAppSelector, useAppDispatch } from "@/state/hooks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconTrash,
  IconFunction,
  IconPlayerPlay,
  IconArrowRight,
  IconEyeMinus,
  IconEyePlus,
} from "@tabler/icons-react";
import { clearLogs } from "@/state/slices/logSlice";
import { useState, useRef, useEffect } from "react";
import type { LogEntry } from "@/state/types";

type LogType = "error" | "warning" | "info";

const LOG_EMPTY_MESSAGES: Record<LogType, string> = {
  error: "No errors.",
  warning: "No warnings.",
  info: "No output yet — click Run to execute.",
};

function getContextIcon(context?: string) {
  if (!context) return null;
  if (context === "runner")
    return <IconPlayerPlay size={10} className="text-emerald-400 shrink-0" />;
  if (context === "error")
    return <IconAlertCircle size={10} className="text-red-400 shrink-0" />;
  if (context.startsWith("step"))
    return <IconArrowRight size={10} className="text-sky-400 shrink-0" />;
  return <IconFunction size={10} className="text-purple-400 shrink-0" />;
}

function getContextColor(context?: string): string {
  if (!context) return "text-slate-500";
  if (context === "runner") return "text-emerald-500";
  if (context === "error") return "text-red-400";
  if (context.startsWith("step")) return "text-sky-400";
  return "text-purple-400";
}

const LogRow = ({ log, baseTime }: { log: LogEntry; baseTime: number }) => {
  const elapsed = log.timestamp - baseTime;
  const elapsedStr =
    elapsed === 0
      ? "0ms"
      : elapsed < 1000
        ? `+${elapsed}ms`
        : `+${(elapsed / 1000).toFixed(1)}s`;

  return (
    <div
      className={cn(
        "group flex items-start gap-1.5 px-1.5 py-0.5 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors",
        "animate-in fade-in slide-in-from-bottom-1 duration-150",
      )}
    >
      {/* Elapsed time */}
      <span className="shrink-0 text-[9px] font-mono text-slate-600 tabular-nums leading-4 w-[44px] text-right">
        {elapsedStr}
      </span>

      {/* Context badge */}
      {log.context && (
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-0.5 text-[9px] font-mono leading-4 rounded px-1 bg-slate-700/60",
            getContextColor(log.context),
          )}
        >
          {getContextIcon(log.context)}
          {log.context}
        </span>
      )}

      {/* Message */}
      <p
        className={cn(
          "text-[11px] font-mono min-w-0 break-words leading-4",
          log.type === "error" && "text-red-300",
          log.type === "warning" && "text-amber-300",
          log.type === "info" && "text-slate-300",
        )}
      >
        {log.message}
      </p>
    </div>
  );
};

const LogContainer = ({ onToggle, isCollapsed }: { onToggle?: () => void; isCollapsed?: boolean }) => {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.log.logs);
  const [selectedLog, setSelectedLog] = useState<LogType>("info");
  const [localVisible, setLocalVisible] = useState(true);
  const isVisible = isCollapsed !== undefined ? !isCollapsed : localVisible;
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => log.type === selectedLog);
  const baseTime = logs.length > 0 ? logs[0].timestamp : 0;

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

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

        <Button
          variant="default"
          size="icon"
          className="bg-transparent ml-auto h-5 w-5"
          onClick={() => (onToggle ? onToggle() : setLocalVisible(!localVisible))}
          title={isVisible ? "Hide logs" : "Show logs"}
        >
          {isVisible ? (
            <IconEyeMinus size={11} className="text-slate-400" />
          ) : (
            <IconEyePlus size={11} className="text-slate-400" />
          )}
        </Button>
        <Button
          variant="default"
          size="icon"
          className="bg-transparent h-5 w-5"
          onClick={() => dispatch(clearLogs())}
          disabled={!logs.length}
          title="Clear logs"
        >
          <IconTrash size={11} className="text-slate-400" />
        </Button>
      </div>

      {/* Log entries */}
      {isVisible && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {logs.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">
              No logs yet — click{" "}
              <strong className="text-slate-400">Run</strong>.
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
      )}
    </div>
  );
};

export default LogContainer;
