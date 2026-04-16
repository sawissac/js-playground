import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useState, useRef, useEffect } from "react";
import { clearLogs } from "@/state/slices/logSlice";
import { LogType } from "../constants";

export const useLogManager = () => {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.log.logs);
  const [selectedLog, setSelectedLog] = useState<LogType>("info");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => log.type === selectedLog);
  const baseTime = logs.length > 0 ? logs[0].timestamp : 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const handleClearLogs = () => {
    dispatch(clearLogs());
  };

  return {
    logs,
    selectedLog,
    setSelectedLog,
    scrollRef,
    filteredLogs,
    baseTime,
    handleClearLogs
  };
};
