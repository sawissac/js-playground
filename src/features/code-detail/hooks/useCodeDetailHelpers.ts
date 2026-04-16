import { VariableInterface, FunctionInterface, Runner } from "@/state/types";
import { FEdge, FNode } from "../types";

export const serializeValue = (value: unknown, type: string): string => {
  if (value === undefined || value === null) return "";
  if (type === "array" || type === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export const parseValue = (raw: string, type: string): unknown => {
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
};

export const buildGraph = (
  variables: VariableInterface[],
  functions: FunctionInterface[],
  runner: Runner[],
  NODE_W: number,
  NODE_H: number,
  H_GAP: number,
  V_GAP: number
): { nodes: FNode[]; edges: FEdge[] } => {
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
};
