# JS Playground — Design System & Architecture Documentation

> **Visual Logic Editor for the Modern Web**
>
> A sophisticated visual programming environment for designing state diagrams, managing contextual variables dynamically, and exporting robust JSON package footprints—all with a modern, accessible UI.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [State Management](#state-management)
4. [Feature Modules](#feature-modules)
5. [AI Integration](#ai-integration)
6. [Additional Components](#additional-components)
7. [Custom Hooks](#custom-hooks)
8. [Redux Middleware](#redux-middleware)
9. [Design System](#design-system)
10. [Components](#components)
11. [Technical Stack](#technical-stack)

---

## Project Overview

### Purpose

JS Playground is a **Turing-complete visual programming environment** that enables users to:

- Define variables with typed values (string, number, boolean, array, object)
- Create reusable functions with action pipelines
- Build execution flows (runners) with conditional logic and loops
- Execute code with async/await support and CDN library integration
- Visualize data flow with interactive D3.js charts
- Export/import project configurations as JSON
- Manage multiple packages within a single project

### Key Features

- **React-Powered**: Built entirely with React 19 and Redux Toolkit for blazing-fast rendering
- **Turing Complete**: Supports looping, conditionals, cross-function mutations, and async execution
- **Extensible**: Dynamic CDN package loading (d3, lodash, three.js, etc.)
- **Visual**: Interactive flow charts with drag-and-drop node positioning
- **Type-Safe**: UUID-based entity management with TypeScript throughout
- **Modern UI**: Rounded, minimal design system with Tailwind CSS 4 and Radix UI

---

## Architecture

### High-Level Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                  # Landing page (hero + feature highlights)
│   ├── editor/                   # Main editor workspace
│   │   └── page.tsx
│   ├── api/
│   │   └── chat/
│   │       ├── route.ts          # Ollama streaming endpoint
│   │       ├── gemini/
│   │       │   └── route.ts      # Google Gemini streaming endpoint
│   │       └── gemini-validate/
│   │           └── route.ts      # Gemini API key validation endpoint
│   ├── layout.tsx                # Root layout with Redux provider
│   └── globals.css               # Tailwind CSS 4 theme & tokens
├── components/                   # Reusable UI components
│   ├── AskAiOverlay.tsx          # AI assistant panel (chat/code modes)
│   ├── AutoSaveIndicator.tsx     # Auto-save status indicator
│   ├── CodeLintWarnings.tsx      # Real-time code quality warnings
│   ├── CustomAlertDialog.tsx     # Custom alert dialog wrapper
│   ├── ErrorBoundary.tsx         # Error boundary component
│   ├── KeyboardShortcutsDialog.tsx # Keyboard shortcuts help modal
│   ├── SearchDialog.tsx          # Global search / command palette
│   ├── StatusBar.tsx             # Bottom status bar
│   ├── TutorialHints.tsx         # In-app tutorial hint system
│   ├── VariableInspector.tsx     # Real-time variable monitoring panel
│   ├── code-editor.tsx           # CodeMirror 6 integration wrapper
│   └── ui/                       # shadcn/ui primitives
│       ├── alert.tsx, badge.tsx, button.tsx, card.tsx
│       ├── dialog.tsx, input.tsx, label.tsx, popover.tsx
│       ├── resizable.tsx, select.tsx, separator.tsx
│       ├── skeleton.tsx, switch.tsx, textarea.tsx, tooltip.tsx
├── features/                     # Feature-based modules
│   ├── variable-container/
│   ├── functions-container/
│   ├── function-definer/
│   ├── runner-definer/
│   ├── code-detail/
│   ├── code-sidebar/
│   ├── data-type-container/
│   ├── help-modal/
│   ├── import-export/
│   ├── log-container/
│   ├── project-sidebar/
│   └── renderer/
│       ├── index.tsx             # Main renderer component
│       └── prompt-dialog.tsx     # AI prompt dialog for rendering
├── state/                        # Redux Toolkit state management
│   ├── slices/
│   │   ├── editorSlice.ts
│   │   └── logSlice.ts
│   ├── middleware/
│   │   ├── persistence.ts        # LocalForage persistence middleware
│   │   └── undoRedo.ts           # Undo/redo middleware
│   ├── store.ts
│   ├── provider.tsx              # Redux provider component
│   ├── types.ts
│   └── hooks.ts
├── hooks/                        # Custom React hooks
│   ├── useRunner.ts              # Execution engine
│   ├── useAutoSave.ts            # Debounced auto-save
│   ├── useDebounce.ts            # Debounce utility
│   ├── useDialog.tsx             # Dialog state management
│   ├── useKeyboardShortcuts.ts   # Global keyboard event handling
│   ├── useSearch.ts              # Global search functionality
│   └── useUndoRedo.ts            # Undo/redo management
├── lib/                          # Utility functions
│   ├── ai-provider.ts            # AI settings & streaming (Ollama + Gemini)
│   ├── cdnSecurity.ts            # CDN URL validation
│   ├── codeFormatting.ts         # Code formatting utilities
│   ├── codeLinting.ts            # Code linting and quality checks
│   ├── demoPackages.ts           # Pre-built demo package templates
│   ├── executionSandbox.ts       # Code execution sandboxing
│   ├── function-utils.ts         # Function execution engine
│   ├── keyListener-utils.ts      # Keyboard event utilities
│   ├── ollama.ts                 # Ollama-specific settings
│   ├── persistence.ts            # LocalForage persistence layer
│   ├── projectValidation.ts      # Project validation & sanitization
│   ├── prompts.ts                # AI prompt builders
│   ├── rateLimiter.ts            # Rate limiting for API calls
│   ├── securityAudit.ts          # Security checking utilities
│   ├── validation.ts             # Data validation utilities
│   └── utils.ts                  # Class name merger (cn)
└── constants/                    # Type definitions and action templates
    ├── array.ts, boolean.ts, dataTypes.ts
    ├── number.ts, object.ts, string.ts
```

### Design Patterns

1. **Feature-Based Architecture**: Each major feature is self-contained in its own folder
2. **Redux Toolkit Slices**: Centralized state with immutable updates using Immer
3. **Custom Hooks**: Business logic extracted into reusable hooks (`useRunner`, `useSearch`, etc.)
4. **UUID-Based Identities**: All entities use UUIDs for uniqueness and state management
5. **Token System**: Variable references use `@token` syntax for dynamic resolution
6. **Deep Cloning**: Immutable state operations with structured cloning
7. **Async Execution**: AsyncFunction constructor for dynamic code execution
8. **CDN Injection**: Dynamic script loading with global namespace detection
9. **Middleware Pipeline**: Persistence and undo/redo via Redux middleware
10. **AI Provider Abstraction**: Unified streaming interface over Ollama and Gemini backends

### Data Flow

```
User Interaction → Component → Redux Action → Reducer → State Update → Re-render
                                                    ↓
                                            LocalForage Persistence (optional)
```

---

## State Management

### Redux Store Structure

```typescript
RootState {
  editor: EditorState {
    projectId: string
    projectName: string
    activePackageId: string
    dataTypes: string[]
    packages: Package[] {
      id: string
      name: string
      enabled: boolean
      variables: VariableInterface[]
      functions: FunctionInterface[]
      runner: Runner[]
      codeSnippets: CodeSnippetInterface[]
      cdnPackages: CdnPackage[]
    }
  }
  log: LogState {
    logs: LogEntry[]
  }
}
```

### Key Interfaces

**VariableInterface**
```typescript
{
  id: string        // UUID v4
  name: string      // User-defined variable name
  type: string      // "string" | "number" | "boolean" | "array" | "object"
  value: any        // Typed value
}
```

**FunctionInterface**
```typescript
{
  id: string
  name: string
  dataType: string              // Return type (inferred from last action)
  actions: FunctionActionInterface[]
}
```

**FunctionActionInterface**
```typescript
{
  id: string
  name: string                  // "temp" | "use" | "math" | "code" | "when" | "loop"
  dataType: string
  value: any
  codeName?: string            // User-defined name for code blocks
  subActions?: FunctionActionInterface[]  // Nested actions for conditionals/loops
  loopParams?: { start, end, step }       // Loop iteration parameters
}
```

**Runner**
```typescript
{
  id: string
  type: "set" | "call" | "code"
  target: [string, string]     // [variableName, functionName | value]
  args: any[]
  code?: string                // Raw JavaScript code for "code" type
}
```

### EditorSlice Actions

**Project & Package Management**
- `setProjectName`, `addPackage`, `removePackage`, `renamePackage`
- `setActivePackage`, `togglePackageEnabled`, `reorderPackages`
- `importProject`, `importPackage`, `resetState`

**Variable Management**
- `addVariable`, `removeVariable`, `updateVariable`, `updateVariableValue`
- `updateDataType`, `setVariables`

**Function Management**
- `addFunctionName`, `removeFunctionName`, `updateFunctionName`
- `addFunctionAction`, `updateFunctionAction`, `removeFunctionAction`
- `reorderFunctionActions`

**Conditional & Loop Actions**
- `addWhenSubAction`, `removeWhenSubAction`, `updateWhenSubAction`, `reorderWhenSubActions`
- `addLoopSubAction`, `removeLoopSubAction`, `updateLoopSubAction`, `updateLoopParams`

**Runner Management**
- `createSetRunner`, `createCallRunner`, `createCodeRunner`
- `updateRunner`, `removeRunner`, `reorderRunnerSteps`

**Code Snippets & CDN**
- `addCodeSnippet`, `updateCodeSnippet`, `removeCodeSnippet`
- `addCdnPackage`, `removeCdnPackage`, `toggleCdnPackage`, `updateCdnPackage`

---

## Feature Modules

### 1. Variable Container
**Location**: `src/features/variable-container/`

- Displays all variables in the active package
- Allows adding, removing, and renaming variables
- Shows variable types with color-coded badges
- Integrated with data type selection

### 2. Data Type Container
**Location**: `src/features/data-type-container/`

- Provides data type templates (string, number, boolean, array, object)
- Drag-and-drop or click to assign types to variables
- Color-coded type badges for visual clarity

### 3. Functions Container
**Location**: `src/features/functions-container/`

- Lists all functions in the active package
- Allows creating, renaming, and deleting functions
- Shows function return types (inferred from actions)
- Selection mechanism for editing in Function Definer

### 4. Function Definer
**Location**: `src/features/function-definer/`

- Multi-step action pipeline builder
- Supports action types: temp, use, math, code, when, loop
- Nested sub-actions for conditionals and loops
- Drag-and-drop reordering with visual feedback
- CodeMirror integration for JavaScript code blocks

### 5. Runner Definer
**Location**: `src/features/runner-definer/`

- Execution flow builder with three step types:
  - **Set**: Assign static values to variables
  - **Call**: Execute function and assign result
  - **Code**: Run inline JavaScript and assign result
- Drag-and-drop step reordering
- Visual step validation

### 6. Code Detail Panel
**Location**: `src/features/code-detail/`

**Five Tabs**:

1. **Code Preview**: Live generated JavaScript code view
2. **Objects**: Editable variable cards with inline type/value editing
3. **Flow Chart**: Interactive D3.js visualization with drag/zoom/pan
4. **Export Preview**: JSON export preview with syntax highlighting
5. **Log**: Execution logs with timestamps and context

### 7. Renderer Dialog
**Location**: `src/features/renderer/`

- Full-screen modal with render area and controls
- Package management (enable/disable, reorder)
- CDN package management (predefined + custom)
- Execution button with validation
- Prompt dialog for AI-assisted code generation
- Real-time DOM rendering with element ID access

### 8. Project Sidebar
**Location**: `src/features/project-sidebar/`

- Project name editing
- Package switcher
- Import/Export functionality
- AI settings integration (provider selection, API key, model)
- Help modal

### 9. Code Sidebar
**Location**: `src/features/code-sidebar/`

- Collapsible side panel displaying the generated JavaScript code
- Syntax-highlighted read-only view of the current package

### 10. Help Modal
**Location**: `src/features/help-modal/`

- In-editor help overlay with usage guidance
- Action type references and token syntax cheatsheet

### 11. Import / Export
**Location**: `src/features/import-export/`

- JSON-based project and package import/export dialogs
- Validates imported data before merging into state

### 12. Log Container
**Location**: `src/features/log-container/`

- Displays execution logs with timestamps, severity levels, and context
- Clear and filter controls

---

## Design System

### Design Principles

- **Rounded** — pill shapes (`rounded-full`) for interactive elements; soft containers (`rounded-xl`, `rounded-2xl`) for panels.
- **Minimal** — clean surfaces, subtle shadows, and small text sizes to reduce visual clutter.
- **Accessible** — focus-visible rings, aria attributes, keyboard navigation via Radix UI.
- **Consistent** — shared design tokens (OKLCH colors, radius scale) ensure visual coherence across all components.

## Design Tokens

Defined in `src/app/globals.css` using Tailwind CSS 4 inline theme with CSS custom properties.

### Radius Scale

| Token          | Value                        | Usage                     |
| -------------- | ---------------------------- | ------------------------- |
| `--radius`     | `0.75rem` (12px)             | Base radius               |
| `--radius-sm`  | `calc(--radius - 4px)` (8px) | Small elements            |
| `--radius-md`  | `calc(--radius - 2px)` (10px)| Medium elements           |
| `--radius-lg`  | `var(--radius)` (12px)       | Large elements            |
| `--radius-xl`  | `calc(--radius + 4px)` (16px)| Extra large elements      |
| `--radius-full`| `9999px`                     | Pill shapes               |

### Color Tokens (Light Mode)

| Token                    | Role                          |
| ------------------------ | ----------------------------- |
| `--background`           | Page background               |
| `--foreground`           | Default text color            |
| `--primary`              | Primary actions & accents     |
| `--primary-foreground`   | Text on primary backgrounds   |
| `--secondary`            | Secondary surfaces            |
| `--secondary-foreground` | Text on secondary surfaces    |
| `--muted`                | Muted backgrounds             |
| `--muted-foreground`     | Muted/placeholder text        |
| `--accent`               | Hover/active backgrounds      |
| `--accent-foreground`    | Text on accent backgrounds    |
| `--destructive`          | Danger/error actions          |
| `--border`               | Border color                  |
| `--input`                | Input border color            |
| `--ring`                 | Focus ring color              |

All colors use the OKLCH color space. Dark mode variants are defined under the `.dark` class.

---

## Components

### Button

**File:** `src/components/ui/button.tsx`

Pill-shaped button for triggering actions. Uses CVA for variant management.

**Props:**

| Prop      | Type                                                             | Default     |
| --------- | ---------------------------------------------------------------- | ----------- |
| `variant` | `"default"` \| `"destructive"` \| `"outline"` \| `"secondary"` \| `"ghost"` \| `"link"` | `"default"` |
| `size`    | `"default"` \| `"sm"` \| `"lg"` \| `"icon"`                    | `"default"` |
| `asChild` | `boolean`                                                        | `false`     |

**Variants:**

- `default` — Primary filled button with shadow.
- `destructive` — Red/danger button for destructive actions.
- `outline` — Bordered button with transparent background.
- `secondary` — Subtle filled button with secondary color.
- `ghost` — Transparent button that shows background on hover.
- `link` — Underlined text link style.

**Sizes:**

- `default` — `h-8`, standard padding.
- `sm` — `h-7`, compact padding.
- `lg` — `h-10`, larger padding and text.
- `icon` — `size-8`, square for icon-only buttons.

**Usage:**

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon"><IconTrash /></Button>
```

---

### Badge

**File:** `src/components/ui/badge.tsx`

Pill-shaped label for status indicators, tags, or counts.

**Props:**

| Prop      | Type                                                                        | Default     |
| --------- | --------------------------------------------------------------------------- | ----------- |
| `variant` | `"default"` \| `"secondary"` \| `"destructive"` \| `"outline"`            | `"default"` |
| `asChild` | `boolean`                                                                   | `false`     |

**Usage:**

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Active</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

---

### Input

**File:** `src/components/ui/input.tsx`

Pill-shaped single-line text input.

**Props:** All native `<input>` props.

**Features:**

- `h-8` height, `text-xs` font size.
- Focus ring on `focus-visible`, destructive ring on `aria-invalid`.
- File input variant styled inline.

**Usage:**

```tsx
import { Input } from "@/components/ui/input"

<Input type="text" placeholder="Search..." />
<Input type="email" aria-invalid={hasError} />
```

---

### Textarea

**File:** `src/components/ui/textarea.tsx`

Rounded multi-line text input with auto-grow support.

**Props:** All native `<textarea>` props.

**Features:**

- `rounded-xl` container shape, `min-h-[80px]` default minimum.
- `field-sizing-content` for auto-grow when browser supports it.
- Same focus/invalid styling as Input for consistency.

**Usage:**

```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Write your message..." />
<Textarea rows={6} className="min-h-[120px]" />
```

---

### Label

**File:** `src/components/ui/label.tsx`

Form label for associating text with inputs.

**Props:** All native `<label>` props.

**Features:**

- `text-sm font-medium` styling.
- Auto-mutes when paired with a disabled `peer` input.

**Usage:**

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" className="peer" />
</div>
```

---

### Select

**File:** `src/components/ui/select.tsx`

Dropdown select for choosing a single value from a list.

**Sub-components:** `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectValue`, `SelectSeparator`.

**SelectTrigger Props:**

| Prop   | Type                      | Default     |
| ------ | ------------------------- | ----------- |
| `size` | `"default"` \| `"sm"`    | `"default"` |

**Features:**

- `rounded-full` trigger, `rounded-xl` dropdown.
- Animated open/close (fade + zoom + directional slide).
- Checkmark indicator on selected item.
- Rendered in a portal to escape overflow clipping.

**Usage:**

```tsx
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

---

### Card

**File:** `src/components/ui/card.tsx`

Rounded container for grouping related content.

**Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

**Features:**

- `rounded-2xl` with border and subtle shadow.
- Flex column layout — sub-components stack vertically.
- `CardAction` can sit alongside the title in the header row.

**Usage:**

```tsx
import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent, CardFooter
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Project Settings</CardTitle>
    <CardDescription>Manage your project configuration.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* form fields */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

### Alert

**File:** `src/components/ui/alert.tsx`

Rounded container for contextual messages.

**Props:**

| Prop      | Type                                | Default     |
| --------- | ----------------------------------- | ----------- |
| `variant` | `"default"` \| `"destructive"`     | `"default"` |

**Sub-components:** `Alert`, `AlertTitle`, `AlertDescription`.

**Features:**

- `rounded-xl` container with grid layout.
- Auto-detects SVG icon children and shifts to a two-column layout.
- `role="alert"` for screen reader accessibility.

**Usage:**

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

<Alert>
  <InfoIcon />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>This is an informational alert.</AlertDescription>
</Alert>
```

---

### Dialog

**File:** `src/components/ui/dialog.tsx`

Modal overlay for focused user interaction.

**Sub-components:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`.

**DialogContent Props:**

| Prop              | Type      | Default |
| ----------------- | --------- | ------- |
| `showCloseButton` | `boolean` | `true`  |

**DialogFooter Props:**

| Prop              | Type      | Default |
| ----------------- | --------- | ------- |
| `showCloseButton` | `boolean` | `false` |

**Features:**

- `rounded-2xl` dialog container with backdrop overlay.
- Animated open/close (fade + zoom).
- Focus trap and ESC-to-close (Radix built-in).
- Optional close button in header and/or footer.

**Usage:**

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Make changes to your profile.</DialogDescription>
    </DialogHeader>
    {/* form */}
  </DialogContent>
</Dialog>
```

---

### Popover

**File:** `src/components/ui/popover.tsx`

Floating content panel anchored to a trigger.

**Sub-components:** `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`.

**PopoverContent Props:**

| Prop         | Type                             | Default    |
| ------------ | -------------------------------- | ---------- |
| `align`      | `"start"` \| `"center"` \| `"end"` | `"center"` |
| `sideOffset` | `number`                         | `4`        |

**Features:**

- `rounded-xl` floating panel with shadow.
- Animated open/close with directional slide.
- Click-outside and ESC to dismiss.
- Portal-rendered to escape overflow clipping.

**Usage:**

```tsx
import {
  Popover, PopoverTrigger, PopoverContent
} from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Settings</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Popover content goes here.</p>
  </PopoverContent>
</Popover>
```

---

### Tooltip

**File:** `src/components/ui/tooltip.tsx`

Floating hint on hover/focus.

**Sub-components:** `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.

**Features:**

- `rounded-lg` compact label with primary background.
- Instant show (0ms delay by default); configurable via `TooltipProvider`.
- Animated with fade + zoom + directional slide.
- Auto-wraps in its own `TooltipProvider` for convenience.

**Usage:**

```tsx
import {
  Tooltip, TooltipTrigger, TooltipContent
} from "@/components/ui/tooltip"

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon"><IconHelp /></Button>
  </TooltipTrigger>
  <TooltipContent>Helpful tip here</TooltipContent>
</Tooltip>
```

---

### Switch

**File:** `src/components/ui/switch.tsx`

Toggle switch for on/off states.

**Props:**

| Prop              | Type                          | Default |
| ----------------- | ----------------------------- | ------- |
| `checked`         | `boolean`                     | —       |
| `defaultChecked`  | `boolean`                     | `false` |
| `onCheckedChange` | `(checked: boolean) => void`  | —       |
| `disabled`        | `boolean`                     | —       |

**Features:**

- `rounded-full` pill track (36x20px) with sliding circular thumb (16x16px).
- Supports both controlled (`checked`) and uncontrolled (`defaultChecked`) usage.
- `role="switch"` with `aria-checked` for accessibility.
- Smooth slide transition on state change.

**Usage:**

```tsx
import { Switch } from "@/components/ui/switch"

// Controlled
<Switch checked={enabled} onCheckedChange={setEnabled} />

// Uncontrolled
<Switch defaultChecked />
```

---

### Separator

**File:** `src/components/ui/separator.tsx`

Visual divider between content sections.

**Props:**

| Prop          | Type                              | Default        |
| ------------- | --------------------------------- | -------------- |
| `orientation` | `"horizontal"` \| `"vertical"`   | `"horizontal"` |
| `decorative`  | `boolean`                         | `true`         |

**Features:**

- 1px line using `border` color token.
- Horizontal (full width) or vertical (full height).
- `role="separator"` with `aria-orientation` for accessibility.
- `decorative` mode hides from screen readers.

**Usage:**

```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
<Separator orientation="vertical" className="h-6" />
```

---

### Skeleton

**File:** `src/components/ui/skeleton.tsx`

Loading placeholder with pulse animation.

**Props:** All native `<div>` props.

**Features:**

- `rounded-xl` with `animate-pulse` on muted background.
- No fixed dimensions — sized via className.
- Stack multiple to mimic content layout.

**Usage:**

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Text placeholder
<Skeleton className="h-4 w-3/4" />

// Avatar placeholder
<Skeleton className="size-10 rounded-full" />

// Card placeholder
<div className="flex flex-col gap-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

## Rounding Reference

| Component      | Border Radius   | Shape         |
| -------------- | --------------- | ------------- |
| Button         | `rounded-full`  | Pill          |
| Badge          | `rounded-full`  | Pill          |
| Input          | `rounded-full`  | Pill          |
| Select Trigger | `rounded-full`  | Pill          |
| Switch         | `rounded-full`  | Pill          |
| Textarea       | `rounded-xl`    | Soft rounded  |
| Card           | `rounded-2xl`   | Soft rounded  |
| Dialog         | `rounded-2xl`   | Soft rounded  |
| Alert          | `rounded-xl`    | Soft rounded  |
| Popover        | `rounded-xl`    | Soft rounded  |
| Select Content | `rounded-xl`    | Soft rounded  |
| Select Item    | `rounded-lg`    | Subtle round  |
| Tooltip        | `rounded-lg`    | Subtle round  |
| Skeleton       | `rounded-xl`    | Soft rounded  |

## Utility

### `cn()` — Class Name Merger

**File:** `src/lib/utils.ts`

Merges Tailwind classes using `clsx` + `tailwind-merge`. Use in all components to safely combine base styles with className overrides.

```tsx
import { cn } from "@/lib/utils"

cn("rounded-full bg-primary", isActive && "bg-accent", className)
```

---

## AI Integration

### AI Provider System

**File:** `src/lib/ai-provider.ts`

Central hub for managing AI providers and streaming chat. Supports two backends transparently behind a single `streamChat` API.

**Supported Providers:**

| Provider | Type            | Notes                                  |
| -------- | --------------- | -------------------------------------- |
| `ollama` | Local inference | Connects to a self-hosted Ollama server|
| `gemini` | Cloud (Google)  | Uses Google Generative AI SDK          |

**Key Exports:**

```typescript
type AiProvider = "ollama" | "gemini"

interface AiSettings {
  provider: AiProvider
  ollamaUrl: string
  ollamaModel: string
  geminiApiKey: string
  geminiModel: string
}

// Retrieve / persist settings in localStorage
getAiSettings(): AiSettings
saveAiSettings(settings: AiSettings): void

// Status helpers
isAiConfigured(): boolean
getActiveModelName(): string

// Available Gemini models
getGeminiModelList(): string[]  // ["gemini-2.5-pro", "gemini-2.5-flash", ...]

// Validation / discovery
fetchOllamaModels(url: string): Promise<string[]>
validateGeminiApiKey(apiKey: string, model: string): Promise<boolean>

// Streaming chat (routes to active provider)
streamChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  systemPrompt?: string
): Promise<void>
```

**Routing logic:** `streamChat` posts to `/api/chat` for Ollama and `/api/chat/gemini` for Gemini. The app server routes handle the provider-specific SDKs and return Server-Sent Event streams.

---

### Prompt Builders

**File:** `src/lib/prompts.ts`

Constructs structured system prompts and user messages that give the AI full context about the running project.

| Function                    | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `buildProjectContextBlock()` | Serialises the current editor state for the AI |
| `buildExecutionModelBlock()` | Embeds execution-model docs (token syntax, etc.)|
| `buildRendererPrompt()`      | System prompt for renderer / DOM generation     |
| `buildCodePrompt()`          | System prompt for function code generation      |
| `buildAskPrompt()`           | System prompt for general Q&A mode              |

---

### AI Assistant Overlay

**File:** `src/components/AskAiOverlay.tsx`

Full-featured chat panel that lets users ask questions about their project or request code generation.

**Modes:**

| Mode   | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `ask`  | Q&A about the project — AI receives full project context         |
| `code` | Code generation — response can be copied or added to a function  |

**Features:**

- Settings panel: select provider, configure Ollama URL/model or Gemini API key/model
- Real-time model validation and availability check
- Streaming responses with markdown rendering (`react-markdown` + `remark-gfm`)
- "Copy" and "Add to Code" action buttons on generated code blocks
- Demo package quick-loader (D3 charts, Tic-Tac-Toe, Markdown renderer, etc.)
- Dispatches Redux actions to inject generated code directly into functions

---

### AI API Routes

| Route                       | Method | Description                              |
| --------------------------- | ------ | ---------------------------------------- |
| `/api/chat`                 | POST   | Ollama streaming chat (SSE)              |
| `/api/chat/gemini`          | POST   | Gemini streaming chat via `@google/genai`|
| `/api/chat/gemini-validate` | POST   | Validate a Gemini API key (returns 200/401 + rate-limit aware)|

---

### Demo Packages

**File:** `src/lib/demoPackages.ts`

Pre-built project templates that can be loaded via the AI Overlay or Import dialog:

- D3 Bar Chart
- D3 Pie Chart
- D3 Line Chart
- Markdown Renderer
- Tic-Tac-Toe Game
- Interactive Form
- Data Table

---

## Additional Components

### AskAiOverlay

See [AI Integration → AI Assistant Overlay](#ai-assistant-overlay) above.

---

### VariableInspector

**File:** `src/components/VariableInspector.tsx`

Real-time monitoring panel for variables in the active package.

**Features:**

- Live value display refreshed on every state change
- Search/filter by variable name
- Type color-coded badges (matching the data-type palette)
- Expandable rows for `array` and `object` values showing nested structure

---

### SearchDialog

**File:** `src/components/SearchDialog.tsx`

Global command palette / search overlay.

**Features:**

- Opens with `Cmd/Ctrl+K` (via `useKeyboardShortcuts`)
- Searches across variables, functions, runner steps, and code snippets
- Keyboard-navigable results list
- Jump-to-item action on selection

---

### KeyboardShortcutsDialog

**File:** `src/components/KeyboardShortcutsDialog.tsx`

Help modal listing all registered keyboard shortcuts. Triggered from the toolbar or via `?`.

---

### TutorialHints

**File:** `src/components/TutorialHints.tsx`

Context-aware in-app tutorial hints that surface when the editor detects a user is new to a particular panel. Dismissible per-hint.

---

### CodeLintWarnings

**File:** `src/components/CodeLintWarnings.tsx`

Inline banner that surfaces code quality issues detected by `src/lib/codeLinting.ts`. Warnings update in real time as the user edits code blocks.

---

### AutoSaveIndicator

**File:** `src/components/AutoSaveIndicator.tsx`

Small status indicator (typically in the `StatusBar`) showing the current auto-save state: idle, saving, or saved. Driven by `useAutoSave`.

---

### StatusBar

**File:** `src/components/StatusBar.tsx`

Persistent bottom bar displaying contextual status information: active package name, auto-save state, and quick-action icons.

---

### code-editor

**File:** `src/components/code-editor.tsx`

Reusable CodeMirror 6 wrapper used by `function-definer` and `code-detail`.

**Features:**

- JavaScript syntax highlighting and autocomplete
- Controlled value with `onChange` callback
- Themed to match the app's dark/light design tokens

---

## Custom Hooks

| Hook                     | File                              | Purpose                                               |
| ------------------------ | --------------------------------- | ----------------------------------------------------- |
| `useRunner`              | `hooks/useRunner.ts`              | Full execution engine for running package pipelines   |
| `useAutoSave`            | `hooks/useAutoSave.ts`            | Debounced LocalForage persistence triggered by state  |
| `useDebounce`            | `hooks/useDebounce.ts`            | Generic debounce for values or callbacks              |
| `useDialog`              | `hooks/useDialog.tsx`             | Open/close + data state for modal dialogs             |
| `useKeyboardShortcuts`   | `hooks/useKeyboardShortcuts.ts`   | Register global `keydown` shortcuts with cleanup      |
| `useSearch`              | `hooks/useSearch.ts`              | Fuzzy-search over editor entities for `SearchDialog`  |
| `useUndoRedo`            | `hooks/useUndoRedo.ts`            | Expose undo/redo actions backed by Redux middleware    |

---

## Redux Middleware

**Location:** `src/state/middleware/`

| Middleware         | File               | Purpose                                                   |
| ------------------ | ------------------ | --------------------------------------------------------- |
| `persistence`      | `persistence.ts`   | Serialises editor state to LocalForage after each action  |
| `undoRedo`         | `undoRedo.ts`      | Snapshot-based undo/redo stack for editor state           |

---

## Technical Stack

### Core Framework
- **Next.js 15.5.9**: App Router with Turbopack for fast development
- **React 19.1.0**: Latest React with enhanced performance
- **TypeScript 5**: Type-safe development

### State Management
- **Redux Toolkit 2.9.0**: Predictable state container with Immer
- **react-redux 9.2.0**: Official React bindings
- **localforage 1.10.0**: Async browser storage (IndexedDB/WebSQL/localStorage)

### UI Framework
- **Tailwind CSS 4**: Utility-first CSS with CSS variables
- **Radix UI**: Unstyled, accessible component primitives
- **class-variance-authority 0.7.1**: CVA for variant management
- **tailwind-merge 3.3.1**: Intelligent Tailwind class merging
- **Lucide React 0.544.0**: Icon library
- **@tabler/icons-react 3.34.1**: Additional icon set

### Code Editor
- **CodeMirror 6**: Modern code editor with JavaScript language support
- **@codemirror/lang-javascript 6.2.5**: JavaScript syntax highlighting
- **@codemirror/autocomplete 6.20.1**: Intelligent code completion

### Visualization
- **D3.js 7.9.0**: Data-driven visualizations and flow charts
- **react-resizable-panels 3.0.5**: Resizable panel layouts
- **react-markdown 10.1.0**: Markdown rendering for AI chat responses
- **remark-gfm 4.0.1**: GitHub-flavored markdown plugin

### AI
- **@google/genai 1.47.0**: Google Generative AI SDK (Gemini models)

### Utilities
- **mathjs 14.7.0**: Mathematical expression evaluation
- **uuid 13.0.0**: UUID v4 generation for entity identification
- **clsx 2.1.1**: Conditional class name utility
- **prettier 3.8.1**: Code formatting for generated code blocks

### Development Tools
- **@tailwindcss/postcss**: Tailwind CSS 4 PostCSS plugin
- **tw-animate-css 1.3.8**: Animation utilities

---

## Execution Engine

### Token System

The application uses a token-based variable reference system:

**Special Tokens**:
- `@this` / `@t`: Current value being processed
- `@space` / `@s`: Space character
- `@comma` / `@c`: Comma character
- `@empty` / `@e`: Empty string

**Dynamic Tokens**:
- `@arg1`, `@arg2`, ...: Function arguments (1-indexed)
- `@temp1`, `@temp2`, ...: Temporary variables from "temp" actions
- `@math1`, `@math2`, ...: Results from "math" actions
- `@pick(1)`, `@pick(2)`, ...: Step results (1-indexed)

**Property Access**:
- `@this.length`: Access properties on tokens
- `@arg1.name.first`: Nested property access

### Function Execution Flow

1. **Token Resolution**: Replace `@token` references with actual values
2. **Action Pipeline**: Execute actions sequentially (temp → use → math → code → when → loop)
3. **CDN Injection**: Load CDN libraries and inject into execution context
4. **Async Execution**: Use AsyncFunction constructor for code blocks
5. **Result Assignment**: Update variable values with results

### CDN Package Loading

```typescript
// Sanitize CDN names to valid JS identifiers
const sanitizeCdnName = (name: string) => 
  name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^[0-9]/, "_$&");

// Load scripts dynamically
const script = document.createElement("script");
script.src = cdnUrl;
script.onload = () => resolve();
document.head.appendChild(script);

// Access via window object
const d3 = window.d3;
```

### Code Block Execution

```typescript
// Transform @token syntax to __ctx__ access
code = code.replace(/@(\w+(?:\.\w+)*)/g, (_match, token) => {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return `__ctx__["${token}"]`;
  const base = token.slice(0, dotIndex);
  const rest = token.slice(dotIndex);
  return `__ctx__["${base}"]${rest}`;
});

// Create async function with context
const fn = new AsyncFunction(
  "__ctx__",      // Token context
  ...cdnParamNames,  // CDN libraries (d3, lodash, etc.)
  ...safeVarNames,   // Safe variable names
  code            // Transformed code
);

// Execute with values
const result = await fn(tokenCtx, ...cdnParamValues, ...safeVarValues);
```

---

## Security Considerations

### Code Execution
- Uses `AsyncFunction` constructor (similar to `eval`) for dynamic execution
- **Client-side only**: All code runs in the user's browser
- No server-side execution or API endpoints
- Users must trust their own code and imported packages

### CDN Loading
- Scripts loaded from user-specified URLs (jsDelivr, unpkg, etc.)
- Global namespace pollution possible
- Users should verify CDN sources

### Data Persistence
- LocalForage for browser-based storage
- No cloud sync or server storage
- Export/import via JSON for backup

---

## Performance Optimizations

1. **Deep Cloning**: Structured clone for immutable state operations
2. **UUID Indexing**: Fast lookups using UUID-based maps
3. **Lazy Loading**: D3.js loaded dynamically only when needed
4. **Memoization**: React hooks with proper dependency arrays
5. **Virtual Scrolling**: Considered for large lists (not yet implemented)
6. **Code Splitting**: Next.js automatic code splitting by route

---

## Accessibility

- **Keyboard Navigation**: Full keyboard support via Radix UI
- **ARIA Attributes**: Proper roles, labels, and descriptions
- **Focus Management**: Focus rings on all interactive elements
- **Screen Readers**: Semantic HTML and ARIA for assistive tech
- **Color Contrast**: WCAG AA compliant color combinations

---

## Browser Compatibility

**Minimum Requirements**:
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ support (AsyncFunction, optional chaining, nullish coalescing)
- IndexedDB support for persistence
- CSS Grid and Flexbox

**Tested On**:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

---

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing file structure patterns
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused

### State Management
- All state mutations through Redux actions
- Use UUID for entity identification
- Deep clone when mutating complex objects
- Add JSDoc comments for complex logic

### Component Guidelines
- Use shadcn/ui components when possible
- Extract reusable logic into custom hooks
- Keep inline styles minimal (prefer Tailwind)
- Add loading and error states
- Test with various data scenarios

---
