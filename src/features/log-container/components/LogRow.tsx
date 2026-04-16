import { IconAlertCircle, IconArrowRight, IconFunction, IconPlayerPlay } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/state/types";

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

export const LogRow = ({ log, baseTime }: { log: LogEntry; baseTime: number }) => {
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
