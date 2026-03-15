# JS Playground — Codebase Dataset

## Project

**Description:** An interactive visual JavaScript playground where users can define variables, create reusable functions with chained method actions, compose runner flows, and see execution logs in real-time. No actual JS code is written by the user — it's a visual scripting engine.

**Stack:**
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| State | Redux Toolkit |
| UI | Shadcn UI + Tabler Icons + Lucide React |
| Styling | Tailwind CSS |
| Math | mathjs |
| UUID | uuid |
| Visualization | d3 |

---

## App

Root layout (`src/app/layout.tsx`) loads Geist Sans/Mono fonts and wraps the entire app in `ReduxProvider`.

### Routes

#### `/` — `src/app/page.tsx`
Home page. Currently renders a placeholder `<div>Hello</div>`.

#### `/editor` — `src/app/editor/page.tsx`
Main application page. Responsive layout with desktop, tablet, and mobile views.

**Desktop Layout (lg+):** 3-column resizable panel layout
| Panel | Default Size | Components |
|---|---|---|
| Left (top) | 22% / 60% height | `VariableContainer`, `DataTypeContainer`, `FunctionsContainer` |
| Left (bottom) | 22% / 40% height | `CodeSidebar` (code preview) |
| Center | 40% | `FunctionDefiner` with collapsible panel controls |
| Right (top) | 38% / 40% height | `RunnerDefiner` |
| Right (middle) | 38% / 32% height | `CodeDetail` (Objects + FlowChart tabs) |
| Right (bottom) | 38% / 28% height | `LogContainer` |

**Tablet Layout (md-lg):** 2-column workflow grid
**Mobile Layout (<md):** Sequential vertical workflow

**Features:**
- Collapsible left/right panels with toggle buttons
- Animated panel transitions
- Persistent panel state during resize

---

## Constants

Maps built-in JavaScript method names to their parameter counts.
- `0` = no params
- `N` = fixed N params
- `"n"` = variadic

### `src/constants/dataTypes.ts` — `DataTypes`

```ts
export const DataTypes = ["string", "array", "number", "boolean", "object"] as const;
```

### `src/constants/string.ts` — `StringFunctions`

```ts
export const StringFunctions = [
  ["length", 0], ["charAt", 1], ["charCodeAt", 1], ["at", 1],
  ["indexOf", 1], ["lastIndexOf", 1], ["includes", 1],
  ["startsWith", 1], ["endsWith", 1], ["slice", 2], ["substring", 2],
  ["substr", 2], ["toUpperCase", 0], ["toLowerCase", 0], ["trim", 0],
  ["trimStart", 0], ["trimEnd", 0], ["repeat", 1], ["replace", 2],
  ["replaceAll", 2], ["split", 1], ["concat", "n"], ["match", 1],
  ["matchAll", 1], ["search", 1], ["padStart", 2], ["padEnd", 2],
  ["valueOf", 0], ["toString", 0], ["normalize", 1],
] as const;
```

### `src/constants/array.ts` — `ArrayFunctions`

```ts
export const ArrayFunctions = [
  ["length", 0], ["at", 1], ["concat", "n"], ["every", 1], ["fill", 3],
  ["filter", 1], ["find", 1], ["findIndex", 1], ["findLast", 1],
  ["findLastIndex", 1], ["flat", 1], ["flatMap", 1], ["forEach", 1],
  ["includes", 1], ["indexOf", 1], ["join", 1], ["keys", 0],
  ["lastIndexOf", 1], ["map", 1], ["pop", 0], ["push", "n"],
  ["reverse", 0], ["shift", 0], ["slice", 2], ["some", 1],
  ["sort", 1], ["splice", "n"], ["unshift", "n"], ["values", 0],
] as const;
```

### `src/constants/number.ts` — `NumberFunctions`

```ts
export const NumberFunctions = [
  ["toFixed", 1], ["toExponential", 1], ["toPrecision", 1],
  ["toString", 1], ["valueOf", 0],
] as const;
```

### `src/constants/boolean.ts` — `BooleanFunctions`

```ts
export const BooleanFunctions = [
  ["toString", 0], ["valueOf", 0],
] as const;
```

### `src/constants/object.ts` — `ObjectFunctions`

```ts
export const ObjectFunctions = [
  ["keys", 0], ["values", 0], ["entries", 0], ["assign", "n"],
  ["freeze", 0], ["hasOwn", 1], ["fromEntries", 1],
] as const;
```

---

## Features

### `VariableContainer` — `src/features/variable-container/index.tsx`

Add and manage named variables.

**Behaviors:**
- Input supports batch creation: `var1, var2, var3:array, var4:string`
- Inline type syntax: `varName:dataType` sets type on creation
- Validates: no empty names, no duplicates, only valid data types
- Edit/delete via hover buttons on each variable item
- Show/hide details toggle
- Keyboard shortcuts: `Alt/Cmd/Ctrl+1` to focus, `Alt/Cmd/Ctrl+E` to submit

**Dispatches:** `addVariable`, `updateVariable`, `removeVariable`, `updateDataType`

---

### `DataTypeContainer` — `src/features/data-type-container/index.tsx`

Assign data types to existing variables.

**Behaviors:**
- Two dropdowns: select variable, then pick data type
- Submit button disabled until all variables have an assigned type
- Show/hide assignment details toggle

**Dispatches:** `updateDataType`

---

### `FunctionsContainer` — `src/features/functions-container/index.tsx`

Create and manage named function definitions.

**Behaviors:**
- Input supports batch creation: `func1, func2`
- Validates: no empty names, no duplicates
- Edit/delete via hover buttons
- Show/hide details toggle
- Keyboard shortcuts: `Alt/Cmd/Ctrl+3` to focus, `Alt/Cmd/Ctrl+E` to submit

**Dispatches:** `addFunctionName`, `updateFunctionName`, `removeFunctionName`

---

### `FunctionDefiner` — `src/features/function-definer/index.tsx`

Define ordered method-chain actions for each function.

**Behaviors:**
- Each action has: dataType selector, method/function selector, parameter input
- Method list is filtered by selected dataType (string or array methods)
- Debounced updates (300ms) to avoid excessive dispatches during typing
- Delete button removes individual actions

**Magic actions:**
| Action | Behavior |
|---|---|
| `math` | Evaluate mathematical expressions using mathjs |
| `temp` | Store a value in a temporary slot (accessed via `@temp1`, `@temp2`, ...) |
| `return` | Return a specific resolved value from the function |
| `use` | Switch the current working value to a resolved reference |
| `when` | Conditional execution — evaluates condition, runs sub-actions if true |
| `loop` | Iteration block — runs sub-actions for range (start..end, step) |
| `call:functionName` | Call another user-defined function by name |

**Dispatches:** `addFunctionAction`, `updateFunctionAction`, `removeFunctionAction`

---

### `RunnerDefiner` — `src/features/runner-definer/index.tsx`

Compose an ordered list of steps that set variables or call functions, then execute them.

**Runner types:**
| Type | Icon | Fields |
|---|---|---|
| `set` | triangle | variable selector, value input |
| `call` | square | variable selector, function selector (filtered by variable), args input (comma-separated) |

**Behaviors:**
- "Set Variable" button disabled if no typed variables exist
- "Call Function" button disabled if no functions exist
- "Run" button disabled if any runner step is incomplete
- Debounced updates (300ms)

**Dispatches:** `createSetRunner`, `createCallRunner`, `updateRunner`, `removeRunner`

---

### `LogContainer` — `src/features/log-container/index.tsx`

Display execution output and messages with enhanced context tracking.

**Behaviors:**
- Three filter tabs: Error (red), Warning (yellow), Info (blue)
- Badge shows count per log type
- Clear all logs button
- Sticky header with filters
- Dark `slate-800` background
- Auto-scroll to bottom on new logs

**Enhanced Log Display:**
- **Timestamps:** Shows elapsed time (+Xms or +Xs) from first log
- **Context badges:** Visual indicators for log source (runner, error, step, function)
- **Color coding:** Icons and text colored by context type
- **Animations:** Smooth fade-in and slide-in transitions

**Dispatches:** `clearLogs`

---

### `CodeSidebar` — `src/features/code-sidebar/index.tsx`

Real-time JavaScript-like code preview of variables, functions, and runner steps.

**Behaviors:**
- Syntax-highlighted preview with custom color scheme
- Displays variables with type annotations and values
- Shows function definitions with nested actions
- Renders control flow blocks (when, loop) with proper indentation
- Runner steps shown as assignment or function call notation
- Empty state: `// empty` placeholder

**Rendering Features:**
- Type-specific colors (string: green, number: blue, boolean: purple, array: orange, object: yellow)
- Special action highlighting (math: purple, temp: yellow, return: green, use: cyan)
- Nested sub-actions indented within control flow blocks
- Value formatting based on data type

---

### `CodeDetail` — `src/features/code-detail/index.tsx`

Tabbed visualization panel with Objects inspector and FlowChart diagram.

**Tabs:**
| Tab | Icon | Purpose |
|---|---|---|
| Objects | box icon | JSON tree view of variables and their values |
| FlowChart | workflow icon | D3-powered visual flow diagram of function execution |

**Objects Tab:**
- Displays all variables with type and value in JSON format
- Empty state message when no variables exist

**FlowChart Tab:**
- Visual diagram of selected function's action flow
- Function selector dropdown
- D3.js rendering (implementation pending)
- Empty state message when no functions exist

---

## Hooks

### `useDebounce` — `src/hooks/useDebounce.ts`

```ts
useDebounce<T extends (...args: any[]) => void>(callback: T, delay?: number): (...args: Parameters<T>) => void
```

Generic debounce hook. Delays callback execution by `delay` ms (default 300ms). Cleans up timeout on unmount. Used in `FunctionDefiner` and `RunnerDefiner`.

---

### `useRunner` — `src/hooks/useRunner.ts`

```ts
useRunner(): { run: () => void }
```

Returns a `run()` function that executes all runner steps sequentially.

**Execution logic:**
1. Reads `variables`, `functions`, and `runner` list from Redux store
2. For `set` runners: finds target variable → converts value by type (string as-is, array via split on comma) → dispatches `updateVariableValue` → logs info
3. For `call` runners: finds target variable and function → calls `fnRunner(variableValue, args, functionActions)` → dispatches `updateVariableValue` with result → logs info
4. On error: dispatches `addLog` with type `"error"`

**Dependencies:** `editorSlice` selectors, `logSlice.addLog`, `fnRunner` from `lib/function-utils`

---

## Lib

### `cn` — `src/lib/utils.ts`

```ts
cn(...inputs: ClassValue[]): string
```

Merges Tailwind CSS class names using `clsx` + `tailwind-merge`.

---

### `listenToKeys` — `src/lib/keyListener-utils.ts`

```ts
listenToKeys(callback: (event: KeyboardEvent) => void, target?: any): () => void
```

Attaches a `keydown` event listener to a target (default: `window`). Returns a cleanup function. Used for keyboard shortcuts in feature components.

---

### `uniqueIdentifier` — `src/lib/function-utils.ts`

```ts
uniqueIdentifier(value: string[], args: any[], temp: any, mathTemp: any[], tempVar: any[]): any[]
```

Resolves special `@`-prefixed reference tokens in action parameter arrays.

| Token | Resolves to |
|---|---|
| `@arg1`, `@arg2`, ... | Nth function argument (1-indexed) |
| `@math1`, `@math2`, ... | Nth stored math result |
| `@temp1`, `@temp2`, ... | Nth stored temp variable |
| `@pick(1)`, `@pick(2)`, ... | Nth step result from function execution (1-indexed) |
| `@this` / `@t` | Current working value (`temp`) |
| `@this.property` | Property access on current value (e.g., `@this.length`, `@this.name`) |
| `@arg1.property` | Property access on arguments (e.g., `@arg1.email`) |
| `@space` / `@s` | Space character `" "` |
| `@comma` / `@c` | Comma character `","` |
| `@empty` / `@e` | Empty string `""` |

**Property Access:** Tokens support dot notation for nested property access (e.g., `@this.user.name`, `@arg1.address.city`)

---

### `fnRunner` — `src/lib/function-utils.ts`

```ts
fnRunner(payload: any, args: any[], actions: FunctionActionInterface[], allFunctions?: FunctionInterface[]): any
```

Core execution engine. Processes actions sequentially, maintaining:
- `temp` — current working value
- `tempVar[]` — stored temp variables
- `mathTemp[]` — stored math results

**Action handlers (evaluated in order):**

| Handler | Condition | Behavior |
|---|---|---|
| Function call | `typeof temp[action.name] === 'function'` and not a magic action | Calls `temp[name](...resolvedArgs)`, sets `temp` to result |
| `math` | `action.name === 'math'` | Evaluates expression via `mathjs.evaluate()`, pushes to `mathTemp`, `temp` unchanged |
| `temp` | `action.name === 'temp'` | Pushes resolved value to `tempVar`, `temp` unchanged |
| `when` | `action.name === 'when'` | Evaluates condition string; if true, recursively processes `subActions` |
| `loop` | `action.name === 'loop'` | Iterates from `start` to `end` by `step`; runs `subActions` each iteration |
| `call:*` | `action.name.startsWith('call:')` | Calls user-defined function by name; passes args and current `temp` |
| `return` | `action.name === 'return'` | Sets `temp` to first resolved value; stops processing |
| `use` | `action.name === 'use'` | Sets `temp` to first resolved value (switches working context) |
| Property access | default fallback | Sets `temp` to `temp[action.name]` |

**Control Flow Details:**

**`when` (Conditional):**
- Evaluates condition string with `@token` resolution
- Bare string literals automatically quoted for safety (e.g., `@this == hello` → `"value" == "hello"`)
- JavaScript expressions supported (e.g., `@this > 5`, `@arg1.length === 3`)
- Sub-actions only execute if condition evaluates to `true`

**`loop` (Iteration):**
- Parameters: `start` (default: 0), `end` (default: `@this.length`), `step` (default: 1)
- Supports `@token` references in parameters
- Sub-actions executed for each iteration
- Can access loop counter and iterate over arrays

**`call:*` (Function Calls):**
- Syntax: `call:functionName` where `functionName` matches a user-defined function
- Passes arguments via `value` array (supports `@tokens`)
- Returns result of called function
- Supports recursive and nested function calls

**Error handling:** Wraps all errors as `"Function execution error: <message>"`.

---

## State

Redux Toolkit store with two slices: `editor` and `log`.

| File | Purpose |
|---|---|
| `src/state/store.ts` | Configures store with both reducers |
| `src/state/provider.tsx` | `ReduxProvider` component — mounted in `layout.tsx` |
| `src/state/hooks.ts` | Typed `useAppDispatch` and `useAppSelector` hooks |
| `src/state/types.ts` | All shared TypeScript interfaces |

### Types — `src/state/types.ts`

```ts
interface VariableInterface {
  id: string;       // uuid
  name: string;
  type: string;     // 'string' | 'array' | '' (unset)
  value: any;       // string or string[]
}

interface FunctionActionInterface {
  id: string;                    // uuid
  name: string;                  // method name or magic action
  dataType: string;              // 'string' | 'array' | 'number' | 'boolean' | 'object'
  value: any;                    // string[] — may contain @tokens
  subActions?: FunctionActionInterface[]; // for "when" conditional blocks and "loop" iterations
  loopParams?: {                 // for "loop" action parameters
    start?: string;              // loop start value (default: 0)
    end?: string;                // loop end value (default: @this.length)
    step?: string;               // loop step increment (default: 1)
  };
}

interface FunctionInterface {
  id: string;       // uuid
  name: string;
  dataType: string; // inferred from last action's dataType
  actions: FunctionActionInterface[];
}

interface Runner {
  id: string;                         // uuid
  type: 'set' | 'call';
  target: [string, string];           // [variableName, valueOrFunctionName]
  args: any[];                        // arguments for function calls
}

interface EditorState {
  dataTypes: string[];                // ['string', 'array', 'number', 'boolean']
  variables: VariableInterface[];
  functions: FunctionInterface[];
  runner: Runner[];
}

interface LogEntry {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;             // millisecond timestamp
  context?: string;              // e.g. function name or step label
}

interface LogState {
  logs: LogEntry[];
}
```

---

### `editorSlice` — `src/state/slices/editorSlice.ts`

**Initial state:** `{ variables: [], dataTypes: ['string', 'array', 'number', 'boolean', 'object'], functions: [], runner: [] }`

**Note:** When creating a new function, it automatically initializes with two default actions:
1. `temp` action storing `@arg1`
2. `use` action switching to `@temp1`

**Variable actions:**
| Action | Payload | Behavior |
|---|---|---|
| `setVariables` | `VariableInterface[]` | Replace entire variables array |
| `addVariable` | `{ id, name }` | Push new variable with `type='string'`, `value=''` |
| `removeVariable` | `string` (id) | Filter by id |
| `updateVariable` | `{ id, newName }` | Rename variable |
| `updateVariableValue` | `{ id, value }` | Set runtime value |
| `updateDataType` | `{ id, type }` | Change variable type |

**Function actions:**
| Action | Payload | Behavior |
|---|---|---|
| `addFunctionName` | `string` | Push new function with auto uuid |
| `updateFunctionName` | `{ id, newName }` | Rename function |
| `removeFunctionName` | `string` (id) | Filter by id |
| `addFunctionAction` | `{ functionId, action }` | Push action with new uuid |
| `updateFunctionAction` | `{ functionId, actionId, action }` | Update action; also syncs `func.dataType` from last action |
| `removeFunctionAction` | `{ functionId, actionId }` | Remove action |
| `reorderFunctionActions` | `{ functionId, fromIndex, toIndex }` | Reorder actions via drag-and-drop |

**Control Flow actions:**
| Action | Payload | Behavior |
|---|---|---|
| `addWhenSubAction` | `{ functionId, whenActionId, subAction }` | Add sub-action to "when" block |
| `removeWhenSubAction` | `{ functionId, whenActionId, subActionId }` | Remove sub-action from "when" block |
| `updateWhenSubAction` | `{ functionId, whenActionId, subActionId, subAction }` | Update sub-action in "when" block |
| `reorderWhenSubActions` | `{ functionId, whenActionId, fromIndex, toIndex }` | Reorder "when" sub-actions |
| `addLoopSubAction` | `{ functionId, loopActionId, subAction }` | Add sub-action to "loop" block |
| `removeLoopSubAction` | `{ functionId, loopActionId, subActionId }` | Remove sub-action from "loop" block |
| `updateLoopSubAction` | `{ functionId, loopActionId, subActionId, subAction }` | Update sub-action in "loop" block |
| `updateLoopParams` | `{ functionId, loopActionId, loopParams }` | Update loop parameters (start, end, step) |

**Runner actions:**
| Action | Payload | Behavior |
|---|---|---|
| `createSetRunner` | void | Push `{ type: 'set', target: ['',''], args: [] }` |
| `createCallRunner` | void | Push `{ type: 'call', target: ['',''], args: [] }` |
| `updateRunner` | `{ runnerId, runner }` | Replace runner by id |
| `removeRunner` | `string` (id) | Filter by id |
| `reorderRunnerSteps` | `{ fromIndex, toIndex }` | Reorder runner steps via drag-and-drop |

---

### `logSlice` — `src/state/slices/logSlice.ts`

**Initial state:** `{ logs: [] }`

| Action | Payload | Behavior |
|---|---|---|
| `addLog` | `{ type, message, context? }` | Push new log entry with timestamp |
| `clearLogs` | void | Empty logs array |
| `removeLog` | `number` (index) | Remove log by index |

---

## Data Flow Example

End-to-end: uppercase a string and get its length.

**Step 1 — Define Variable**
Input: `myString:string`
→ Creates `VariableInterface { name: 'myString', type: 'string', value: '' }`

**Step 2 — Define Function**
Input: `processString`
→ Creates `FunctionInterface { name: 'processString', dataType: '', actions: [] }`

**Step 3 — Add Actions**
```
Action 1: { name: 'toUpperCase', dataType: 'string', value: [] }
Action 2: { name: 'length',      dataType: 'string', value: [] }
```

**Step 4 — Define Runners**
```
Runner 1 (set):  target: ['myString', 'hello'],        args: []
Runner 2 (call): target: ['myString', 'processString'], args: []
```

**Step 5 — Execute**
```
Set:  myString.value = 'hello'
Call: fnRunner('hello', [], [toUpperCase, length])
  → toUpperCase: temp = 'hello'.toUpperCase() → 'HELLO'
  → length:      temp = 'HELLO'.length        → 5
  → returns 5
myString.value updated to 5
Logs: info: "Setting variable myString to hello"
      info: "Function processString called with value 'hello' and args []"
      info: "Result: 5"
```

---

## Key Patterns

**Batch input:** Comma-separated names like `a, b, c:array` create multiple items at once in `VariableContainer` and `FunctionsContainer`.

**Type inference:** `FunctionInterface.dataType` is always derived from its last action's `dataType` — not set directly by the user.

**Token system:** Action parameter values can contain `@`-prefixed tokens (`@arg1`, `@this`, `@temp1`, `@math1`, `@space`, `@comma`, `@empty`) resolved at runtime by `uniqueIdentifier`.

**Debouncing:** `FunctionDefiner` and `RunnerDefiner` debounce input changes at 300ms to avoid flooding Redux with dispatches on every keystroke.

**UUID Keys:** All entities (variables, functions, actions, runners) use UUID v4 for unique identification. React components render using UUID keys for optimal performance.

**Keyboard shortcuts:** `VariableContainer` — `Alt/Cmd/Ctrl+1` to focus, `Alt/Cmd/Ctrl+E` to submit. `FunctionsContainer` — `Alt/Cmd/Ctrl+3` to focus.

**Data Type Support:** The playground supports 5 primitive types: `string`, `array`, `number`, `boolean`, and `object`. Each type has its own set of native JavaScript methods available.

**Control Flow:** Functions support conditional execution (`when`) and iteration (`loop`) with nested sub-actions, enabling complex logic without writing actual JavaScript code.

**Function Composition:** Functions can call other user-defined functions via `call:functionName` actions, enabling modular and reusable function design.

**Deep Cloning:** Runner execution deep-clones variable values before function processing to prevent unintended mutations and ensure predictable behavior.
