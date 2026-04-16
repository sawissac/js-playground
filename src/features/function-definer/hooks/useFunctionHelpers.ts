import { AT_TOKEN_BASE } from "../constants";
import { ConditionRow, IfOp } from "../types";

export function buildAtTokens(
  tempCount: number,
  mathCount: number,
  pickCount: number,
  ifCount: number = 0,
  options?: { loopContext?: boolean },
) {
  const tokens = [...AT_TOKEN_BASE];
  if (options?.loopContext) {
    tokens.push({ token: "@this", desc: "current element (inside use)" });
  }
  for (let i = 1; i <= tempCount; i++)
    tokens.push({ token: `@temp${i}`, desc: `stored temp #${i}` });
  for (let i = 1; i <= mathCount; i++)
    tokens.push({ token: `@math${i}`, desc: `math result #${i}` });
  for (let i = 1; i <= pickCount; i++)
    tokens.push({ token: `@pick(${i})`, desc: `step result #${i}` });
  for (let i = 1; i <= ifCount; i++)
    tokens.push({ token: `@if${i}`, desc: `condition result #${i}` });
  return tokens;
}

export function parseConditionExpr(expr: string): ConditionRow[] {
  const makeRow = (
    left = "@this",
    op: IfOp = "===",
    right = "",
    connector: "&&" | "||" = "&&",
  ): ConditionRow => ({
    id: Math.random().toString(36).slice(2),
    left,
    op,
    right,
    connector,
  });

  if (!expr.trim()) return [makeRow()];

  const chunks: string[] = [];
  const connectors: ("&&" | "||")[] = [];
  const splitRe = /\s+(&&|\|\|)\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = splitRe.exec(expr)) !== null) {
    chunks.push(expr.slice(last, m.index).trim());
    connectors.push(m[1] as "&&" | "||");
    last = m.index + m[0].length;
  }
  chunks.push(expr.slice(last).trim());

  return chunks.map((chunk, i) => {
    const opMatch = chunk.match(/^(.*?)\s*(===|!==|>=|<=|>|<|==|!=)\s*(.*)$/);
    if (opMatch)
      return makeRow(
        opMatch[1].trim(),
        opMatch[2] as IfOp,
        opMatch[3].trim(),
        connectors[i] ?? "&&",
      );
    return makeRow(chunk, "===", "", connectors[i] ?? "&&");
  });
}

export function serializeConditionRows(rows: ConditionRow[]): string {
  const parts: string[] = [];
  rows.forEach((row, i) => {
    parts.push(`${row.left} ${row.op} ${row.right}`);
    if (i < rows.length - 1) parts.push(row.connector);
  });
  return parts.join(" ");
}
