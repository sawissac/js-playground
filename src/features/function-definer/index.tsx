"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrayFunctions } from "@/constants/array";
import { BooleanFunctions } from "@/constants/boolean";
import { NumberFunctions } from "@/constants/number";
import { ObjectFunctions } from "@/constants/object";
import { StringFunctions } from "@/constants/string";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { cn } from "@/lib/utils";
import {
  addFunctionAction,
  removeFunctionAction,
  updateFunctionAction,
  reorderFunctionActions,
} from "@/state/slices/editorSlice";
import {
  IconCheck,
  IconChevronDown,
  IconCircleDashedPlus,
  IconEyeMinus,
  IconEyePlus,
  IconGripVertical,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import React, { useMemo } from "react";

// ─── Method descriptions ──────────────────────────────────────────────────────

const METHOD_DESCRIPTIONS: Record<string, { desc: string; params: string[] }> =
  {
    // String
    length: { desc: "Returns the number of characters.", params: [] },
    charAt: {
      desc: "Returns the character at the given index.",
      params: ["index"],
    },
    charCodeAt: {
      desc: "Returns the UTF-16 char code at the given index.",
      params: ["index"],
    },
    at: {
      desc: "Returns char at index; supports negative indexing.",
      params: ["index"],
    },
    indexOf: {
      desc: "Returns the first index of search value, or -1.",
      params: ["search"],
    },
    lastIndexOf: {
      desc: "Returns the last index of search value, or -1.",
      params: ["search"],
    },
    includes: {
      desc: "Returns true if string/array contains the value.",
      params: ["search"],
    },
    startsWith: {
      desc: "Returns true if string starts with the given value.",
      params: ["search"],
    },
    endsWith: {
      desc: "Returns true if string ends with the given value.",
      params: ["search"],
    },
    slice: {
      desc: "Extracts a section from start to end index.",
      params: ["start", "end"],
    },
    substring: {
      desc: "Returns part of the string between two indexes.",
      params: ["start", "end"],
    },
    substr: {
      desc: "Returns characters from start, up to length chars.",
      params: ["start", "length"],
    },
    toUpperCase: { desc: "Converts all characters to uppercase.", params: [] },
    toLowerCase: { desc: "Converts all characters to lowercase.", params: [] },
    trim: { desc: "Removes whitespace from both ends.", params: [] },
    trimStart: { desc: "Removes leading (start) whitespace.", params: [] },
    trimEnd: { desc: "Removes trailing (end) whitespace.", params: [] },
    repeat: { desc: "Returns the string repeated N times.", params: ["count"] },
    replace: {
      desc: "Replaces the first match with replacement.",
      params: ["search", "replacement"],
    },
    replaceAll: {
      desc: "Replaces all matches with replacement.",
      params: ["search", "replacement"],
    },
    split: {
      desc: "Splits the string into an array by separator.",
      params: ["separator"],
    },
    concat: {
      desc: "Joins strings or arrays together.",
      params: ["...values"],
    },
    match: { desc: "Returns regex matches as an array.", params: ["pattern"] },
    matchAll: {
      desc: "Returns all regex matches as an iterator.",
      params: ["pattern"],
    },
    search: {
      desc: "Returns the index of the regex match, or -1.",
      params: ["pattern"],
    },
    padStart: {
      desc: "Pads the start of the string to target length.",
      params: ["length", "pad"],
    },
    padEnd: {
      desc: "Pads the end of the string to target length.",
      params: ["length", "pad"],
    },
    normalize: {
      desc: "Returns the Unicode normalization form.",
      params: ["form"],
    },
    valueOf: { desc: "Returns the primitive value.", params: [] },
    toString: { desc: "Converts the value to a string.", params: [] },
    // Array
    every: {
      desc: "Returns true if all elements pass the callback test.",
      params: ["callback"],
    },
    fill: {
      desc: "Fills elements with a static value.",
      params: ["value", "start", "end"],
    },
    filter: {
      desc: "Returns a new array of elements passing the test.",
      params: ["callback"],
    },
    find: {
      desc: "Returns the first element passing the test.",
      params: ["callback"],
    },
    findIndex: {
      desc: "Returns the index of the first matching element.",
      params: ["callback"],
    },
    findLast: {
      desc: "Returns the last element passing the test.",
      params: ["callback"],
    },
    findLastIndex: {
      desc: "Returns the index of the last matching element.",
      params: ["callback"],
    },
    flat: {
      desc: "Flattens nested arrays by the given depth.",
      params: ["depth"],
    },
    flatMap: { desc: "Maps then flattens one level.", params: ["callback"] },
    forEach: {
      desc: "Calls the callback for each element.",
      params: ["callback"],
    },
    join: {
      desc: "Joins all array elements into a string.",
      params: ["separator"],
    },
    keys: { desc: "Returns an iterator of the array's indexes.", params: [] },
    map: {
      desc: "Returns a new array with callback results.",
      params: ["callback"],
    },
    pop: { desc: "Removes and returns the last element.", params: [] },
    push: {
      desc: "Adds elements to the end; returns new length.",
      params: ["...elements"],
    },
    reverse: { desc: "Reverses the array in place.", params: [] },
    shift: { desc: "Removes and returns the first element.", params: [] },
    some: {
      desc: "Returns true if any element passes the test.",
      params: ["callback"],
    },
    sort: { desc: "Sorts the array in place.", params: ["compareFn"] },
    splice: {
      desc: "Adds/removes elements at the given index.",
      params: ["start", "deleteCount", "...items"],
    },
    unshift: {
      desc: "Adds elements to the start; returns new length.",
      params: ["...elements"],
    },
    values: { desc: "Returns an iterator of the array's values.", params: [] },
    // Number
    toFixed: {
      desc: "Formats number with N decimal places.",
      params: ["digits"],
    },
    toExponential: {
      desc: "Returns the number in exponential notation.",
      params: ["digits"],
    },
    toPrecision: {
      desc: "Returns number to a given precision.",
      params: ["precision"],
    },
    // Object
    entries: { desc: "Returns an array of [key, value] pairs.", params: [] },
    assign: {
      desc: "Copies properties from sources into target.",
      params: ["target", "...sources"],
    },
    freeze: {
      desc: "Freezes the object — no further modifications.",
      params: [],
    },
    hasOwn: {
      desc: "Returns true if the property is on the object.",
      params: ["property"],
    },
    fromEntries: {
      desc: "Creates an object from [key, value] pairs.",
      params: ["entries"],
    },
    // Magic actions
    math: {
      desc: "Evaluates a math expression via mathjs. Result stored as @math1, @math2, ...",
      params: ["expression"],
    },
    temp: {
      desc: "Stores a resolved value for later use as @temp1, @temp2, ...",
      params: ["value"],
    },
    return: {
      desc: "Returns a specific resolved value as the function result.",
      params: ["value"],
    },
    use: {
      desc: "Replaces the current working value with a token (@arg1, @temp1, …). All actions after this chain off the new value.",
      params: ["reference"],
    },
  };

// ─── @ token helpers ──────────────────────────────────────────────────────────

const AT_TOKEN_BASE: { token: string; desc: string }[] = [
  { token: "@this", desc: "current working value" },
  { token: "@t", desc: "current value (short)" },
  { token: "@arg1", desc: "1st function argument" },
  { token: "@arg2", desc: "2nd function argument" },
  { token: "@arg3", desc: "3rd function argument" },
  { token: "@space", desc: 'space character " "' },
  { token: "@s", desc: "space (short)" },
  { token: "@comma", desc: 'comma character ","' },
  { token: "@c", desc: "comma (short)" },
  { token: "@empty", desc: 'empty string ""' },
  { token: "@e", desc: "empty (short)" },
];

function buildAtTokens(
  tempCount: number,
  mathCount: number,
  pickCount: number,
) {
  const tokens = [...AT_TOKEN_BASE];
  for (let i = 1; i <= tempCount; i++)
    tokens.push({ token: `@temp${i}`, desc: `stored temp #${i}` });
  for (let i = 1; i <= mathCount; i++)
    tokens.push({ token: `@math${i}`, desc: `math result #${i}` });
  for (let i = 1; i <= pickCount; i++)
    tokens.push({ token: `@pick(${i})`, desc: `step result #${i}` });
  return tokens;
}

// ─── Mathjs examples ──────────────────────────────────────────────────────────

const MATH_EXAMPLES: {
  category: string;
  items: { expr: string; desc: string }[];
}[] = [
  {
    category: "Arithmetic",
    items: [
      { expr: "@this + 1", desc: "add 1" },
      { expr: "@this - 1", desc: "subtract 1" },
      { expr: "@this * 2", desc: "multiply by 2" },
      { expr: "@this / 2", desc: "divide by 2" },
      { expr: "@this ^ 2", desc: "square" },
      { expr: "@this % 2", desc: "modulo 2" },
      { expr: "@arg1 + @arg2", desc: "add two args" },
      { expr: "@arg1 - @arg2", desc: "subtract args" },
      { expr: "@arg1 * @arg2", desc: "multiply args" },
      { expr: "@arg1 / @arg2", desc: "divide args" },
    ],
  },
  {
    category: "Rounding",
    items: [
      { expr: "ceil(@this)", desc: "round up" },
      { expr: "floor(@this)", desc: "round down" },
      { expr: "round(@this)", desc: "round nearest" },
      { expr: "round(@this, 2)", desc: "2 decimal places" },
      { expr: "abs(@this)", desc: "absolute value" },
      { expr: "fix(@this)", desc: "truncate decimal" },
      { expr: "sign(@this)", desc: "sign: -1, 0, or 1" },
    ],
  },
  {
    category: "Powers & Roots",
    items: [
      { expr: "sqrt(@this)", desc: "square root" },
      { expr: "cbrt(@this)", desc: "cube root" },
      { expr: "nthRoot(@this, 4)", desc: "4th root" },
      { expr: "exp(@this)", desc: "e^x" },
      { expr: "pow(@arg1, @arg2)", desc: "arg1 ^ arg2" },
      { expr: "@this ^ 0.5", desc: "square root via pow" },
    ],
  },
  {
    category: "Logarithms",
    items: [
      { expr: "log(@this)", desc: "natural log (ln)" },
      { expr: "log10(@this)", desc: "base-10 log" },
      { expr: "log2(@this)", desc: "base-2 log" },
      { expr: "log(@this, 2)", desc: "log base 2 (explicit)" },
    ],
  },
  {
    category: "Trigonometry",
    items: [
      { expr: "sin(@this)", desc: "sine (radians)" },
      { expr: "cos(@this)", desc: "cosine (radians)" },
      { expr: "tan(@this)", desc: "tangent (radians)" },
      { expr: "asin(@this)", desc: "arcsine" },
      { expr: "acos(@this)", desc: "arccosine" },
      { expr: "atan(@this)", desc: "arctangent" },
      { expr: "atan2(@arg1, @arg2)", desc: "atan2(y, x)" },
      { expr: "sin(pi / 2)", desc: "sin 90° = 1" },
      { expr: "cos(0)", desc: "cos 0° = 1" },
    ],
  },
  {
    category: "Aggregation",
    items: [
      { expr: "max(@arg1, @arg2)", desc: "maximum" },
      { expr: "min(@arg1, @arg2)", desc: "minimum" },
      { expr: "sum(@arg1, @arg2)", desc: "sum" },
      { expr: "mean(@arg1, @arg2)", desc: "average" },
      { expr: "hypot(@arg1, @arg2)", desc: "hypotenuse √(a²+b²)" },
      { expr: "gcd(@arg1, @arg2)", desc: "greatest common divisor" },
      { expr: "lcm(@arg1, @arg2)", desc: "least common multiple" },
    ],
  },
  {
    category: "Combinatorics",
    items: [
      { expr: "factorial(@this)", desc: "n!" },
      { expr: "combinations(@arg1, @arg2)", desc: "nCr" },
      { expr: "permutations(@arg1, @arg2)", desc: "nPr" },
    ],
  },
  {
    category: "Constants",
    items: [
      { expr: "pi", desc: "π ≈ 3.14159" },
      { expr: "e", desc: "Euler's number ≈ 2.718" },
      { expr: "phi", desc: "golden ratio ≈ 1.618" },
      { expr: "Infinity", desc: "∞" },
    ],
  },
  {
    category: "Combine Results",
    items: [
      { expr: "@math1 + @math2", desc: "add two math results" },
      { expr: "@math1 * @this", desc: "multiply result by current value" },
      { expr: "@math1 + @arg1", desc: "math result plus arg" },
    ],
  },
];

// ─── Method selector ──────────────────────────────────────────────────────────

const MAGIC_NAMES = ["math", "temp", "return", "use"] as const;
type MagicName = (typeof MAGIC_NAMES)[number];

const MAGIC_INDICATORS: Record<
  MagicName,
  { dot: string; badge: string; label: string }
> = {
  math: {
    dot: "bg-purple-400",
    badge: "border-purple-200 bg-purple-50 text-purple-700",
    label: "formula",
  },
  temp: {
    dot: "bg-amber-400",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    label: "store",
  },
  return: {
    dot: "bg-green-400",
    badge: "border-green-200 bg-green-50 text-green-700",
    label: "output",
  },
  use: {
    dot: "bg-sky-400",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    label: "switch",
  },
};

const CALL_PREFIX = "call:";
const CALL_INDICATOR = {
  dot: "bg-emerald-400",
  badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  label: "fn",
};

const MethodItem = ({
  name,
  params,
  isMagic,
  isCall,
  isSelected,
  onSelect,
}: {
  name: string;
  params: string | number;
  isMagic: boolean;
  isCall?: boolean;
  isSelected: boolean;
  onSelect: (v: string) => void;
}) => {
  const info = isMagic ? MAGIC_INDICATORS[name as MagicName] : null;
  const displayName = isCall ? name.slice(CALL_PREFIX.length) : name;
  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={cn(
        "flex items-center w-full px-2 py-1 gap-1.5 text-left hover:bg-accent",
        isSelected && "bg-accent",
      )}
    >
      {isMagic && info ? (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", info.dot)} />
      ) : isCall ? (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            CALL_INDICATOR.dot,
          )}
        />
      ) : (
        <span className="w-1.5 shrink-0" />
      )}
      <span
        className={cn(
          "flex-1 font-mono text-xs",
          (isMagic || isCall) && "font-semibold",
        )}
      >
        {displayName}
      </span>
      <span
        className={cn(
          "text-[10px] px-1 rounded font-mono shrink-0",
          params === 0
            ? "text-slate-400 bg-slate-100"
            : "text-blue-600 bg-blue-50",
        )}
      >
        {params === 0 ? "∅" : params === "n" ? "n" : `${params}p`}
      </span>
      {isSelected ? (
        <IconCheck size={10} className="text-green-600 shrink-0" />
      ) : (
        <span className="w-2.5 shrink-0" />
      )}
    </button>
  );
};

const MethodSelector = ({
  value,
  funcList,
  funcDataType,
  onChange,
}: {
  value: string;
  funcList: { name: string | number; params: string | number }[];
  funcDataType: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  const magic = funcList.filter((fn) =>
    MAGIC_NAMES.includes(fn.name as MagicName),
  );
  const callable = funcList.filter((fn) =>
    String(fn.name).startsWith(CALL_PREFIX),
  );
  const builtin = funcList.filter(
    (fn) =>
      !MAGIC_NAMES.includes(fn.name as MagicName) &&
      !String(fn.name).startsWith(CALL_PREFIX),
  );
  const q = search.toLowerCase();
  const filteredMagic = q
    ? magic.filter((fn) => String(fn.name).includes(q))
    : magic;
  const filteredCallable = q
    ? callable.filter((fn) =>
        String(fn.name).slice(CALL_PREFIX.length).includes(q),
      )
    : callable;
  const filteredBuiltin = q
    ? builtin.filter((fn) => String(fn.name).includes(q))
    : builtin;

  const isMagicSelected = MAGIC_NAMES.includes(value as MagicName);
  const magicInfo = isMagicSelected
    ? MAGIC_INDICATORS[value as MagicName]
    : null;
  const isCallSelected = value.startsWith(CALL_PREFIX);
  const callTarget = isCallSelected ? value.slice(CALL_PREFIX.length) : null;
  const selectedFn = funcList.find((fn) => fn.name === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-7 text-xs flex items-center gap-1 px-2 rounded border w-[130px]",
          isMagicSelected && magicInfo
            ? magicInfo.badge
            : isCallSelected
              ? CALL_INDICATOR.badge
              : "border-input bg-background text-foreground hover:bg-accent",
        )}
      >
        {isMagicSelected && magicInfo && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", magicInfo.dot)}
          />
        )}
        {isCallSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              CALL_INDICATOR.dot,
            )}
          />
        )}
        <span className="flex-1 text-left font-mono text-xs truncate">
          {value ? (
            isCallSelected ? (
              callTarget
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground font-sans">method</span>
          )}
        </span>
        {selectedFn && (
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            {selectedFn.params === 0
              ? "∅"
              : selectedFn.params === "n"
                ? "n"
                : `${selectedFn.params}p`}
          </span>
        )}
        <IconChevronDown size={10} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-56 rounded-md border bg-white shadow-lg overflow-hidden">
          <div className="px-2 py-1.5 border-b bg-slate-50">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search method..."
              className="w-full text-xs outline-none bg-transparent placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredMagic.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                  Magic
                </p>
                {filteredMagic.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredCallable.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                  Call Function
                </p>
                {filteredCallable.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic={false}
                    isCall
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredBuiltin.length > 0 && (
              <div>
                {funcDataType && (
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                    {funcDataType}
                  </p>
                )}
                {filteredBuiltin.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic={false}
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredMagic.length === 0 &&
              filteredCallable.length === 0 &&
              filteredBuiltin.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No methods found
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SuggestionPanel ──────────────────────────────────────────────────────────

const SuggestionPanel = ({
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
      {(methodName === "return" || methodName === "use") && !hasTokens && !inputValue && (
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

// ─── FunctionActionInput ──────────────────────────────────────────────────────

const FunctionActionInput = (payload: {
  functionId: string;
  actionId: string;
  actionDataType: string;
  actionName: string;
  actionIndex: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector((state) => state.editor.functions);
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const funcName = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)?.name ?? "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  // Re-show examples whenever the selected method changes or the input is cleared
  React.useEffect(() => {
    setShowExamples(true);
  }, [funcName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const funcDataType = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)?.dataType ??
      "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  const funcValue = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)
      ?.value?.join(",") ?? "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  // Sync funcValue from Redux store to local state
  React.useEffect(() => {
    setValue(funcValue);
  }, [funcValue]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== payload.functionId),
    [functions, payload.functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (funcDataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      case "array":
        typedFunctions = ArrayFunctions;
        break;
      case "number":
        typedFunctions = NumberFunctions;
        break;
      case "boolean":
        typedFunctions = BooleanFunctions;
        break;
      case "object":
        typedFunctions = ObjectFunctions;
        break;
    }
    const magic: { name: string | number; params: string | number }[] = [
      { name: "math", params: "n" },
      { name: "temp", params: 1 },
      { name: "return", params: 1 },
      { name: "use", params: 1 },
    ];
    const callEntries: { name: string | number; params: string | number }[] =
      callableFunctions.map((fn) => ({
        name: `${CALL_PREFIX}${fn.name}`,
        params: "n",
      }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [functions, funcDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === funcName)?.params ?? 0,
    [funcList, funcName],
  );

  // Compute available @temp / @math tokens from preceding actions
  const precedingActions = useMemo(() => {
    const actions =
      functions.find((fn) => fn.id === payload.functionId)?.actions ?? [];
    return actions.slice(0, payload.actionIndex);
  }, [functions, payload.functionId, payload.actionIndex]);

  const atTokens = useMemo(() => {
    const tempCount = precedingActions.filter((a) => a.name === "temp").length;
    const mathCount = precedingActions.filter((a) => a.name === "math").length;
    const pickCount = precedingActions.length;
    return buildAtTokens(tempCount, mathCount, pickCount);
  }, [precedingActions]);

  const handleRemove = () =>
    dispatch(
      removeFunctionAction({
        functionId: payload.functionId,
        actionId: payload.actionId,
      }),
    );

  const handleDatatypeImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateFunctionAction({
        functionId: payload.functionId,
        actionId: payload.actionId,
        action: {
          id: payload.actionId,
          name: actionName,
          dataType: actionDataType,
          value: actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };

  const handleDatatype = useDebounce(handleDatatypeImpl, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    // Detect @ token being typed (including parentheses for @pick(N))
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);

    handleDatatype({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: val,
    });
  };

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    if (!atMatch) return;
    const start = cursor - atMatch[0].length;
    const newVal = val.slice(0, start) + token + val.slice(cursor);
    setValue(newVal);
    setAtQuery(null);
    handleDatatype({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: newVal,
    });
    setTimeout(() => {
      if (inputRef.current) {
        const pos = start + token.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  return (
    <div
      draggable
      onDragStart={() => payload.onDragStart(payload.actionIndex)}
      onDragOver={(e) => payload.onDragOver(e, payload.actionIndex)}
      onDragEnd={payload.onDragEnd}
      onDrop={() => payload.onDrop(payload.actionIndex)}
      className={cn(
        "rounded border border-slate-200 p-1.5 my-1 space-y-1.5 transition-all cursor-move",
        "hover:shadow-sm hover:border-slate-300",
        payload.isDragging && "opacity-40 scale-95",
        payload.isDragOver && "border-blue-400 bg-blue-50 border-2",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <IconGripVertical
          size={14}
          className="shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing"
        />
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {payload.actionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleRemove}
          className={cn(
            "h-5 w-5 ml-auto transition-all duration-200",
            "hover:scale-110 active:scale-95",
          )}
        >
          <IconTrash size={11} />
        </Button>
      </div>

      {/* Selectors row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Select
          defaultValue={payload.actionDataType}
          value={funcDataType}
          onValueChange={(v) =>
            handleDatatype({
              actionName: funcName,
              actionDataType: v,
              actionValue: funcValue,
            })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[90px] h-7 text-xs",
              !funcDataType && "border-red-400 focus:ring-red-200",
            )}
          >
            <SelectValue placeholder="type" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((dt, i) => (
              <SelectItem key={i} value={dt} className="text-xs">
                {dt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MethodSelector
          value={funcName}
          funcList={funcList}
          funcDataType={funcDataType}
          onChange={(v) =>
            handleDatatype({
              actionName: v,
              actionDataType: funcDataType,
              actionValue: funcValue,
            })
          }
        />

        {paramsCount !== 0 && (
          <Input
            ref={inputRef}
            className={cn(
              "flex-1 min-w-[80px] h-7 text-xs transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20",
            )}
            placeholder={
              paramsCount === "n"
                ? "@arg1, @arg2"
                : Array.from({ length: paramsCount as number })
                    .map((_, i) => `@arg${i + 1}`)
                    .join(", ")
            }
            value={value}
            onChange={handleInputChange}
            onBlur={() => setTimeout(() => setAtQuery(null), 150)}
          />
        )}
      </div>

      {/* Suggestion panel */}
      <SuggestionPanel
        dataType={funcDataType}
        methodName={funcName}
        atQuery={atQuery}
        atTokens={atTokens}
        showExamples={showExamples}
        inputValue={value}
        onTokenSelect={insertToken}
        onExampleSelect={(expr) => {
          setValue(expr);
          setAtQuery(null);
          setShowExamples(false);
          handleDatatype({
            actionName: funcName,
            actionDataType: funcDataType,
            actionValue: expr,
          });
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      />
    </div>
  );
};

// ─── Supporting panels ────────────────────────────────────────────────────────

const TokensReference = () => (
  <div className="text-xs text-muted-foreground space-y-0.5">
    <p className="font-semibold text-foreground mb-1">@ Tokens:</p>
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
      <span>
        <code className="bg-muted px-1 rounded">@arg1</code>,{" "}
        <code className="bg-muted px-1 rounded">@arg2</code> — args
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@this</code> /{" "}
        <code className="bg-muted px-1 rounded">@t</code> — current value
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@temp1</code> — stored temp
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@math1</code> — math result
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@pick(1)</code> — step result
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@space</code> — " "
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@comma</code> — ","
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@empty</code> — ""
      </span>
    </div>
  </div>
);

const InstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left text-blue-700 font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200 hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-2 text-xs">
          <p className="text-blue-900">
            Build step-by-step action chains for each function. Each action runs
            on the result of the previous step.
          </p>
          <div className="space-y-0.5">
            <p className="font-semibold text-blue-900">Magic actions:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-blue-800">
              <span>
                <code className="bg-blue-100 px-1 rounded">math</code> — eval
                expression
              </span>
              <span>
                <code className="bg-blue-100 px-1 rounded">temp</code> — save
                value
              </span>
              <span>
                <code className="bg-blue-100 px-1 rounded">return</code> —
                return value
              </span>
              <span>
                <code className="bg-blue-100 px-1 rounded">use</code> — switch
                context
              </span>
            </div>
          </div>
          <TokensReference />
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── FunctionDefiner ──────────────────────────────────────────────────────────

const FunctionDefiner = () => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector((state) => state.editor.functions);
  const [showDetails, setShowDetails] = React.useState<Record<string, boolean>>(
    {},
  );
  const isShown = (id: string) => showDetails[id] !== false;
  const toggleDetail = (id: string) =>
    setShowDetails((prev) => ({ ...prev, [id]: !isShown(id) }));
  const [dragState, setDragState] = React.useState<{
    functionId: string | null;
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({ functionId: null, dragIndex: null, dragOverIndex: null });

  const handleDragStart = (functionId: string, index: number) => {
    setDragState({ functionId, dragIndex: index, dragOverIndex: null });
  };

  const handleDragOver = (
    e: React.DragEvent,
    functionId: string,
    index: number,
  ) => {
    e.preventDefault();
    if (dragState.functionId === functionId && dragState.dragIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  };

  const handleDragEnd = () => {
    setDragState({ functionId: null, dragIndex: null, dragOverIndex: null });
  };

  const handleDrop = (functionId: string, toIndex: number) => {
    if (
      dragState.functionId === functionId &&
      dragState.dragIndex !== null &&
      dragState.dragIndex !== toIndex
    ) {
      dispatch(
        reorderFunctionActions({
          functionId,
          fromIndex: dragState.dragIndex,
          toIndex,
        }),
      );
    }
    setDragState({ functionId: null, dragIndex: null, dragOverIndex: null });
  };

  return (
    <div className="space-y-2 pb-[300px]">
      <InstructionPanel />

      {functions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
          No functions yet — create some in the <strong>Functions panel</strong>
          .
        </p>
      ) : (
        functions.map((func) => (
          <div
            key={func.id}
            className="w-full p-2 shadow-md shadow-slate-200 rounded-md space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">fn</span>
              <Badge variant="secondary" className="font-mono text-xs py-0">
                {func.name}
              </Badge>
              <Badge variant="outline" className="text-xs py-0 ml-auto">
                {func.actions.length}
              </Badge>
              <Button
                variant="outline"
                onClick={() =>
                  dispatch(
                    addFunctionAction({
                      functionId: func.id,
                      action: { id: "", name: "", dataType: "", value: [] },
                    }),
                  )
                }
                className="h-6 text-xs gap-1 px-2"
              >
                <IconCircleDashedPlus size={12} />
                Add
              </Button>
              <Button
                onClick={() => toggleDetail(func.id)}
                size="icon"
                variant="ghost"
                className="h-6 w-6"
              >
                {isShown(func.id) ? (
                  <IconEyeMinus size={13} />
                ) : (
                  <IconEyePlus size={13} />
                )}
              </Button>
            </div>

            <div className={isShown(func.id) ? "block" : "hidden"}>
              {func.actions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded">
                  No actions — click Add to start.
                </p>
              ) : (
                func.actions.map((action, actionIndex) => (
                  <FunctionActionInput
                    key={action.id}
                    functionId={func.id}
                    actionId={action.id}
                    actionDataType={action.dataType}
                    actionName={action.name}
                    actionIndex={actionIndex}
                    onDragStart={(index) => handleDragStart(func.id, index)}
                    onDragOver={(e, index) => handleDragOver(e, func.id, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(index) => handleDrop(func.id, index)}
                    isDragging={
                      dragState.functionId === func.id &&
                      dragState.dragIndex === actionIndex
                    }
                    isDragOver={
                      dragState.functionId === func.id &&
                      dragState.dragOverIndex === actionIndex
                    }
                  />
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FunctionDefiner;
