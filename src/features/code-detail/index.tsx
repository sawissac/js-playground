"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  updateVariable,
  updateVariableValue,
  updateDataType,
} from "@/state/slices/editorSlice";
import { cn } from "@/lib/utils";
import { VariableInterface, FunctionInterface, Runner } from "@/state/types";

// ─── Objects Tab ──────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  string: "text-green-700 bg-green-50 border-green-200",
  number: "text-blue-700 bg-blue-50 border-blue-200",
  boolean: "text-purple-700 bg-purple-50 border-purple-200",
  array: "text-orange-700 bg-orange-50 border-orange-200",
  object: "text-yellow-700 bg-yellow-50 border-yellow-200",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  string: "bg-green-100 text-green-700",
  number: "bg-blue-100 text-blue-700",
  boolean: "bg-purple-100 text-purple-700",
  array: "bg-orange-100 text-orange-700",
  object: "bg-yellow-100 text-yellow-700",
};

function serializeValue(value: unknown, type: string): string {
  if (value === undefined || value === null) return "";
  if (type === "array" || type === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function parseValue(raw: string, type: string): unknown {
  if (type === "array") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw.split(",").map((s) => s.trim());
    }
  }
  if (type === "object") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (type === "number") {
    const n = Number(raw);
    return isNaN(n) ? raw : n;
  }
  if (type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return raw;
  }
  return raw;
}

// Each card manages its own local state so controlled inputs stay in sync
// with Redux while also allowing smooth typing (no cursor-jump issues).
const ObjectCard = ({
  variable,
  dataTypes,
}: {
  variable: VariableInterface;
  dataTypes: string[];
}) => {
  const dispatch = useAppDispatch();
  const [localName, setLocalName] = useState(variable.name);
  const [localValue, setLocalValue] = useState(
    serializeValue(variable.value, variable.type),
  );
  const nameFocusedRef = useRef(false);
  const valueFocusedRef = useRef(false);

  // Sync name from Redux when not editing
  useEffect(() => {
    if (!nameFocusedRef.current) setLocalName(variable.name);
  }, [variable.name]);

  // Sync value from Redux when not editing (also reset when type changes)
  useEffect(() => {
    if (!valueFocusedRef.current)
      setLocalValue(serializeValue(variable.value, variable.type));
  }, [variable.value, variable.type]);

  const colorClass =
    TYPE_COLORS[variable.type] ??
    "text-slate-700 bg-slate-50 border-slate-200";
  const badgeClass =
    TYPE_BADGE_COLORS[variable.type] ?? "bg-slate-100 text-slate-700";
  const isMultiline =
    variable.type === "array" || variable.type === "object";

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 space-y-2 transition-colors",
        colorClass,
      )}
    >
      {/* Header: name + type */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onFocus={() => { nameFocusedRef.current = true; }}
          onBlur={(e) => {
            nameFocusedRef.current = false;
            if (e.target.value !== variable.name) {
              dispatch(updateVariable({ id: variable.id, newName: e.target.value }));
            }
          }}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className="flex-1 h-6 text-xs font-mono font-semibold bg-transparent border-b border-current/30 focus:outline-none focus:border-current placeholder:opacity-40"
          placeholder="name"
        />
        <select
          value={variable.type}
          onChange={(e) =>
            dispatch(updateDataType({ id: variable.id, type: e.target.value }))
          }
          className={cn(
            "h-6 text-[10px] font-semibold rounded px-1.5 border-0 focus:outline-none cursor-pointer",
            badgeClass,
          )}
        >
          {dataTypes.map((dt) => (
            <option key={dt} value={dt}>
              {dt}
            </option>
          ))}
        </select>
      </div>

      {/* Value editor */}
      {isMultiline ? (
        <textarea
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            const parsed = parseValue(e.target.value, variable.type);
            dispatch(updateVariableValue({ id: variable.id, value: parsed as any }));
          }}
          onFocus={() => { valueFocusedRef.current = true; }}
          onBlur={() => { valueFocusedRef.current = false; }}
          rows={3}
          className="w-full text-[11px] font-mono bg-white/60 rounded border border-current/20 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-current/20 resize-none leading-relaxed"
          placeholder={
            variable.type === "array" ? '["item1", "item2"]' : '{"key": "value"}'
          }
        />
      ) : (
        <input
          type={variable.type === "number" ? "number" : "text"}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            const parsed = parseValue(e.target.value, variable.type);
            dispatch(updateVariableValue({ id: variable.id, value: parsed as any }));
          }}
          onFocus={() => { valueFocusedRef.current = true; }}
          onBlur={() => { valueFocusedRef.current = false; }}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className="w-full h-7 text-[11px] font-mono bg-white/60 rounded border border-current/20 px-2 focus:outline-none focus:ring-2 focus:ring-current/20"
          placeholder={variable.type === "boolean" ? "true / false" : "value..."}
        />
      )}
    </div>
  );
};

const ObjectsTab = () => {
  const variables = useAppSelector((s) => s.editor.variables);
  const dataTypes = useAppSelector((s) => s.editor.dataTypes);

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-12">
        <p className="font-mono text-slate-400">{"{ }"}</p>
        <p className="mt-2">No variables defined yet.</p>
        <p className="text-slate-400">
          Add variables in the Variables panel to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {variables.map((v) => (
        <ObjectCard key={v.id} variable={v} dataTypes={dataTypes} />
      ))}
    </div>
  );
};

// ─── FlowChart Tab ────────────────────────────────────────────────────────────

interface FNode {
  id: string;
  label: string;
  kind: "variable" | "function";
  type?: string;
  x: number;
  y: number;
}

interface FEdge {
  source: FNode;
  target: FNode;
  label?: string;
}

const NODE_W = 100;
const NODE_H = 34;
const H_GAP = 40;
const V_GAP = 60;

const KIND_STYLES: Record<
  string,
  { fill: string; stroke: string; textColor: string; rx: number }
> = {
  variable: { fill: "#dbeafe", stroke: "#3b82f6", textColor: "#1d4ed8", rx: 6 },
  function: {
    fill: "#f3e8ff",
    stroke: "#a855f7",
    textColor: "#7e22ce",
    rx: 14,
  },
};

const TYPE_FILL: Record<string, string> = {
  string: "#dcfce7",
  number: "#dbeafe",
  boolean: "#f3e8ff",
  array: "#ffedd5",
  object: "#fef9c3",
};

function buildGraph(
  variables: VariableInterface[],
  functions: FunctionInterface[],
  runner: Runner[],
): { nodes: FNode[]; edges: FEdge[] } {
  const nodes: FNode[] = [];
  const edges: FEdge[] = [];

  variables.forEach((v, i) => {
    nodes.push({
      id: `var_${v.id}`,
      label: v.name,
      kind: "variable",
      type: v.type,
      x: i * (NODE_W + H_GAP),
      y: 0,
    });
  });

  functions.forEach((fn, i) => {
    nodes.push({
      id: `fn_${fn.id}`,
      label: fn.name,
      kind: "function",
      x: i * (NODE_W + H_GAP),
      y: NODE_H + V_GAP,
    });
  });

  runner.forEach((r) => {
    const varNode = nodes.find(
      (n) => n.kind === "variable" && n.label === r.target[0],
    );
    const fnNode = nodes.find(
      (n) => n.kind === "function" && n.label === r.target[1],
    );

    if (varNode && fnNode && r.type === "call") {
      edges.push({ source: fnNode, target: varNode, label: "result" });
    }

    (r.args ?? []).forEach((arg: string) => {
      const argVar = nodes.find(
        (n) => n.kind === "variable" && n.label === arg,
      );
      if (argVar && fnNode) {
        edges.push({ source: argVar, target: fnNode, label: "arg" });
      }
    });
  });

  return { nodes, edges };
}

// React renders only <svg ref> — D3 owns all children (canonical pattern for drag)
const FlowChartTab = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const variables = useAppSelector((s) => s.editor.variables);
  const functions = useAppSelector((s) => s.editor.functions);
  const runner = useAppSelector((s) => s.editor.runner);

  const isEmpty = variables.length === 0 && functions.length === 0;

  useEffect(() => {
    if (!svgRef.current || isEmpty) return;

    const containerW = containerRef.current?.clientWidth ?? 500;
    const { nodes, edges } = buildGraph(variables, functions, runner);

    // Centre each row
    const varNodes = nodes.filter((n) => n.kind === "variable");
    const fnNodes = nodes.filter((n) => n.kind === "function");
    const varRowW = Math.max(varNodes.length * (NODE_W + H_GAP) - H_GAP, 0);
    const fnRowW = Math.max(fnNodes.length * (NODE_W + H_GAP) - H_GAP, 0);
    const maxRowW = Math.max(varRowW, fnRowW, 1);
    const paddingX = Math.max((containerW - maxRowW) / 2, 20);

    varNodes.forEach((n, i) => {
      n.x = paddingX + i * (NODE_W + H_GAP);
      n.y = 30;
    });
    fnNodes.forEach((n, i) => {
      n.x = paddingX + i * (NODE_W + H_GAP);
      n.y = 30 + NODE_H + V_GAP;
    });

    import("d3").then(({ select, drag }) => {
      const svg = select(svgRef.current!);
      svg.selectAll("*").remove();

      // Arrow markers
      const defs = svg.append("defs");
      (
        [
          { id: "arrow-arg", color: "#94a3b8" },
          { id: "arrow-result", color: "#a855f7" },
        ] as const
      ).forEach(({ id, color }) => {
        defs
          .append("marker")
          .attr("id", id)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", color);
      });

      // Edges — base (static) lines underneath
      const edgeLayer = svg.append("g");
      const edgeSel = edgeLayer
        .selectAll<SVGLineElement, FEdge>("line")
        .data(edges)
        .join("line")
        .attr("x1", (e) => e.source.x + NODE_W / 2)
        .attr("y1", (e) => e.source.y + NODE_H / 2)
        .attr("x2", (e) => e.target.x + NODE_W / 2)
        .attr("y2", (e) => e.target.y + NODE_H / 2)
        .attr("stroke", (e) => (e.label === "result" ? "#a855f7" : "#94a3b8"))
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.25)
        .attr("marker-end", (e) =>
          e.label === "result" ? "url(#arrow-result)" : "url(#arrow-arg)",
        );

      // Edges — animated flowing dash overlay
      const flowLayer = svg.append("g");
      const flowSel = flowLayer
        .selectAll<SVGLineElement, FEdge>("line")
        .data(edges)
        .join("line")
        .attr("x1", (e) => e.source.x + NODE_W / 2)
        .attr("y1", (e) => e.source.y + NODE_H / 2)
        .attr("x2", (e) => e.target.x + NODE_W / 2)
        .attr("y2", (e) => e.target.y + NODE_H / 2)
        .attr("stroke", (e) => (e.label === "result" ? "#a855f7" : "#94a3b8"))
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6 4")
        .attr("fill", "none");

      // Add flowing animation to each dash overlay line
      flowSel.each(function (e) {
        const line = select(this);
        const isResult = e.label === "result";
        line
          .append("animate")
          .attr("attributeName", "stroke-dashoffset")
          .attr("from", isResult ? "0" : "20")
          .attr("to", isResult ? "20" : "0")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
      });

      // Edge labels
      const labelLayer = svg.append("g");
      const labelSel = labelLayer
        .selectAll<SVGTextElement, FEdge>("text")
        .data(edges.filter((e) => !!e.label))
        .join("text")
        .attr("x", (e) => (e.source.x + e.target.x) / 2 + NODE_W / 2)
        .attr("y", (e) => (e.source.y + e.target.y) / 2 + NODE_H / 2 - 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 9)
        .attr("fill", (e) => (e.label === "result" ? "#a855f7" : "#94a3b8"))
        .style("user-select", "none")
        .text((e) => e.label ?? "");

      // Nodes — data bound via D3 join so datum is properly set for drag
      const nodeSel = svg
        .append("g")
        .selectAll<SVGGElement, FNode>("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .style("cursor", "grab");

      nodeSel
        .append("rect")
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("rx", (d) => KIND_STYLES[d.kind].rx)
        .attr("fill", (d) =>
          d.kind === "variable" && d.type
            ? (TYPE_FILL[d.type] ?? KIND_STYLES[d.kind].fill)
            : KIND_STYLES[d.kind].fill,
        )
        .attr("stroke", (d) => KIND_STYLES[d.kind].stroke)
        .attr("stroke-width", 1.5);

      nodeSel
        .append("text")
        .attr("x", NODE_W / 2)
        .attr("y", (d) =>
          d.kind === "variable" && d.type ? NODE_H / 2 - 4 : NODE_H / 2,
        )
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("font-family", "monospace")
        .attr("font-weight", "600")
        .attr("fill", (d) => KIND_STYLES[d.kind].textColor)
        .style("user-select", "none")
        .text((d) =>
          d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label,
        );

      nodeSel
        .filter((d) => d.kind === "variable" && !!d.type)
        .append("text")
        .attr("x", NODE_W / 2)
        .attr("y", NODE_H - 6)
        .attr("text-anchor", "middle")
        .attr("font-size", 8)
        .attr("fill", (d) => KIND_STYLES[d.kind].textColor)
        .attr("opacity", 0.6)
        .style("user-select", "none")
        .text((d) => d.type ?? "");

      // D3 drag — works because nodes are D3-data-joined above
      nodeSel.call(
        drag<SVGGElement, FNode>()
          .on("start", function () {
            select(this).raise().style("cursor", "grabbing");
          })
          .on("drag", function (event, d) {
            d.x = event.x - NODE_W / 2;
            d.y = event.y - NODE_H / 2;
            select(this).attr("transform", `translate(${d.x},${d.y})`);

            const updateEdgePositions = (sel: any) => {
              sel
                .attr("x1", (e: FEdge) => e.source.x + NODE_W / 2)
                .attr("y1", (e: FEdge) => e.source.y + NODE_H / 2)
                .attr("x2", (e: FEdge) => e.target.x + NODE_W / 2)
                .attr("y2", (e: FEdge) => e.target.y + NODE_H / 2);
            };
            updateEdgePositions(edgeSel);
            updateEdgePositions(flowSel);

            labelSel
              .attr("x", (e) => (e.source.x + e.target.x) / 2 + NODE_W / 2)
              .attr(
                "y",
                (e) => (e.source.y + e.target.y) / 2 + NODE_H / 2 - 4,
              );
          })
          .on("end", function () {
            select(this).style("cursor", "grab");
          }),
      );
    });
  }, [variables, functions, runner, isEmpty]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-50"
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground text-center px-4">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="mb-3 text-slate-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="6" y="6" width="14" height="10" rx="2" />
            <rect x="28" y="6" width="14" height="10" rx="3" />
            <rect x="17" y="32" width="14" height="10" rx="2" />
            <line x1="13" y1="16" x2="24" y2="32" />
            <line x1="35" y1="16" x2="24" y2="32" />
          </svg>
          <p>No data to visualize.</p>
          <p className="text-slate-400">
            Add variables and functions to see the flow.
          </p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="absolute top-2 right-2 flex items-center gap-3 bg-white/80 rounded-md border border-slate-200 px-2 py-1 z-10">
            <span className="flex items-center gap-1 text-[10px] text-blue-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400 inline-block" />
              variable
            </span>
            <span className="flex items-center gap-1 text-[10px] text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-400 inline-block" />
              function
            </span>
          </div>
          <p className="absolute bottom-2 left-2 text-[9px] text-slate-400 z-10">
            drag nodes to rearrange
          </p>
          {/* React provides only the container — D3 renders all SVG children */}
          <svg ref={svgRef} className="w-full h-full" />
        </>
      )}
    </div>
  );
};

// ─── CodeDetail ───────────────────────────────────────────────────────────────

type Tab = "objects" | "flowchart";

const CodeDetail = () => {
  const [activeTab, setActiveTab] = useState<Tab>("objects");

  const tabs: { id: Tab; label: string }[] = [
    { id: "objects", label: "Objects" },
    { id: "flowchart", label: "Flow Chart" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-slate-900 bg-white border-b-2 border-blue-500 -mb-px"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "objects" && <ObjectsTab />}
        {activeTab === "flowchart" && <FlowChartTab />}
      </div>
    </div>
  );
};

export default CodeDetail;
