export const METHOD_DESCRIPTIONS: Record<string, { desc: string; params: string[] }> =
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

export const AT_TOKEN_BASE: { token: string; desc: string }[] = [
  { token: "@this", desc: "current working value" },
  { token: "@t", desc: "current value (short)" },
  { token: "@arg1", desc: "1st function argument" },
  { token: "@arg2", desc: "2nd function argument" },
  { token: "@arg3", desc: "3rd function argument" },
  { token: "@renderer", desc: "renderer element ID" },
  { token: "@r", desc: "renderer ID (short)" },
  { token: "@space", desc: 'space character " "' },
  { token: "@s", desc: "space (short)" },
  { token: "@comma", desc: 'comma character ","' },
  { token: "@c", desc: "comma (short)" },
  { token: "@empty", desc: 'empty string ""' },
  { token: "@e", desc: "empty (short)" },
];

export const MATH_EXAMPLES: {
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

export const IF_OPERATORS = [
  { value: "===", label: "===" },
  { value: "!==", label: "!==" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
] as const;

export const MAGIC_NAMES = ["math", "temp", "return", "use", "code"] as const;

export const MAGIC_INDICATORS: Record<
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

export const IF_INDICATOR = {
  dot: "bg-rose-400",
  badge: "border-rose-200 bg-rose-50 text-rose-700",
  label: "condition",
};

export const WHEN_INDICATOR = {
  dot: "bg-violet-400",
  badge: "border-violet-200 bg-violet-50 text-violet-700",
  label: "when",
};

export const LOOP_INDICATOR = {
  dot: "bg-indigo-400",
  badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
  label: "loop",
};

export const CALL_PREFIX = "call:";

export const CALL_INDICATOR = {
  dot: "bg-emerald-400",
  badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  label: "fn",
};
