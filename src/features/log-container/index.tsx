"use client";

import { useAppSelector } from "@/state/hooks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconCheck, IconTrash } from "@tabler/icons-react";
import { useAppDispatch } from "@/state/hooks";
import { clearLogs } from "@/state/slices/logSlice";
import { useState } from "react";

const LogContainer = () => {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.log.logs);
  const [selectedLog, setSelectedLog] = useState<string>("info");

  const handleClearLog = () => {
    dispatch(clearLogs());
  };

  const handleSelectLog = (log: string) => {
    setSelectedLog(log);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-start gap-2 sticky top-0 z-10 bg-slate-800">
        <Badge variant="default" className="text-white">
          Output
        </Badge>
        <Badge
          variant="destructive"
          className={cn(
            "bg-red-700 cursor-pointer",
            selectedLog === "error" && "bg-red-500"
          )}
          onClick={() => handleSelectLog("error")}
        >
          <IconAlertCircle />
          Error: {logs.filter((log) => log.type === "error").length}
          {selectedLog === "error" && <IconCheck />}
        </Badge>
        <Badge
          variant="default"
          className={cn(
            "bg-amber-700 cursor-pointer",
            selectedLog === "warning" && "bg-amber-500"
          )}
          onClick={() => handleSelectLog("warning")}
        >
          <IconAlertCircle />
          Warning: {logs.filter((log) => log.type === "warning").length}
          {selectedLog === "warning" && <IconCheck />}
        </Badge>
        <Badge
          variant="default"
          className={cn(
            "bg-blue-700 cursor-pointer",
            selectedLog === "info" && "bg-blue-500"
          )}
          onClick={() => handleSelectLog("info")}
        >
          <IconAlertCircle />
          Info: {logs.filter((log) => log.type === "info").length}
          {selectedLog === "info" && <IconCheck />}
        </Badge>
        <Button
          variant="default"
          size={"icon"}
          className="bg-transparent"
          onClick={handleClearLog}
        >
          <IconTrash size={16} className="text-slate-400" />
        </Button>
      </div>
      {logs
        .filter((log) => log.type === selectedLog)
        .map((log, index) => (
          <div
            key={index}
            className="p-2 border-b border-slate-500 flex items-center gap-2"
          >
            <p
              className={cn(
                "text-sm font-bold",
                log.type === "error" && "text-red-500",
                log.type === "warning" && "text-yellow-500",
                log.type === "info" && "text-blue-500"
              )}
            >
              {log.type}
            </p>
            <p className="text-sm font-medium w-full text-slate-400">
              {log.message}
            </p>
          </div>
        ))}
    </div>
  );
};

export default LogContainer;
