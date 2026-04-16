"use client";

import { IconEyeMinus, IconEyePlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useCodeSidebarManager } from "./hooks/useCodeSidebarManager";
import { TYPE_COLORS } from "./constants";
import { formatValue, renderActionLine } from "./components/ActionLine";

const CodeSidebar = ({
  onToggle,
  isCollapsed,
}: {
  onToggle?: () => void;
  isCollapsed?: boolean;
}) => {
  const { variables, functions, runner, isEmpty } = useCodeSidebarManager();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900 border-x border-slate-700/30">
      <div className="shrink-0 flex items-center justify-between px-2 py-1 bg-slate-900 border-b border-slate-700/50">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
          code preview
        </p>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded"
            onClick={onToggle}
            title={isCollapsed ? "Show preview" : "Hide preview"}
          >
            {isCollapsed ? (
              <IconEyePlus size={14} />
            ) : (
              <IconEyeMinus size={14} />
            )}
          </Button>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-5"
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
                    fn.actions.map((action, idx) =>
                      renderActionLine(action, idx),
                    )
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
                    <span style={{ color: "#e2e8f0" }}>
                      {r.target[0] || "?"}
                    </span>
                    <span style={{ color: "#64748b" }}> = </span>
                    <span style={{ color: "#94a3b8" }}>
                      {r.target[1] || "?"}
                    </span>
                  </>
                ) : r.type === "code" ? (
                  <>
                    <span style={{ color: "#e2e8f0" }}>
                      {r.target[0] || "?"}
                    </span>
                    <span style={{ color: "#64748b" }}> ← </span>
                    <span style={{ color: "#38bdf8" }}>{"code {"}</span>
                    <span style={{ color: "#94a3b8" }}>
                      {r.code ? ` ${r.code.trim().split("\n")[0]}...` : " ..."}
                    </span>
                    <span style={{ color: "#38bdf8" }}>{"}"}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "#e2e8f0" }}>
                      {r.target[0] || "?"}
                    </span>
                    <span style={{ color: "#64748b" }}> ← </span>
                    <span style={{ color: "#fbbf24" }}>
                      {r.target[1] || "?"}
                    </span>
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
    </div>
  );
};

export default CodeSidebar;
