import React, { useEffect, useRef } from "react";
import { useAppSelector } from "@/state/hooks";
import { IconZoomIn, IconZoomOut, IconMaximize } from "@tabler/icons-react";
import { FEdge } from "../types";
import { buildGraph } from "../hooks/useCodeDetailHelpers";
import { NODE_W, NODE_H, H_GAP, V_GAP, KIND_STYLES, TYPE_FILL } from "../constants";

// React renders only <svg ref> — D3 owns all children (canonical pattern for drag)
export const FlowChartTab = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<any>(null);
  const variables = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!
        .variables,
  );
  const functions = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!
        .functions,
  );
  const runner = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!.runner,
  );

  const isEmpty = variables.length === 0 && functions.length === 0;

  useEffect(() => {
    if (!svgRef.current || isEmpty) return;

    const containerW = containerRef.current?.clientWidth ?? 500;
    const { nodes, edges } = buildGraph(variables, functions, runner, NODE_W, NODE_H, H_GAP, V_GAP);

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

    import("d3").then(({ select, drag, zoom, zoomIdentity }) => {
      const svg = select(svgRef.current!);
      svg.selectAll("*").remove();

      // Root group for zoom/pan transforms
      const rootGroup = svg.append("g");

      // Zoom/pan behavior
      const zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          rootGroup.attr("transform", event.transform);
        });

      svg.call(zoomBehavior);
      zoomRef.current = { zoomBehavior, svg, zoomIdentity };

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
      const edgeLayer = rootGroup.append("g");
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
      const flowLayer = rootGroup.append("g");
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
      const labelLayer = rootGroup.append("g");
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
      const nodeSel = rootGroup
        .append("g")
        .selectAll<SVGGElement, any>("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
        .style("cursor", "grab");

      nodeSel
        .append("rect")
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("rx", (d: any) => KIND_STYLES[d.kind].rx)
        .attr("fill", (d: any) =>
          d.kind === "variable" && d.type
            ? (TYPE_FILL[d.type] ?? KIND_STYLES[d.kind].fill)
            : KIND_STYLES[d.kind].fill,
        )
        .attr("stroke", (d: any) => KIND_STYLES[d.kind].stroke)
        .attr("stroke-width", 1.5);

      nodeSel
        .append("text")
        .attr("x", NODE_W / 2)
        .attr("y", (d: any) =>
          d.kind === "variable" && d.type ? NODE_H / 2 - 4 : NODE_H / 2,
        )
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("font-family", "monospace")
        .attr("font-weight", "600")
        .attr("fill", (d: any) => KIND_STYLES[d.kind].textColor)
        .style("user-select", "none")
        .text((d: any) =>
          d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label,
        );

      nodeSel
        .filter((d: any) => d.kind === "variable" && !!d.type)
        .append("text")
        .attr("x", NODE_W / 2)
        .attr("y", NODE_H - 6)
        .attr("text-anchor", "middle")
        .attr("font-size", 8)
        .attr("fill", (d: any) => KIND_STYLES[d.kind].textColor)
        .attr("opacity", 0.6)
        .style("user-select", "none")
        .text((d: any) => d.type ?? "");

      // D3 drag — works because nodes are D3-data-joined above
      nodeSel.call(
        drag<SVGGElement, any>()
          .on("start", function (event) {
            event.sourceEvent.stopPropagation();
            select(this).raise().style("cursor", "grabbing");
          })
          .on("drag", function (event, d) {
            d.x += event.dx;
            d.y += event.dy;
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
              .attr("x", (e: any) => (e.source.x + e.target.x) / 2 + NODE_W / 2)
              .attr("y", (e: any) => (e.source.y + e.target.y) / 2 + NODE_H / 2 - 4);
          })
          .on("end", function () {
            select(this).style("cursor", "grab");
          }),
      );
    });
  }, [variables, functions, runner, isEmpty]);

  const handleZoomIn = () => {
    if (!zoomRef.current) return;
    const { zoomBehavior, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!zoomRef.current) return;
    const { zoomBehavior, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
  };

  const handleFitView = () => {
    if (!zoomRef.current) return;
    const { zoomBehavior, svg, zoomIdentity } = zoomRef.current;
    svg.transition().duration(500).call(zoomBehavior.transform, zoomIdentity);
  };

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
          {/* Controls */}
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/80 rounded-md border border-slate-200 p-0.5 z-10">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Zoom in"
            >
              <IconZoomIn size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Zoom out"
            >
              <IconZoomOut size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              onClick={handleFitView}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Fit to view"
            >
              <IconMaximize size={14} />
            </button>
          </div>

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
            drag nodes · scroll to zoom · drag background to pan
          </p>
          {/* React provides only the container — D3 renders all SVG children */}
          <svg ref={svgRef} className="w-full h-full" />
        </>
      )}
    </div>
  );
};
