export interface FNode {
  id: string;
  label: string;
  kind: "variable" | "function";
  type?: string;
  x: number;
  y: number;
}

export interface FEdge {
  source: FNode;
  target: FNode;
  label?: string;
}
