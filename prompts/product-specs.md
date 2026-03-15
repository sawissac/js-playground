# JS Playground - Product Specifications

## Component Documentation

---

# Function Definer Component Documentation

## Overview
The **FunctionDefiner** component is a sophisticated React component that provides a visual interface for building custom JavaScript functions through a chain-based action system. It enables users to construct complex data transformations without writing traditional code, using a declarative, step-by-step approach.

## Architecture

### Component Hierarchy
```
FunctionDefiner (Main Container)
├── InstructionPanel (Help/Info Popover)
├── Function Cards (One per function)
│   ├── Function Header
│   │   ├── Function Name Badge
│   │   ├── Action Count Badge
│   │   └── Toggle Visibility Button
│   ├── Action Creation Buttons
│   │   ├── Add (Generic Action)
│   │   ├── If (Condition Check)
│   │   ├── When (Conditional Block)
│   │   ├── Loop (Iteration Block)
│   │   └── Code (JavaScript Block)
│   └── FunctionActionInput[] (Action Chain)
│       ├── MethodSelector
│       ├── IfConditionBuilder
│       ├── WhenBlock
│       │   └── WhenSubActionRow[]
│       ├── LoopBlock
│       │   └── LoopSubActionRow[]
│       ├── CodeEditor
│       └── SuggestionPanel
```

## Core Features

### 1. Action Chain System
Functions are built as sequential action chains where each action operates on the result of the previous action. This creates a pipeline-style data transformation flow.

**Flow Pattern:**
```
@arg1 → action1 → action2 → action3 → return
```

### 2. Action Types

#### Standard Actions
- **Native Methods**: String, Array, Number, Boolean, Object methods
- **Data Type Specific**: Methods auto-filter based on selected data type
- **Type Safety**: Enforces data type selection for proper method filtering

#### Magic Actions
Special actions that provide meta-functionality:

- **math**: Evaluates mathematical expressions using mathjs
  - Stores result as `@math1`, `@math2`, etc.
  - Supports complex operations, trigonometry, constants
  - Examples: `@this + 1`, `sqrt(@arg1)`, `sin(pi/2)`

- **temp**: Stores intermediate values for later use
  - Stores as `@temp1`, `@temp2`, etc.
  - Useful for caching computed values

- **return**: Explicitly returns a value from the function
  - Terminates execution
  - Can return any `@token` value

- **use**: Switches the current working value context
  - Changes `@this` to the specified token
  - All subsequent actions operate on the new value

- **code**: Executes arbitrary JavaScript
  - Full `@token` access
  - Monaco editor integration
  - Snippet save/load functionality

#### Control Flow Actions

- **if**: Evaluates boolean conditions
  - Multi-condition support (&&, ||)
  - Stores result as `@if1`, `@if2`, etc.
  - Visual condition builder interface

- **when**: Conditional execution block
  - Runs sub-actions only when condition is true
  - Nested action support
  - Independent sub-action chain

- **loop**: Iteration block
  - Configurable start, end, step parameters
  - Supports `@token` in parameters (e.g., `@this.length`)
  - Per-element or whole-collection processing
  - Use `use @this` as first sub-action for element-level operations

#### Function Calls
- **call:functionName**: Calls another user-defined function
  - Recursive calls supported (different function only)
  - Passes current value as input
  - Returns function's result

## Sub-Components

### FunctionActionInput
Main action row component with full CRUD capabilities.

**Props:**
- `functionId`: UUID of parent function
- `actionId`: UUID of this action
- `actionDataType`: Data type for method filtering
- `actionName`: Selected method/action name
- `actionIndex`: Position in action chain
- Drag handlers for reordering

**Features:**
- Drag-and-drop reordering
- Data type selector
- Method selector with search
- Parameter input with `@token` autocomplete
- Real-time suggestions and examples
- Debounced Redux updates (300ms)

**State Management:**
- Local state for input values (prevents Redux sync issues during typing)
- `inputFocusedRef` prevents value updates while user is typing
- Debounced dispatch to Redux store

### MethodSelector
Searchable dropdown for selecting methods/actions.

**Categories:**
1. **Magic**: math, temp, return, use, code
2. **Call Function**: User-defined functions (prefixed with `call:`)
3. **Built-in**: Native methods for selected data type

**Visual Indicators:**
- Colored dots for different action types
- Parameter count badges (∅, n, 1p, 2p, etc.)
- Selected state checkmark
- Search filtering

### IfConditionBuilder
Visual interface for building complex boolean conditions.

**Features:**
- Multiple condition rows
- Operator selection (===, !==, ==, !=, >=, <=, >, <)
- Logical connector buttons (&&, ||)
- `@token` insertion
- Add/remove condition rows
- Live serialization to condition string

**Data Flow:**
```
User Input → ConditionRow[] → serializeConditionRows() → Redux
Redux → parseConditionExpr() → ConditionRow[] → UI
```

### WhenBlock
Conditional execution container with sub-actions.

**Structure:**
```
Condition: (IfConditionBuilder)
Then:
  ├── WhenSubActionRow 1
  ├── WhenSubActionRow 2
  └── Add Sub-Action Button
```

**Behavior:**
- Sub-actions only execute when condition is true
- Independent action chain within the block
- Access to outer `@tokens` from preceding actions

### LoopBlock
Iteration container with configurable parameters.

**Parameters:**
- **start**: Starting index (supports `@tokens`)
- **end**: Ending index (e.g., `@this.length`)
- **step**: Increment/decrement value (positive or negative)

**Processing Modes:**

1. **Whole Collection** (default):
   ```
   loop 0..3 → join(@empty) → ["abc", "abc", "abc"]
   ```
   Each iteration operates on the full array/object

2. **Per Element** (with `use @this`):
   ```
   loop 0..3 → use @this → toUpperCase → ["A", "B", "C"]
   ```
   First sub-action switches to current element

**Return Value:**
Array collecting the final result of each iteration.

### SuggestionPanel
Context-aware help panel.

**Shows:**
- Method signature and description
- Math expression examples (for `math` action)
- `@token` autocomplete dropdown
- Quick-insert buttons for `return`/`use` actions

**Trigger:**
- Typing `@` triggers token suggestions
- Method selection shows signature
- Empty input shows examples

### CodeEditor Integration
Monaco-based editor for `code` action.

**Features:**
- Syntax highlighting
- `@token` autocomplete (Cmd/Ctrl + Space)
- Variable name completion
- Snippet save/load system
- Real-time execution preview

## Token System

### Available Tokens
- `@this` / `@t`: Current working value
- `@arg1`, `@arg2`, `@arg3`: Function arguments
- `@temp1`, `@temp2`, ...: Stored temporary values
- `@math1`, `@math2`, ...: Math expression results
- `@if1`, `@if2`, ...: Condition check results
- `@pick(1)`, `@pick(2)`, ...: Result of step N
- `@space` / `@s`: Space character " "
- `@comma` / `@c`: Comma character ","
- `@empty` / `@e`: Empty string ""

### Token Resolution
Tokens are dynamically built based on:
- Preceding actions in the chain
- Action type counts (temp, math, if)
- Total action count for `@pick(N)`

## Data Flow

### Redux State
```typescript
functions: FunctionInterface[] = [
  {
    id: string,              // UUID
    name: string,            // Function name
    actions: FunctionActionInterface[] = [
      {
        id: string,          // UUID
        name: string,        // Method/action name
        dataType: string,    // Data type for filtering
        value: string[],     // Parameters
        codeName?: string,   // Code snippet name
        subActions?: FunctionActionInterface[],  // For when/loop
        loopParams?: {       // For loop action
          start: string,
          end: string,
          step: string
        }
      }
    ]
  }
]
```

### Update Flow
```
User Input
  ↓
Local State (setValue)
  ↓
Debounce (300ms)
  ↓
Dispatch Action
  ↓
Redux Reducer
  ↓
State Update
  ↓
Re-render (if !inputFocused)
```

## Drag & Drop System

### State
```typescript
dragState: {
  functionId: string | null,    // Which function's actions are being dragged
  dragIndex: number | null,     // Source index
  dragOverIndex: number | null  // Target hover index
}
```

### Event Sequence
1. **onDragStart**: Store functionId and dragIndex
2. **onDragOver**: Update dragOverIndex for visual feedback
3. **onDrop**: Dispatch `reorderFunctionActions`
4. **onDragEnd**: Clear drag state

## Method Descriptions

### Comprehensive Method Library
The component includes 60+ method descriptions across all data types:

**String Methods:** length, charAt, slice, replace, split, trim, etc.
**Array Methods:** map, filter, reduce, forEach, find, sort, etc.
**Number Methods:** toFixed, toExponential, toPrecision
**Object Methods:** entries, assign, freeze, hasOwn, fromEntries
**Boolean Methods:** toString, valueOf

### Math.js Integration
Full mathjs library with categorized examples:
- Arithmetic: +, -, *, /, ^, %
- Rounding: ceil, floor, round, abs
- Powers & Roots: sqrt, cbrt, nthRoot, exp, pow
- Logarithms: log, log10, log2
- Trigonometry: sin, cos, tan, asin, acos, atan
- Aggregation: max, min, sum, mean, hypot, gcd, lcm
- Combinatorics: factorial, combinations, permutations
- Constants: pi, e, phi, Infinity

## Performance Optimizations

### Debouncing
All Redux dispatches are debounced (300ms) to prevent excessive updates during typing.

### Memoization
Heavy computations are memoized:
- `funcList` (method filtering)
- `precedingActions` (token availability)
- `atTokens` (token list generation)
- `paramsCount` (parameter validation)

### Conditional Rendering
- Function details can be collapsed
- Actions only render when parent is expanded
- Suggestion panels conditionally show based on context

### Input Focus Tracking
Prevents Redux state from overwriting user input during active typing.

## User Interactions

### Keyboard Support
- **Enter** in input: Confirms value
- **@**: Triggers token autocomplete
- **Tab**: Navigate between fields
- **Cmd/Ctrl + Space**: CodeEditor autocomplete

### Visual Feedback
- Action type indicators (colored dots and badges)
- Drag preview (opacity, scale)
- Drop target highlight (blue border)
- Hover states on all interactive elements
- Validation highlights (red border for missing data type)

### Error Prevention
- Required fields highlighted
- Data type validation
- Parameter count hints
- Method descriptions for guidance

## Integration Points

### Redux Actions
- `addFunctionAction`: Create new action
- `updateFunctionAction`: Update action properties
- `removeFunctionAction`: Delete action
- `reorderFunctionActions`: Change action order
- `addWhenSubAction`, `removeWhenSubAction`, `updateWhenSubAction`
- `addLoopSubAction`, `removeLoopSubAction`, `updateLoopSubAction`
- `updateLoopParams`: Update loop iteration parameters
- `addCodeSnippet`: Save code snippet

### External Components
- `@/components/ui/button`, `badge`, `input`, `select`, `popover`
- `@/components/code-editor`: Monaco editor wrapper
- `@tabler/icons-react`: Icon library
- `@/lib/utils`: cn() utility for class merging

## Special Behaviors

### When vs If
- **if**: Evaluates condition, stores boolean result, continues execution
- **when**: Evaluates condition, runs sub-actions only if true, pure control flow

### Loop Context Switching
Inside loop sub-actions:
- **Without `use @this`**: Operates on full collection each iteration
- **With `use @this`**: First sub-action switches to current element

### Code Snippets
- Named code blocks can be saved
- Reusable across functions
- Stored in global Redux state
- Load via dropdown selector

### Recursive Prevention
Function calls cannot call themselves (checked by filtering `fn.id !== functionId`).

## Accessibility Considerations

### ARIA Support
- Buttons have descriptive titles
- Icons have semantic meaning
- Keyboard navigation supported

### Visual Clarity
- High contrast color coding
- Clear visual hierarchy
- Consistent spacing and alignment
- Responsive design (grid adapts to screen size)

## Best Practices for Usage

1. **Start with Data Type**: Always select data type first for proper method filtering
2. **Use Tokens**: Leverage `@tokens` for dynamic values
3. **Chain Thoughtfully**: Each action builds on the previous result
4. **Store Intermediates**: Use `temp` for values needed multiple times
5. **Name Code Blocks**: Save reusable code as named snippets
6. **Test Incrementally**: Add actions one at a time to debug flow
7. **Use Descriptions**: Read method descriptions before selecting
8. **Loop Carefully**: Understand whole vs. element processing modes

---

# Runner Definer Component Documentation

## Overview
The **RunnerDefiner** component provides a visual execution environment for orchestrating variable mutations and function calls. It allows users to compose ordered sequences of operations (runners/steps) that execute top-to-bottom, modifying variable state through assignments, function calls, or custom JavaScript code.

## Architecture

### Component Hierarchy
```
RunnerDefiner (Main Container)
├── InstructionPanel (Help/Info Popover)
├── Runner Stats Badges
│   ├── "Runner" Badge
│   └── Step Count Badge
├── Action Buttons Row
│   ├── Set Variable Button
│   ├── Call Function Button
│   ├── Code Button
│   └── Run Button
└── RunnerInput[] (Step Rows)
    ├── Step Header (with drag handle)
    ├── Step Type Badge (Set/Call/Code)
    ├── Variable Selector
    ├── Value Input (Set) OR
    ├── Function Selector + Args Input (Call) OR
    └── CodeEditor (Code)
```

## Core Concepts

### Runner Steps
Ordered operations that execute sequentially, each potentially modifying variable state.

**Step Types:**

1. **Set Variable** (Triangle Icon)
   - Assigns a literal value to a variable
   - Direct assignment operation
   - Type-aware value hints

2. **Call Function** (Square Icon)
   - Executes a user-defined function on a variable
   - Assigns the function's return value to the variable
   - Supports multiple arguments from other variables

3. **Code** (Code Icon)
   - Runs custom JavaScript with `@token` access
   - Assigns the return value to a variable
   - Full Monaco editor integration

### Execution Model

**Sequential Processing:**
```
Step 1: Set x = "hello"
  ↓
Step 2: Call uppercase(x)
  ↓
Step 3: Set y = "world"
  ↓
Step 4: Call concat(x, y)
  ↓
Results displayed in variables panel
```

**State Mutation:**
Each step can modify variable values. The execution continues until all steps complete or an error occurs.

## Component Breakdown

### RunnerDefiner (Main Component)

**State:**
```typescript
dragState: {
  dragIndex: number | null,      // Source step index
  dragOverIndex: number | null   // Hover target index
}
```

**Key Features:**
- Step creation buttons (Set/Call/Code)
- Run execution button
- Empty state message
- Drag-and-drop reordering
- Validation checks

**Validation:**
- All variables must have types assigned
- Set steps: Must have target variable and value
- Call steps: Must have target variable and function selected
- Code steps: Must have target variable
- Run button disabled until all steps valid

### RunnerInput (Step Row Component)

**Props:**
```typescript
{
  runner: Runner,              // Step data
  runnerIndex: number,         // Position in sequence
  onDragStart: (index) => void,
  onDragOver: (e, index) => void,
  onDragEnd: () => void,
  onDrop: (index) => void,
  isDragging: boolean,
  isDragOver: boolean
}
```

**Internal State:**
- `value`: Local input value (Set mode)
- `args`: Function arguments (Call mode)
- `code`: JavaScript code (Code mode)
- `showArgSuggestions`: Variable suggestion dropdown visibility

**Debounced Updates:**
All Redux dispatches are debounced (300ms) to prevent excessive state updates during typing.

## Step Types Detail

### Set Variable Step

**UI Components:**
1. Variable selector dropdown
2. Equals sign (=) icon
3. Value input field
4. Type hint panel

**Type Hints:**
```typescript
{
  string: "Plain text — e.g. hello world",
  array: "Comma-separated — e.g. a, b, c",
  number: "A number — e.g. 42",
  boolean: "true or false",
  object: 'JSON — e.g. {"key":"value"}'
}
```

**Data Format:**
```typescript
{
  type: "set",
  target: [variableName, value],
  args: []
}
```

**Example:**
```
Variable: message
Value: "Hello, World!"
→ Sets message = "Hello, World!"
```

### Call Function Step

**UI Components:**
1. Variable selector (result target)
2. Arrow icon (←)
3. Function selector dropdown
4. Arguments input field
5. Variable suggestions panel

**Arguments:**
- Comma-separated variable names
- Click suggestions to auto-insert
- Variables must exist in state
- Passed to function in order

**Data Format:**
```typescript
{
  type: "call",
  target: [variableName, functionName],
  args: string[]  // Variable names
}
```

**Example:**
```
Variable: result
Function: uppercase
Args: message
→ result = uppercase(message)
```

**Variable Suggestions:**
Interactive chips showing all available variables with their types.
- Click to append to args input
- Shows type for clarity
- Hover effects for better UX

### Code Step

**UI Components:**
1. Variable selector (result target)
2. "← code result" label
3. Monaco CodeEditor
4. Token reference panel

**Code Execution:**
- JavaScript code runs in controlled environment
- Must `return` a value
- Full `@token` access
- Access to all variables by name

**Available Tokens:**
- `@this` / `@t`: Target variable's current value
- `@space` / `@s`: Space character
- `@comma` / `@c`: Comma character
- `@empty` / `@e`: Empty string
- All variables accessible by name

**Data Format:**
```typescript
{
  type: "code",
  target: [variableName, ""],
  args: [],
  code: string  // JavaScript code
}
```

**Example:**
```javascript
Variable: formatted
Code:
  const upper = message.toUpperCase();
  return `Result: ${upper}`;
→ formatted = "Result: HELLO, WORLD!"
```

**Editor Features:**
- Syntax highlighting
- Autocomplete (Cmd/Ctrl + Space)
- Variable name completion
- `@token` completion
- Line numbers
- Error detection

## Token System (Code Mode)

### Core Tokens
```typescript
[
  { token: "@this", desc: "target variable's current value" },
  { token: "@t", desc: "current value (short)" },
  { token: "@space", desc: 'space character " "' },
  { token: "@s", desc: "space (short)" },
  { token: "@comma", desc: 'comma character ","' },
  { token: "@c", desc: "comma (short)" },
  { token: "@empty", desc: 'empty string ""' },
  { token: "@e", desc: "empty (short)" }
]
```

### Variable Access
All variables in the editor state are accessible by their name directly in code.

**Example:**
```javascript
// If you have variables: message, count, items
return message + " x" + count + ": " + items.join(", ");
```

## Data Flow

### Redux Structure
```typescript
runner: Runner[] = [
  {
    id: string,              // UUID
    type: "set" | "call" | "code",
    target: [
      string,                // Variable name
      string                 // Value (set) or Function name (call) or "" (code)
    ],
    args: string[],          // Variable names for function args
    code?: string            // JavaScript code (code type only)
  }
]
```

### Update Flow
```
User Interaction
  ↓
Local State Update (setValue/setArgs/setCode)
  ↓
Debounce (300ms)
  ↓
Dispatch updateRunner
  ↓
Redux State Update
  ↓
Component Re-render
```

### Execution Flow (Run Button)
```
useRunner.run()
  ↓
Validate all steps
  ↓
For each step in order:
  ├─ Set: Assign value to variable
  ├─ Call: Execute function, assign result
  └─ Code: Run JavaScript, assign return value
  ↓
Update all variable values in Redux
  ↓
Display results
```

## Drag & Drop System

### Visual States
- **Dragging**: Reduced opacity (0.4), scaled down (0.95)
- **Drop Target**: Blue border (2px), blue background (bg-blue-50)
- **Normal**: Default border, white background

### Event Handling
```typescript
onDragStart(index)  → Store dragIndex
onDragOver(e, index) → Update dragOverIndex, prevent default
onDrop(index)       → Dispatch reorderRunnerSteps
onDragEnd()         → Clear drag state
```

### Reordering
Redux action `reorderRunnerSteps` handles array manipulation:
```typescript
{
  fromIndex: number,
  toIndex: number
}
```

## Validation System

### Pre-Run Checks

**All Variables Typed:**
```typescript
allTyped = variables.length > 0 && variables.every(v => v.type)
```
- Set and Code buttons disabled if false
- Prevents type-related runtime errors

**All Steps Complete:**
```typescript
runDisabled = !runner.length || !runner.every(r => {
  if (r.type === "code") return !!r.target[0];
  return r.target[0] && r.target[1];
})
```
- Run button disabled if any step incomplete
- Ensures no empty operations

**Function Availability:**
```typescript
callButtonDisabled = !functions.length
```
- Call Function button disabled if no functions defined

### Visual Feedback
- Disabled buttons have reduced opacity
- Tooltips explain why buttons are disabled
- Required fields highlighted when empty

## User Interaction Patterns

### Creating Steps
1. Click step type button (Set/Call/Code)
2. Redux creates step with UUID
3. Step row appears at bottom
4. User fills in required fields

### Configuring Steps
1. Select target variable (all types)
2. For Set: Enter value
3. For Call: Select function, add args
4. For Code: Write JavaScript

### Reordering Steps
1. Click and hold drag handle (grip icon)
2. Drag to new position
3. Visual feedback shows drop target
4. Release to reorder
5. Redux updates step order

### Executing
1. Complete all steps
2. Click "Run" button
3. useRunner hook executes steps sequentially
4. Results update in variables panel
5. Console logs execution trace

## Integration Points

### Redux Actions
- `createSetRunner()`: Add Set step
- `createCallRunner()`: Add Call step
- `createCodeRunner()`: Add Code step
- `removeRunner(runnerId)`: Delete step
- `updateRunner({ runnerId, runner })`: Update step properties
- `reorderRunnerSteps({ fromIndex, toIndex })`: Reorder steps

### External Dependencies
- `useRunner` hook: Execution logic
- `CodeEditor` component: Monaco integration
- `useDebounce` hook: Debounced updates
- `useAppSelector`: Redux state access
- `useAppDispatch`: Redux action dispatch

### Data Dependencies
- `variables`: Must have types for Set/Code
- `functions`: Must exist for Call
- `runner`: Sequence of steps to execute

## Performance Optimizations

### Memoization
```typescript
useMemo(() => {
  runnerType,
  runnerTarget,
  runnerArgs,
  selectedVar,
  funcList
}, [dependencies])
```

### Debouncing
All Redux updates debounced at 300ms to prevent:
- Excessive re-renders during typing
- State thrashing
- Performance degradation

### Conditional Rendering
- Empty state vs. step list
- Type hints only when relevant
- Suggestions only when focused

## Error Handling

### Execution Errors
Handled by `useRunner` hook:
- Function not found
- Variable not found
- Invalid arguments
- JavaScript errors in Code blocks
- Type mismatches

### User Input Validation
- Non-empty variable selection
- Non-empty function selection (Call)
- Valid JavaScript syntax (Code)
- Proper argument format (Call)

## Best Practices for Usage

1. **Type Variables First**: Always assign types before creating steps
2. **Logical Order**: Arrange steps in dependency order
3. **Test Incrementally**: Run after each step addition to verify
4. **Use Code Sparingly**: Prefer Set/Call for clarity, Code for complex logic
5. **Name Variables Clearly**: Makes function args easier to track
6. **Check Console**: Execution logs help debug issues
7. **Drag to Reorder**: Easy to experiment with step order
8. **Variable Suggestions**: Click chips rather than typing for accuracy

## Special Features

### Step Type Badges
Visual indicators with icons:
- Triangle (◀): Set Variable
- Square (■): Call Function
- Code (</> ): Code Block

### Empty State
Helpful message when no steps exist:
```
"No steps yet — add Set Variable or Call Function."
```

### Execution Button
- Disabled until all steps valid
- Tooltip explains requirements
- Icon + "Run" text
- Triggers useRunner.run()

### InstructionPanel
Collapsible help panel explaining:
- What runners do
- Three step types with icons
- Typing requirement

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter to select dropdowns
- Escape to close dropdowns

### Screen Reader Support
- Descriptive button titles
- ARIA labels where needed
- Semantic HTML structure

### Visual Clarity
- High contrast colors
- Clear icons with text labels
- Consistent spacing
- Hover states

## Advanced Usage

### Multi-Variable Operations
```
Step 1: Set x = "Hello"
Step 2: Set y = "World"
Step 3: Call concat(x, y)
→ Demonstrates variable coordination
```

### Function Chains
```
Step 1: Call process(input)
Step 2: Call transform(input)
Step 3: Call finalize(input)
→ Same variable processed multiple times
```

### Code Integration
```
Step 1: Set data = "a,b,c"
Step 2: Code:
  const arr = data.split(',');
  return arr.map(x => x.toUpperCase());
Step 3: Call join(data, " ")
→ Mix code and function calls
```

## Limitations

1. **No Conditionals**: Runner steps always execute all steps
2. **No Loops**: Each step runs once
3. **Linear Flow**: No branching or parallelization
4. **Single Return**: Code blocks must return single value
5. **No Step Arguments**: Can't pass step results directly (use variables)

## Future Enhancements (Potential)

- Conditional step execution
- Loop/repeat steps
- Parallel execution groups
- Step breakpoints/debugging
- Execution history/undo
- Export/import step sequences
- Step templates/presets
