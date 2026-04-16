import React from "react";
import { CALL_PREFIX, METHOD_DESCRIPTIONS, MATH_EXAMPLES } from "../constants";

export const SuggestionPanel = ({
  dataType,
  methodName,
  atQuery,
  atTokens,
  showExamples,
  inputValue,
  onTokenSelect,
  onExampleSelect,
}: {
  dataType: string;
  methodName: string;
  atQuery: string | null;
  atTokens: { token: string; desc: string }[];
  showExamples: boolean;
  inputValue: string;
  onTokenSelect: (token: string) => void;
  onExampleSelect: (expr: string) => void;
}) => {
  const isCallAction = methodName.startsWith(CALL_PREFIX);
  const callTarget = isCallAction ? methodName.slice(CALL_PREFIX.length) : null;
  const info = isCallAction
    ? {
        desc: `Calls function "${callTarget}" with current value as input. Returns its result.`,
        params: ["...args"],
      }
    : (METHOD_DESCRIPTIONS[methodName] ?? null);
  const filteredTokens =
    atQuery !== null && atQuery !== undefined
      ? atTokens.filter((t) => {
          const tokenWithoutAt = t.token.slice(1).toLowerCase();
          const query = (atQuery || "").toLowerCase();
          return (
            tokenWithoutAt.startsWith(query) || tokenWithoutAt.includes(query)
          );
        })
      : [];

  const hasMethodInfo = methodName && info;
  const hasTokens = atQuery !== null && filteredTokens.length > 0;
  const isMath = methodName === "math";

  if (!hasMethodInfo && !hasTokens) return null;

  const paramSig = info && info.params.length > 0 ? info.params.join(", ") : "";

  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 p-2 space-y-2 text-xs mt-1">
      {/* Method signature + description */}
      {hasMethodInfo && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            {dataType && (
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0 rounded font-mono text-[11px]">
                {dataType}
              </span>
            )}
            <span className="font-mono font-semibold text-slate-800">
              .{methodName}({paramSig})
            </span>
          </div>
          <p className="text-slate-500 leading-snug">{info!.desc}</p>
        </div>
      )}

      {/* Mathjs examples */}
      {isMath && !hasTokens && showExamples && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Examples — click to use
          </p>
          {MATH_EXAMPLES.map((group) => (
            <div key={group.category}>
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.expr}
                    type="button"
                    title={item.desc}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onExampleSelect(item.expr);
                    }}
                    className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    {item.expr}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick-insert for return / use — show when no @-query is active and input is empty */}
      {(methodName === "return" || methodName === "use") &&
        !hasTokens &&
        !inputValue && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              quick insert
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
                      onExampleSelect(t.token);
                    }}
                    className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                  >
                    {t.token}
                  </button>
                ))}
            </div>
          </div>
        )}

      {/* @ token suggestions */}
      {hasTokens && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            @ tokens
          </p>
          <div className="flex flex-col gap-0.5">
            {filteredTokens.map((t) => (
              <button
                key={t.token}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onTokenSelect(t.token);
                }}
                className="flex items-center gap-2 px-1.5 py-0.5 rounded hover:bg-slate-200 text-left w-full"
              >
                <code className="text-blue-700 font-mono text-[11px]">
                  {t.token}
                </code>
                <span className="text-slate-500">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
