import React from "react";
import { FunctionActionInterface } from "@/state/types";
import { TYPE_COLORS } from "../constants";

export function formatValue(value: unknown, type: string): string {
  if (value === undefined || value === null || value === "") return '""';
  if (type === "string") return `"${String(value)}"`;
  if (type === "array" || type === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function renderActionLine(
  action: FunctionActionInterface,
  idx: number,
): React.ReactNode {
  const { name, dataType, value, subActions, loopParams } = action;
  const val = Array.isArray(value) ? value.join(", ") : String(value ?? "");

  if (name === "when") {
    return (
      <div key={action.id} className="mb-1">
        <div>
          <span style={{ color: "#94a3b8" }}>{idx + 1}. </span>
          <span style={{ color: "#f472b6" }}>when</span>
          <span style={{ color: "#64748b" }}>(</span>
          <span style={{ color: "#fb923c" }}>{val}</span>
          <span style={{ color: "#64748b" }}>) {"{"}</span>
        </div>
        {(subActions ?? []).map((sa, si) => (
          <div key={sa.id} className="pl-4">
            {renderActionLine(sa, si)}
          </div>
        ))}
        <div style={{ color: "#64748b" }}>{"}"}</div>
      </div>
    );
  }

  if (name === "loop") {
    const { start = "0", end = "@this.length", step = "1" } = loopParams ?? {};
    return (
      <div key={action.id} className="mb-1">
        <div>
          <span style={{ color: "#94a3b8" }}>{idx + 1}. </span>
          <span style={{ color: "#818cf8" }}>loop</span>
          <span style={{ color: "#64748b" }}>(</span>
          <span style={{ color: "#60a5fa" }}>{start}</span>
          <span style={{ color: "#64748b" }}>..</span>
          <span style={{ color: "#60a5fa" }}>{end}</span>
          <span style={{ color: "#64748b" }}>, step=</span>
          <span style={{ color: "#60a5fa" }}>{step}</span>
          <span style={{ color: "#64748b" }}>) {"{"}</span>
        </div>
        {(subActions ?? []).map((sa, si) => (
          <div key={sa.id} className="pl-4">
            {renderActionLine(sa, si)}
          </div>
        ))}
        <div style={{ color: "#64748b" }}>{"}"}</div>
      </div>
    );
  }

  if (name === "code") {
    const displayName = action.codeName || "code";
    const firstLine = val ? val.trim().split("\n")[0] : "...";
    return (
      <div key={action.id} className="mb-1">
        <div>
          <span style={{ color: "#94a3b8" }}>{idx + 1}. </span>
          <span style={{ color: "#2dd4bf" }}>{displayName}</span>
          {!action.codeName && (
            <>
              <span style={{ color: "#64748b" }}>{" {"}</span>
              <span style={{ color: "#94a3b8" }}> {firstLine}</span>
              <span style={{ color: "#64748b" }}> {"}"}</span>
            </>
          )}
          {action.codeName && <span style={{ color: "#64748b" }}>()</span>}
        </div>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[dataType ?? ""] ?? "#94a3b8";

  return (
    <div key={action.id}>
      <span style={{ color: "#94a3b8" }}>{idx + 1}. </span>
      {dataType && (
        <>
          <span style={{ color: typeColor }}>{dataType}</span>
          <span style={{ color: "#64748b" }}>.</span>
        </>
      )}
      {name === "if" ? (
        <span style={{ color: "#f472b6" }}>{name}</span>
      ) : name === "math" ? (
        <span style={{ color: "#c084fc" }}>{name}</span>
      ) : name === "temp" ? (
        <span style={{ color: "#fbbf24" }}>{name}</span>
      ) : name === "return" ? (
        <span style={{ color: "#4ade80" }}>{name}</span>
      ) : name === "use" ? (
        <span style={{ color: "#38bdf8" }}>{name}</span>
      ) : name?.startsWith("call:") ? (
        <span style={{ color: "#34d399" }}>{name.slice(5)}</span>
      ) : (
        <span style={{ color: "#e2e8f0" }}>{name || "?"}</span>
      )}
      {val && (
        <>
          <span style={{ color: "#64748b" }}>(</span>
          <span style={{ color: "#4ade80" }}>{val}</span>
          <span style={{ color: "#64748b" }}>)</span>
        </>
      )}
      {!val && <span style={{ color: "#64748b" }}>()</span>}
    </div>
  );
}
