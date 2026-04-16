import React from "react";
import { cn } from "@/lib/utils";
import { IconCircleDashedPlus, IconTrash } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IF_OPERATORS } from "../constants";
import { ConditionRow, IfOp } from "../types";
import {
  parseConditionExpr,
  serializeConditionRows,
} from "../hooks/useFunctionHelpers";

export const IfConditionBuilder = ({
  value,
  atTokens,
  onChange,
}: {
  value: string;
  atTokens: { token: string; desc: string }[];
  onChange: (expr: string) => void;
}) => {
  const [rows, setRows] = React.useState<ConditionRow[]>(() =>
    parseConditionExpr(value),
  );
  const prevValueRef = React.useRef(value);
  React.useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setRows(parseConditionExpr(value));
    }
  }, [value]);

  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [lastFocused, setLastFocused] = React.useState<{
    rowId: string;
    field: "left" | "right";
  } | null>(null);

  const updateRows = (newRows: ConditionRow[]) => {
    const serialized = serializeConditionRows(newRows);
    prevValueRef.current = serialized;
    setRows(newRows);
    onChange(serialized);
  };

  const updateRow = (id: string, patch: Partial<ConditionRow>) =>
    updateRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () =>
    updateRows([
      ...rows,
      {
        id: Math.random().toString(36).slice(2),
        left: "",
        op: "===",
        right: "",
        connector: "&&",
      },
    ]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    updateRows(rows.filter((r) => r.id !== id));
  };

  const insertToken = (token: string) => {
    if (!lastFocused) return;
    const key = `${lastFocused.rowId}-${lastFocused.field}`;
    const input = inputRefs.current[key];
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart ?? val.length;
    const newVal = val.slice(0, cursor) + token + val.slice(cursor);
    updateRow(lastFocused.rowId, { [lastFocused.field]: newVal });
    setTimeout(() => {
      input.focus();
      const pos = cursor + token.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  const inputClass =
    "flex-1 min-w-0 h-7 text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono placeholder:text-muted-foreground placeholder:font-sans";

  return (
    <div className="space-y-1 mt-1">
      {rows.map((row, i) => (
        <React.Fragment key={row.id}>
          <div className="flex items-center gap-1">
            <input
              ref={(el) => {
                inputRefs.current[`${row.id}-left`] = el;
              }}
              type="text"
              value={row.left}
              placeholder="@this"
              onChange={(e) => updateRow(row.id, { left: e.target.value })}
              onFocus={() => setLastFocused({ rowId: row.id, field: "left" })}
              className={inputClass}
            />
            <Select
              value={row.op}
              onValueChange={(v) => updateRow(row.id, { op: v as IfOp })}
            >
              <SelectTrigger className="w-[66px] h-7 text-xs font-mono shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IF_OPERATORS.map((op) => (
                  <SelectItem
                    key={op.value}
                    value={op.value}
                    className="font-mono text-xs"
                  >
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={(el) => {
                inputRefs.current[`${row.id}-right`] = el;
              }}
              type="text"
              value={row.right}
              placeholder="value"
              onChange={(e) => updateRow(row.id, { right: e.target.value })}
              onFocus={() => setLastFocused({ rowId: row.id, field: "right" })}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none"
            >
              <IconTrash size={11} />
            </button>
          </div>

          {i < rows.length - 1 && (
            <div className="flex items-center pl-1">
              <button
                type="button"
                onClick={() =>
                  updateRow(row.id, {
                    connector: row.connector === "&&" ? "||" : "&&",
                  })
                }
                className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors",
                  row.connector === "&&"
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
                )}
              >
                {row.connector}
              </button>
            </div>
          )}
        </React.Fragment>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-accent"
      >
        <IconCircleDashedPlus size={11} />
        add condition
      </button>

      {atTokens.filter((t) => !["@t", "@s", "@c", "@e"].includes(t.token))
        .length > 0 && (
        <div className="pt-1 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">
            @ tokens — click to insert
          </p>
          <div className="flex flex-wrap gap-1">
            {atTokens
              .filter((t) => !["@t", "@s", "@c", "@e"].includes(t.token))
              .map((t) => (
                <button
                  key={t.token}
                  type="button"
                  title={t.desc}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertToken(t.token);
                  }}
                  className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-colors"
                >
                  {t.token}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
