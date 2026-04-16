export type LogType = "error" | "warning" | "info";

export const LOG_EMPTY_MESSAGES: Record<LogType, string> = {
  error: "No errors.",
  warning: "No warnings.",
  info: "No output yet — click Run to execute.",
};
