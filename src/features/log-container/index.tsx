"use client";

import { useAppSelector } from "@/state/hooks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconCheck, IconInfoCircle, IconTrash } from "@tabler/icons-react";
import { useAppDispatch } from "@/state/hooks";
import { clearLogs } from "@/state/slices/logSlice";
import { useState } from "react";

type LogType = "error" | "warning" | "info";

const LOG_EMPTY_MESSAGES: Record<LogType, string> = {
  error: "No errors.",
  warning: "No warnings.",
  info: "No output yet — click Run to execute.",
};

const LogContainer = () => {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.log.logs);
  const [selectedLog, setSelectedLog] = useState<LogType>("info");

  const filteredLogs = logs.filter((log) => log.type === selectedLog);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 sticky top-0 z-10 bg-slate-800 pb-1">
        <Badge variant="default" className="text-white gap-1 text-xs py-0">
          <IconInfoCircle size={11} />Output
        </Badge>

        <Badge variant="destructive" className={cn("cursor-pointer gap-1 text-xs py-0 bg-red-700", selectedLog === "error" && "bg-red-500 ring-1 ring-red-300")}
          onClick={() => setSelectedLog("error")}>
          <IconAlertCircle size={11} />
          {logs.filter((l) => l.type === "error").length}
          {selectedLog === "error" && <IconCheck size={10} />}
        </Badge>

        <Badge variant="default" className={cn("cursor-pointer gap-1 text-xs py-0 bg-amber-700", selectedLog === "warning" && "bg-amber-500 ring-1 ring-amber-300")}
          onClick={() => setSelectedLog("warning")}>
          <IconAlertCircle size={11} />
          {logs.filter((l) => l.type === "warning").length}
          {selectedLog === "warning" && <IconCheck size={10} />}
        </Badge>

        <Badge variant="default" className={cn("cursor-pointer gap-1 text-xs py-0 bg-blue-700", selectedLog === "info" && "bg-blue-500 ring-1 ring-blue-300")}
          onClick={() => setSelectedLog("info")}>
          <IconInfoCircle size={11} />
          {logs.filter((l) => l.type === "info").length}
          {selectedLog === "info" && <IconCheck size={10} />}
        </Badge>

        <Button variant="default" size="icon" className="bg-transparent ml-auto h-6 w-6" onClick={() => dispatch(clearLogs())} disabled={!logs.length} title="Clear logs">
          <IconTrash size={12} className="text-slate-400" />
        </Button>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">
          No logs yet — click <strong className="text-slate-400">Run</strong>.
        </p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">{LOG_EMPTY_MESSAGES[selectedLog]}</p>
      ) : (
        filteredLogs.map((log, index) => (
          <div key={index} className="px-2 py-1 border-b border-slate-700 flex items-start gap-2">
            <p className={cn("text-xs font-bold shrink-0 mt-0.5 w-12",
              log.type === "error" && "text-red-400",
              log.type === "warning" && "text-yellow-400",
              log.type === "info" && "text-blue-400"
            )}>
              {log.type}
            </p>
            <p className="text-xs w-full min-w-0 text-slate-300 break-words">{log.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default LogContainer;
