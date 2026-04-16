import { MarkerType } from "@xyflow/react";

export const DEFAULT_EDGE_OPTIONS = {
  markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
  style: { stroke: "#9ca3af", strokeWidth: 1.5 },
  labelStyle: { fontSize: 10, fill: "#6b7280", fontWeight: 500 },
  labelBgStyle: { fill: "#f9fafb", stroke: "#e5e7eb" },
  labelBgPadding: [3, 5] as [number, number],
  labelBgBorderRadius: 4,
  animated: true,
};
