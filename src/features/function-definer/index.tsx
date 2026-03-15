"use client";

import { CodeEditor } from "@/components/code-editor";
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
  addWhenSubAction,
  removeWhenSubAction,
  updateWhenSubAction,
  addLoopSubAction,
  removeLoopSubAction,
  updateLoopSubAction,
  updateLoopParams,
  addCodeSnippet,
} from "@/state/slices/editorSlice";
import { FunctionActionInterface } from "@/state/types";
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
    if: {
      desc: "Evaluates one or more JS conditions (===, !==, <, >, etc.). Result is boolean stored as @if1, @if2, …",
      params: ["condition"],
    },
    when: {
      desc: "Runs sub-actions only when the condition is true. No value is stored — pure control flow.",
      params: ["condition"],
    },
    loop: {
      desc: "Iterates from start to end by step, running process actions on each iteration. Sub-actions start with the full current value (@this = whole array/value). Use 'use @this' as the first sub-action to switch context to the current element — after that, all chained actions operate on that element. Without 'use @this', methods like join or reverse run on the whole collection each iteration. Returns an array collecting the final result of each iteration.",
      params: ["start", "end", "step"],
    },
    code: {
      desc: "Execute JavaScript code with @token access. The return value becomes the new working value. All @tokens (@this, @arg1, @temp1, @math1, @pick(1), @space, @comma, @empty) are available.",
      params: ["code"],
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
  ifCount: number = 0,
  options?: { loopContext?: boolean },
) {
  const tokens = [...AT_TOKEN_BASE];
  if (options?.loopContext) {
    // Inside a loop, @this in a "use" sub-action resolves to the current element.
    // Add hints so the user knows about this pattern.
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

// ─── If condition helpers ─────────────────────────────────────────────────────

const IF_OPERATORS = [
  { value: "===", label: "===" },
  { value: "!==", label: "!==" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
] as const;

type IfOp = (typeof IF_OPERATORS)[number]["value"];

type ConditionRow = {
  id: string;
  left: string;
  op: IfOp;
  right: string;
  connector: "&&" | "||";
};

function parseConditionExpr(expr: string): ConditionRow[] {
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

function serializeConditionRows(rows: ConditionRow[]): string {
  const parts: string[] = [];
  rows.forEach((row, i) => {
    parts.push(`${row.left} ${row.op} ${row.right}`);
    if (i < rows.length - 1) parts.push(row.connector);
  });
  return parts.join(" ");
}

// ─── Method selector ──────────────────────────────────────────────────────────

const MAGIC_NAMES = ["math", "temp", "return", "use", "code"] as const;
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
  code: {
    dot: "bg-teal-400",
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    label: "code",
  },
};

const IF_INDICATOR = {
  dot: "bg-rose-400",
  badge: "border-rose-200 bg-rose-50 text-rose-700",
  label: "condition",
};

const WHEN_INDICATOR = {
  dot: "bg-violet-400",
  badge: "border-violet-200 bg-violet-50 text-violet-700",
  label: "when",
};

const LOOP_INDICATOR = {
  dot: "bg-indigo-400",
  badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
  label: "loop",
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
  const isIfSelected = value === "if";
  const isWhenSelected = value === "when";
  const isLoopSelected = value === "loop";
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
              : isIfSelected
                ? IF_INDICATOR.badge
                : isWhenSelected
                  ? WHEN_INDICATOR.badge
                  : isLoopSelected
                    ? LOOP_INDICATOR.badge
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
        {isIfSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              IF_INDICATOR.dot,
            )}
          />
        )}
        {isWhenSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              WHEN_INDICATOR.dot,
            )}
          />
        )}
        {isLoopSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              LOOP_INDICATOR.dot,
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

// ─── IfConditionBuilder ───────────────────────────────────────────────────────

const IfConditionBuilder = ({
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

// ─── WhenSubActionRow ─────────────────────────────────────────────────────────

const WhenSubActionRow = ({
  functionId,
  whenActionId,
  subActionId,
  subActionIndex,
  outerPrecedingActions,
}: {
  functionId: string;
  whenActionId: string;
  subActionId: string;
  subActionIndex: number;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector((state) => state.editor.functions);
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputFocusedRef = React.useRef(false);

  const whenAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === whenActionId);

  const subAction = whenAction?.subActions?.find((sa) => sa.id === subActionId);
  const subActionName = (subAction?.name ?? "") as string;
  const subActionDataType = (subAction?.dataType ?? "") as string;
  const subActionValue = (subAction?.value?.join(",") ?? "") as string;
  const subActionCodeName = subAction?.codeName ?? "";

  const codeSnippets = useAppSelector((state) => state.editor.codeSnippets);
  const [codeName, setCodeName] = React.useState(subActionCodeName);
  const codeNameRef = React.useRef(subActionCodeName);

  React.useEffect(() => {
    setCodeName(subActionCodeName);
    codeNameRef.current = subActionCodeName;
  }, [subActionCodeName]);

  // Don't sync from Redux while the user is actively typing — it trims trailing
  // spaces mid-keystroke and causes characters to be dropped.
  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(subActionValue);
  }, [subActionValue]);
  React.useEffect(() => {
    setShowExamples(true);
  }, [subActionName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== functionId),
    [functions, functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (subActionDataType) {
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
      { name: "code", params: "n" },
    ];
    const callEntries = callableFunctions.map((fn) => ({
      name: `${CALL_PREFIX}${fn.name}`,
      params: "n" as string | number,
    }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [subActionDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === subActionName)?.params ?? 0,
    [funcList, subActionName],
  );

  const innerPrecedingSubActions = useMemo(
    () => whenAction?.subActions?.slice(0, subActionIndex) ?? [],
    [whenAction, subActionIndex],
  );

  const atTokens = useMemo(() => {
    const all = [...outerPrecedingActions, ...innerPrecedingSubActions];
    return buildAtTokens(
      all.filter((a) => a.name === "temp").length,
      all.filter((a) => a.name === "math").length,
      all.length,
      all.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions, innerPrecedingSubActions]);

  const dispatchUpdateImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateWhenSubAction({
        functionId,
        whenActionId,
        subActionId,
        subAction: {
          id: subActionId,
          name: actionName,
          dataType: actionDataType,
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" || actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };
  const dispatchUpdate = useDebounce(dispatchUpdateImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    dispatchUpdateImpl({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: subActionValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    dispatchUpdateImpl({
      actionName: "code",
      actionDataType: subActionDataType,
      actionValue: snippet.code,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
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
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
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
    <div className="rounded border border-slate-200 p-1.5 space-y-1.5 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {subActionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={() =>
            dispatch(
              removeWhenSubAction({ functionId, whenActionId, subActionId }),
            )
          }
          className="h-5 w-5 ml-auto"
        >
          <IconTrash size={11} />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Select
          value={subActionDataType}
          onValueChange={(v) =>
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: v,
              actionValue: subActionValue,
            })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[90px] h-7 text-xs",
              !subActionDataType && "border-red-400",
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
          value={subActionName}
          funcList={funcList}
          funcDataType={subActionDataType}
          onChange={(v) =>
            dispatchUpdate({
              actionName: v,
              actionDataType: subActionDataType,
              actionValue: subActionValue,
            })
          }
        />

        {paramsCount !== 0 && subActionName !== "if" && subActionName !== "code" && (
          <Input
            ref={inputRef}
            className="flex-1 min-w-[80px] h-7 text-xs"
            placeholder={
              paramsCount === "n"
                ? "@arg1, @arg2"
                : Array.from({ length: paramsCount as number })
                    .map((_, i) => `@arg${i + 1}`)
                    .join(", ")
            }
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
              setTimeout(() => setAtQuery(null), 150);
            }}
          />
        )}
      </div>

      {subActionName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              dispatchUpdate({
                actionName: "code",
                actionDataType: subActionDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {subActionName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {subActionName !== "if" && subActionName !== "code" && (
        <SuggestionPanel
          dataType={subActionDataType}
          methodName={subActionName}
          atQuery={atQuery}
          atTokens={atTokens}
          showExamples={showExamples}
          inputValue={value}
          onTokenSelect={insertToken}
          onExampleSelect={(expr) => {
            setValue(expr);
            setAtQuery(null);
            setShowExamples(false);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
};

// ─── LoopSubActionRow ─────────────────────────────────────────────────────────

const LoopSubActionRow = ({
  functionId,
  loopActionId,
  subActionId,
  subActionIndex,
  outerPrecedingActions,
}: {
  functionId: string;
  loopActionId: string;
  subActionId: string;
  subActionIndex: number;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector((state) => state.editor.functions);
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputFocusedRef = React.useRef(false);

  const loopAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === loopActionId);

  const subAction = loopAction?.subActions?.find((sa) => sa.id === subActionId);
  const subActionName = (subAction?.name ?? "") as string;
  const subActionDataType = (subAction?.dataType ?? "") as string;
  const subActionValue = (subAction?.value?.join(",") ?? "") as string;
  const subActionCodeName = subAction?.codeName ?? "";

  const codeSnippets = useAppSelector((state) => state.editor.codeSnippets);
  const [codeName, setCodeName] = React.useState(subActionCodeName);
  const codeNameRef = React.useRef(subActionCodeName);

  React.useEffect(() => {
    setCodeName(subActionCodeName);
    codeNameRef.current = subActionCodeName;
  }, [subActionCodeName]);

  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(subActionValue);
  }, [subActionValue]);
  React.useEffect(() => {
    setShowExamples(true);
  }, [subActionName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== functionId),
    [functions, functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (subActionDataType) {
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
      { name: "code", params: "n" },
    ];
    const callEntries = callableFunctions.map((fn) => ({
      name: `${CALL_PREFIX}${fn.name}`,
      params: "n" as string | number,
    }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [subActionDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === subActionName)?.params ?? 0,
    [funcList, subActionName],
  );

  const innerPrecedingSubActions = useMemo(
    () => loopAction?.subActions?.slice(0, subActionIndex) ?? [],
    [loopAction, subActionIndex],
  );

  const atTokens = useMemo(() => {
    const all = [...outerPrecedingActions, ...innerPrecedingSubActions];
    return buildAtTokens(
      all.filter((a) => a.name === "temp").length,
      all.filter((a) => a.name === "math").length,
      all.length,
      all.filter((a) => a.name === "if").length,
      { loopContext: true },
    );
  }, [outerPrecedingActions, innerPrecedingSubActions]);

  const dispatchUpdateImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateLoopSubAction({
        functionId,
        loopActionId,
        subActionId,
        subAction: {
          id: subActionId,
          name: actionName,
          dataType: actionDataType,
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" || actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };
  const dispatchUpdate = useDebounce(dispatchUpdateImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    dispatchUpdateImpl({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: subActionValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    dispatchUpdateImpl({
      actionName: "code",
      actionDataType: subActionDataType,
      actionValue: snippet.code,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
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
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
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
    <div className="rounded border border-slate-200 p-1.5 space-y-1.5 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {subActionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={() =>
            dispatch(
              removeLoopSubAction({ functionId, loopActionId, subActionId }),
            )
          }
          className="h-5 w-5 ml-auto"
        >
          <IconTrash size={11} />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Select
          value={subActionDataType}
          onValueChange={(v) =>
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: v,
              actionValue: subActionValue,
            })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[90px] h-7 text-xs",
              !subActionDataType && "border-red-400",
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
          value={subActionName}
          funcList={funcList}
          funcDataType={subActionDataType}
          onChange={(v) =>
            dispatchUpdate({
              actionName: v,
              actionDataType: subActionDataType,
              actionValue: subActionValue,
            })
          }
        />

        {paramsCount !== 0 && subActionName !== "if" && subActionName !== "code" && (
          <Input
            ref={inputRef}
            className="flex-1 min-w-[80px] h-7 text-xs"
            placeholder={
              paramsCount === "n"
                ? "@arg1, @arg2"
                : Array.from({ length: paramsCount as number })
                    .map((_, i) => `@arg${i + 1}`)
                    .join(", ")
            }
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
              setTimeout(() => setAtQuery(null), 150);
            }}
          />
        )}
      </div>

      {subActionName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              dispatchUpdate({
                actionName: "code",
                actionDataType: subActionDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {subActionName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {subActionName !== "if" && subActionName !== "code" && (
        <SuggestionPanel
          dataType={subActionDataType}
          methodName={subActionName}
          atQuery={atQuery}
          atTokens={atTokens}
          showExamples={showExamples}
          inputValue={value}
          onTokenSelect={insertToken}
          onExampleSelect={(expr) => {
            setValue(expr);
            setAtQuery(null);
            setShowExamples(false);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
};

// ─── LoopBlock ────────────────────────────────────────────────────────────────

const LoopBlock = ({
  functionId,
  loopActionId,
  outerPrecedingActions,
}: {
  functionId: string;
  loopActionId: string;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector((state) => state.editor.functions);

  const loopAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === loopActionId);

  const subActions = loopAction?.subActions ?? [];
  const loopParams = loopAction?.loopParams ?? {
    start: "0",
    end: "@this.length",
    step: "1",
  };

  const atTokens = useMemo(() => {
    return buildAtTokens(
      outerPrecedingActions.filter((a) => a.name === "temp").length,
      outerPrecedingActions.filter((a) => a.name === "math").length,
      outerPrecedingActions.length,
      outerPrecedingActions.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions]);

  const updateParams = useDebounce(
    (params: { start?: string; end?: string; step?: string }) => {
      dispatch(
        updateLoopParams({ functionId, loopActionId, loopParams: params }),
      );
    },
    300,
  );

  return (
    <div className="mt-1 space-y-1">
      <div className="rounded-md bg-indigo-50 border border-indigo-200 p-2 space-y-2">
        <p className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wide">
          Loop Parameters
        </p>
        <p className="text-[11px] text-indigo-600 leading-relaxed">
          Iterates from <strong>start</strong> to <strong>end</strong> by{" "}
          <strong>step</strong>. Use positive step to count up, negative to
          count down. Supports @ tokens like{" "}
          <code className="bg-indigo-100 px-1 rounded text-[10px]">
            @this.length
          </code>
          .
        </p>
        <div className="border-t border-indigo-200 pt-1.5 space-y-1.5">
          <p className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wide">
            How sub-actions work
          </p>
          <div className="text-[11px] text-indigo-600 leading-relaxed space-y-1">
            <p>
              By default, each sub-action operates on the{" "}
              <strong>full current value</strong> (the whole array or object).
              Methods like{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                join
              </code>
              ,{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                reverse
              </code>
              , or{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                length
              </code>{" "}
              apply to the entire collection on each iteration.
            </p>
            <p>
              To work with <strong>individual elements</strong>, add{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                use @this
              </code>{" "}
              as the first sub-action — it switches context to the current
              element. All subsequent actions then chain off that element.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1">
            <div className="rounded bg-white border border-indigo-200 p-1.5">
              <p className="text-[10px] text-indigo-500 font-semibold mb-0.5">
                Whole collection (no use)
              </p>
              <p className="text-[10px] text-indigo-800 font-mono">
                loop 0..3 → join @empty → ["abc","abc","abc"]
              </p>
            </div>
            <div className="rounded bg-white border border-indigo-200 p-1.5">
              <p className="text-[10px] text-indigo-500 font-semibold mb-0.5">
                Per element (with use @this)
              </p>
              <p className="text-[10px] text-indigo-800 font-mono">
                loop 0..3 → use @this → toUpperCase → ["A","B","C"]
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="start (0)"
          defaultValue={loopParams.start}
          onChange={(e) =>
            updateParams({ ...loopParams, start: e.target.value })
          }
        />
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="end (@this.length)"
          defaultValue={loopParams.end}
          onChange={(e) => updateParams({ ...loopParams, end: e.target.value })}
        />
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="step (1)"
          defaultValue={loopParams.step}
          onChange={(e) =>
            updateParams({ ...loopParams, step: e.target.value })
          }
        />
      </div>

      <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide pt-1">
        Process (for each iteration):
      </p>
      <div className="ml-2 border-l-2 border-indigo-200 pl-2 space-y-1">
        {subActions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-1.5 border border-dashed rounded">
            No process actions yet.
          </p>
        ) : (
          subActions.map((sa, idx) => (
            <LoopSubActionRow
              key={sa.id}
              functionId={functionId}
              loopActionId={loopActionId}
              subActionId={sa.id}
              subActionIndex={idx}
              outerPrecedingActions={outerPrecedingActions}
            />
          ))
        )}
        <button
          type="button"
          onClick={() =>
            dispatch(
              addLoopSubAction({
                functionId,
                loopActionId,
                subAction: { id: "", name: "", dataType: "", value: [] },
              }),
            )
          }
          className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 px-1 py-0.5 rounded hover:bg-indigo-50"
        >
          <IconCircleDashedPlus size={11} />
          add process action
        </button>
      </div>
    </div>
  );
};

// ─── WhenBlock ────────────────────────────────────────────────────────────────

const WhenBlock = ({
  functionId,
  whenActionId,
  conditionValue,
  outerPrecedingActions,
  onConditionChange,
}: {
  functionId: string;
  whenActionId: string;
  conditionValue: string;
  outerPrecedingActions: FunctionActionInterface[];
  onConditionChange: (expr: string) => void;
}) => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector((state) => state.editor.functions);

  const subActions =
    functions
      .find((fn) => fn.id === functionId)
      ?.actions.find((a) => a.id === whenActionId)?.subActions ?? [];

  const atTokens = useMemo(() => {
    return buildAtTokens(
      outerPrecedingActions.filter((a) => a.name === "temp").length,
      outerPrecedingActions.filter((a) => a.name === "math").length,
      outerPrecedingActions.length,
      outerPrecedingActions.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions]);

  return (
    <div className="mt-1 space-y-1">
      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">
        Condition:
      </p>
      <IfConditionBuilder
        value={conditionValue}
        atTokens={atTokens}
        onChange={onConditionChange}
      />

      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide pt-1">
        Then:
      </p>
      <div className="ml-2 border-l-2 border-violet-200 pl-2 space-y-1">
        {subActions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-1.5 border border-dashed rounded">
            No sub-actions yet.
          </p>
        ) : (
          subActions.map((sa, idx) => (
            <WhenSubActionRow
              key={sa.id}
              functionId={functionId}
              whenActionId={whenActionId}
              subActionId={sa.id}
              subActionIndex={idx}
              outerPrecedingActions={outerPrecedingActions}
            />
          ))
        )}
        <button
          type="button"
          onClick={() =>
            dispatch(
              addWhenSubAction({
                functionId,
                whenActionId,
                subAction: { id: "", name: "", dataType: "", value: [] },
              }),
            )
          }
          className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 px-1 py-0.5 rounded hover:bg-violet-50"
        >
          <IconCircleDashedPlus size={11} />
          add sub-action
        </button>
      </div>
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
  const inputFocusedRef = React.useRef(false);

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

  const funcCodeName = React.useMemo(() => {
    return functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)?.codeName ?? "";
  }, [functions, payload.functionId, payload.actionId]);

  const codeSnippets = useAppSelector((state) => state.editor.codeSnippets);
  const [codeName, setCodeName] = React.useState(funcCodeName);
  const codeNameRef = React.useRef(funcCodeName);

  React.useEffect(() => {
    setCodeName(funcCodeName);
    codeNameRef.current = funcCodeName;
  }, [funcCodeName]);

  // Don't sync from Redux while the user is actively typing — it trims trailing
  // spaces mid-keystroke and causes characters to be dropped.
  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(funcValue);
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
      { name: "code", params: "n" },
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
    const ifCount = precedingActions.filter((a) => a.name === "if").length;
    return buildAtTokens(tempCount, mathCount, pickCount, ifCount);
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
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" ||
            actionName === "when" ||
            actionName === "loop" ||
            actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };

  const handleDatatype = useDebounce(handleDatatypeImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    handleDatatypeImpl({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: funcValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    handleDatatypeImpl({
      actionName: "code",
      actionDataType: funcDataType,
      actionValue: snippet.code,
    });
  };

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
        {funcName !== "when" && funcName !== "loop" && (
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
        )}

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

        {paramsCount !== 0 &&
          funcName !== "if" &&
          funcName !== "when" &&
          funcName !== "loop" &&
          funcName !== "code" && (
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
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
                setTimeout(() => setAtQuery(null), 150);
              }}
            />
          )}
      </div>

      {/* Code editor block */}
      {funcName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              handleDatatype({
                actionName: "code",
                actionDataType: funcDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {/* If condition builder */}
      {funcName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            handleDatatype({
              actionName: funcName,
              actionDataType: funcDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {/* When block — condition + nested sub-actions */}
      {funcName === "when" && (
        <WhenBlock
          functionId={payload.functionId}
          whenActionId={payload.actionId}
          conditionValue={value}
          outerPrecedingActions={precedingActions}
          onConditionChange={(expr) => {
            setValue(expr);
            handleDatatype({
              actionName: "when",
              actionDataType: "",
              actionValue: expr,
            });
          }}
        />
      )}

      {/* Loop block — iteration parameters + nested process actions */}
      {funcName === "loop" && (
        <LoopBlock
          functionId={payload.functionId}
          loopActionId={payload.actionId}
          outerPrecedingActions={precedingActions}
        />
      )}

      {/* Suggestion panel */}
      {funcName !== "if" &&
        funcName !== "when" &&
        funcName !== "loop" &&
        funcName !== "code" && (
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
      )}
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
              <span>
                <code className="bg-rose-100 px-1 rounded text-rose-700">
                  if
                </code>{" "}
                — condition check
              </span>
              <span>
                <code className="bg-violet-100 px-1 rounded text-violet-700">
                  when
                </code>{" "}
                — conditional block
              </span>
              <span>
                <code className="bg-indigo-100 px-1 rounded text-indigo-700">
                  loop
                </code>{" "}
                — iteration block
              </span>
              <span>
                <code className="bg-teal-100 px-1 rounded text-teal-700">
                  code
                </code>{" "}
                — JavaScript block
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
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">fn</span>
                <Badge variant="secondary" className="font-mono text-xs py-0">
                  {func.name}
                </Badge>
                <Badge variant="outline" className="text-xs py-0 ml-auto">
                  {func.actions.length}
                </Badge>
                <Button
                  onClick={() => toggleDetail(func.id)}
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    "hover:bg-slate-100 active:scale-95",
                  )}
                >
                  {isShown(func.id) ? (
                    <IconEyeMinus size={13} />
                  ) : (
                    <IconEyePlus size={13} />
                  )}
                </Button>
              </div>

              <div className={cn("grid grid-cols-2 gap-1", "lg:grid-cols-5")}>
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
                  className={cn(
                    "h-7 text-xs gap-1.5 px-2.5",
                    "border-slate-300 bg-white text-slate-700",
                    "hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900",
                    "active:scale-95 transition-all duration-150",
                  )}
                >
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <span className="font-medium">Add</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      addFunctionAction({
                        functionId: func.id,
                        action: { id: "", name: "if", dataType: "", value: [] },
                      }),
                    )
                  }
                  className={cn(
                    "h-7 text-xs gap-1.5 px-2.5",
                    "border-rose-300 bg-rose-50 text-rose-700",
                    "hover:bg-rose-100 hover:border-rose-400 hover:text-rose-800",
                    "active:scale-95 transition-all duration-150",
                  )}
                >
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <span className="font-medium">If</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      addFunctionAction({
                        functionId: func.id,
                        action: {
                          id: "",
                          name: "when",
                          dataType: "",
                          value: [],
                        },
                      }),
                    )
                  }
                  className={cn(
                    "h-7 text-xs gap-1.5 px-2.5",
                    "border-violet-300 bg-violet-50 text-violet-700",
                    "hover:bg-violet-100 hover:border-violet-400 hover:text-violet-800",
                    "active:scale-95 transition-all duration-150",
                  )}
                >
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <span className="font-medium">When</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      addFunctionAction({
                        functionId: func.id,
                        action: {
                          id: "",
                          name: "loop",
                          dataType: "",
                          value: [],
                          loopParams: {
                            start: "0",
                            end: "@this.length",
                            step: "1",
                          },
                        },
                      }),
                    )
                  }
                  className={cn(
                    "h-7 text-xs gap-1.5 px-2.5",
                    "border-indigo-300 bg-indigo-50 text-indigo-700",
                    "hover:bg-indigo-100 hover:border-indigo-400 hover:text-indigo-800",
                    "active:scale-95 transition-all duration-150",
                  )}
                >
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <span className="font-medium">Loop</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      addFunctionAction({
                        functionId: func.id,
                        action: {
                          id: "",
                          name: "code",
                          dataType: "",
                          value: ["return @this;\n"],
                        },
                      }),
                    )
                  }
                  className={cn(
                    "h-7 text-xs gap-1.5 px-2.5",
                    "border-teal-300 bg-teal-50 text-teal-700",
                    "hover:bg-teal-100 hover:border-teal-400 hover:text-teal-800",
                    "active:scale-95 transition-all duration-150",
                  )}
                >
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <span className="font-medium">Code</span>
                </Button>
              </div>
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
