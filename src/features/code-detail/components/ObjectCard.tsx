import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/state/hooks";
import { VariableInterface } from "@/state/types";
import {
  updateVariable,
  updateVariableValue,
  updateDataType,
} from "@/state/slices/editorSlice";
import { cn } from "@/lib/utils";
import { TYPE_COLORS, TYPE_BADGE_COLORS } from "../constants";
import { serializeValue, parseValue } from "../hooks/useCodeDetailHelpers";

export const ObjectCard = ({
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
    TYPE_COLORS[variable.type] ?? "text-slate-700 bg-slate-50 border-slate-200";
  const badgeClass =
    TYPE_BADGE_COLORS[variable.type] ?? "bg-slate-100 text-slate-700";
  const isMultiline = variable.type === "array" || variable.type === "object";

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
          onFocus={() => {
            nameFocusedRef.current = true;
          }}
          onBlur={(e) => {
            nameFocusedRef.current = false;
            if (e.target.value !== variable.name) {
              dispatch(
                updateVariable({ id: variable.id, newName: e.target.value }),
              );
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
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
            dispatch(
              updateVariableValue({ id: variable.id, value: parsed as any }),
            );
          }}
          onFocus={() => {
            valueFocusedRef.current = true;
          }}
          onBlur={() => {
            valueFocusedRef.current = false;
          }}
          rows={3}
          className="w-full text-[11px] font-mono bg-white/60 rounded border border-current/20 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-current/20 resize-none leading-relaxed"
          placeholder={
            variable.type === "array"
              ? '["item1", "item2"]'
              : '{"key": "value"}'
          }
        />
      ) : (
        <input
          type={variable.type === "number" ? "number" : "text"}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            const parsed = parseValue(e.target.value, variable.type);
            dispatch(
              updateVariableValue({ id: variable.id, value: parsed as any }),
            );
          }}
          onFocus={() => {
            valueFocusedRef.current = true;
          }}
          onBlur={() => {
            valueFocusedRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full h-7 text-[11px] font-mono bg-white/60 rounded border border-current/20 px-2 focus:outline-none focus:ring-2 focus:ring-current/20"
          placeholder={
            variable.type === "boolean" ? "true / false" : "value..."
          }
        />
      )}
    </div>
  );
};
