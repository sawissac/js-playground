"use client";

import { useAppSelector } from "@/state/hooks";
import { FunctionActionInterface } from "@/state/types";

// ─── Value formatters ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  string: "#4ade80",
  number: "#60a5fa",
  boolean: "#c084fc",
  array: "#fb923c",
  object: "#fbbf24",
};

function formatValue(value: unknown, type: string): string {
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

// ─── Action line renderer ─────────────────────────────────────────────────────

function renderActionLine(action: FunctionActionInterface, idx: number): React.ReactNode {
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
          {action.codeName && (
            <span style={{ color: "#64748b" }}>()</span>
          )}
        </div>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[dataType] ?? "#94a3b8";

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

// ─── CodeSidebar ──────────────────────────────────────────────────────────────

const CodeSidebar = () => {
  const variables = useAppSelector((s) => s.editor.packages.find(p => p.id === s.editor.activePackageId)!.variables);
  const functions = useAppSelector((s) => s.editor.packages.find(p => p.id === s.editor.activePackageId)!.functions);
  const runner = useAppSelector((s) => s.editor.packages.find(p => p.id === s.editor.activePackageId)!.runner);

  const isEmpty = variables.length === 0 && functions.length === 0 && runner.length === 0;

  return (
    <div
      className="h-full overflow-y-auto p-3 space-y-5"
      style={{
        background: "#0f172a",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "11px",
        lineHeight: "1.7",
        color: "#94a3b8",
      }}
    >
      {isEmpty && (
        <p className="text-center pt-10" style={{ color: "#334155" }}>
          {"// empty"}
        </p>
      )}

      {/* Variables */}
      {variables.length > 0 && (
        <div>
          <p
            className="mb-2 uppercase tracking-widest"
            style={{ fontSize: "9px", color: "#334155", fontWeight: 700 }}
          >
            {"// variables"}
          </p>
          {variables.map((v) => {
            const typeColor = TYPE_COLORS[v.type] ?? "#94a3b8";
            return (
              <div key={v.id} className="mb-0.5">
                <span style={{ color: "#38bdf8" }}>let </span>
                <span style={{ color: "#e2e8f0" }}>{v.name}</span>
                <span style={{ color: "#334155" }}>: </span>
                <span style={{ color: typeColor }}>{v.type}</span>
                <span style={{ color: "#334155" }}> = </span>
                <span style={{ color: typeColor }}>
                  {formatValue(v.value, v.type)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Functions */}
      {functions.length > 0 && (
        <div>
          <p
            className="mb-2 uppercase tracking-widest"
            style={{ fontSize: "9px", color: "#334155", fontWeight: 700 }}
          >
            {"// functions"}
          </p>
          {functions.map((fn) => (
            <div key={fn.id} className="mb-4">
              <div className="mb-1">
                <span style={{ color: "#c084fc" }}>fn </span>
                <span style={{ color: "#fbbf24" }}>{fn.name}</span>
                <span style={{ color: "#64748b" }}>(</span>
                <span style={{ color: "#fb923c" }}>...args</span>
                <span style={{ color: "#64748b" }}>) {"{"}</span>
              </div>
              <div className="pl-3">
                {fn.actions.length === 0 ? (
                  <span style={{ color: "#334155" }}>{"// no actions"}</span>
                ) : (
                  fn.actions.map((action, idx) => renderActionLine(action, idx))
                )}
              </div>
              <div style={{ color: "#64748b" }}>{"}"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Runner */}
      {runner.length > 0 && (
        <div>
          <p
            className="mb-2 uppercase tracking-widest"
            style={{ fontSize: "9px", color: "#334155", fontWeight: 700 }}
          >
            {"// runner"}
          </p>
          {runner.map((r, i) => (
            <div key={r.id} className="mb-0.5">
              <span style={{ color: "#94a3b8" }}>{i + 1}. </span>
              {r.type === "set" ? (
                <>
                  <span style={{ color: "#e2e8f0" }}>{r.target[0] || "?"}</span>
                  <span style={{ color: "#64748b" }}> = </span>
                  <span style={{ color: "#94a3b8" }}>{r.target[1] || "?"}</span>
                </>
              ) : r.type === "code" ? (
                <>
                  <span style={{ color: "#e2e8f0" }}>{r.target[0] || "?"}</span>
                  <span style={{ color: "#64748b" }}> ← </span>
                  <span style={{ color: "#38bdf8" }}>{"code {"}</span>
                  <span style={{ color: "#94a3b8" }}>
                    {r.code ? ` ${r.code.trim().split("\n")[0]}...` : " ..."}
                  </span>
                  <span style={{ color: "#38bdf8" }}>{"}"}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "#e2e8f0" }}>{r.target[0] || "?"}</span>
                  <span style={{ color: "#64748b" }}> ← </span>
                  <span style={{ color: "#fbbf24" }}>{r.target[1] || "?"}</span>
                  <span style={{ color: "#64748b" }}>(</span>
                  <span style={{ color: "#4ade80" }}>
                    {r.args?.join(", ") ?? ""}
                  </span>
                  <span style={{ color: "#64748b" }}>)</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeSidebar;
