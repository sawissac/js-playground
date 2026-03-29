# JS Playground — Feature Specification & Code Standards

> **Authoritative guide for building new features consistently.**
> Every new file, hook, slice, or component must follow the conventions in this document.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Directory Conventions](#directory-conventions)
3. [Next.js App Router Rules](#nextjs-app-router-rules)
4. [TypeScript Standards](#typescript-standards)
5. [Component Patterns](#component-patterns)
6. [State Management](#state-management)
7. [Custom Hooks](#custom-hooks)
8. [Styling & UI](#styling--ui)
9. [API Routes](#api-routes)
10. [AI Features](#ai-features)
11. [Security & Validation](#security--validation)
12. [Performance](#performance)
13. [Adding a New Feature — Checklist](#adding-a-new-feature--checklist)

---

## Core Principles

1. **Explicit over implicit** — Avoid magic. Clearly type payloads, name actions, and export interfaces.
2. **Feature isolation** — A feature folder owns its own UI. It may read global state but must not mutate another feature's local state.
3. **One source of truth** — All persistent application state lives in Redux (`editorSlice`, `logSlice`). UI-only transient state (open/closed, hover) stays in component `useState`.
4. **No premature abstraction** — Do not create shared helpers for code that is only used once. Extract only when three or more call-sites share the same logic.
5. **Client-first, server-aware** — This is a client-heavy SPA. Mark components `"use client"` when they use hooks or browser APIs. Keep server components only in `app/layout.tsx`, `app/page.tsx`, and API routes.

---

## Directory Conventions

```
src/
├── app/                  # Next.js App Router — pages and API routes ONLY
│   ├── layout.tsx        # Server component — root layout + providers
│   ├── page.tsx          # Server component — landing page (static)
│   ├── editor/
│   │   └── page.tsx      # Client component — main workspace
│   └── api/
│       └── <resource>/
│           └── route.ts  # Route Handler — one file per endpoint group
│
├── features/             # Each major UI panel is one folder
│   └── <feature-name>/
│       ├── index.tsx     # Default export — the feature component
│       └── *.tsx         # Private sub-components (not exported)
│
├── components/           # Cross-feature, reusable components
│   └── ui/               # shadcn/ui primitives — edit only via shadcn CLI or carefully by hand
│
├── state/                # Redux store — one folder, no nesting beyond slices/
│   ├── store.ts
│   ├── provider.tsx
│   ├── hooks.ts
│   ├── types.ts
│   ├── slices/
│   └── middleware/
│
├── hooks/                # Custom React hooks — one hook per file
├── lib/                  # Pure utility modules — no React, no Redux imports
└── constants/            # Static data and type-template definitions
```

**Rules:**

- `app/` contains **only** pages (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) and API routes (`route.ts`). No components.
- `features/` sub-components that are private to a feature are **never** imported outside that folder.
- `lib/` modules must be pure TypeScript with **no React** imports. If you need React, it belongs in `hooks/` or `components/`.
- Never create `index.ts` barrel files in `lib/` or `hooks/` — import the exact file path.

---

## Next.js App Router Rules

### Server vs. Client Components

| Scenario | Directive |
|---|---|
| Uses `useState`, `useEffect`, `useRef`, or any hook | `"use client"` |
| Uses browser APIs (`window`, `localStorage`, `document`) | `"use client"` |
| Uses Redux hooks (`useAppSelector`, `useAppDispatch`) | `"use client"` |
| Static markup / server data fetch | No directive (server by default) |
| Root layout, provider wrappers | `"use client"` if wrapping Redux `Provider` |

The `"use client"` directive goes at the very top of the file, before all imports:

```tsx
"use client";

import { useState } from "react";
```

### Page Components

Pages in `app/` are thin — they compose features, not implement them:

```tsx
// app/editor/page.tsx
"use client";

import VariableContainer from "@/features/variable-container";
import FunctionDefiner from "@/features/function-definer";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function EditorPage() {
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-[100dvh]">
      <ResizablePanel defaultSize={20} minSize={16} maxSize={30}>
        <VariableContainer />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <FunctionDefiner />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### Route Handlers (API Routes)

- One `route.ts` file per logical endpoint group under `app/api/<resource>/`
- Always return a typed `Response` or `NextResponse`
- Use `Request` from the Web API, not Express-style `req/res`
- Stream responses with `ReadableStream` for AI endpoints
- Handle errors explicitly; never let unhandled promise rejections surface

```ts
// app/api/chat/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    // ...
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Metadata

Static pages in `app/` must export a `metadata` object:

```ts
// app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JS Playground",
  description: "Visual logic editor for the modern web",
};
```

### `next.config.ts`

- Use `ts` extension (not `js`) — already established in the project
- Avoid `ignoreBuildErrors: true` or `ignoreDuringBuilds: true` — fix the errors instead
- External packages that must run only on the server go in `serverExternalPackages`

---

## TypeScript Standards

### Interfaces vs. Types

- Use `interface` for all data-shape definitions (entities, props, state slices)
- Use `type` for unions, intersections, and utility aliases

```ts
// Correct
interface VariableInterface {
  id: string;
  name: string;
  type: string;
  value: unknown;
}

type AiProvider = "ollama" | "gemini";
```

### Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase` | `VariableContainer` |
| Interface | `PascalCase` + `Interface` suffix | `VariableInterface` |
| Hook | `camelCase` prefixed `use` | `useKeyboardShortcuts` |
| Utility function | `camelCase` | `buildCodePrompt` |
| Redux action creator | `camelCase` | `addVariable` |
| Constant | `SCREAMING_SNAKE_CASE` | `CODE_EXECUTION_TIMEOUT` |
| File (feature) | `kebab-case/index.tsx` | `variable-container/index.tsx` |
| File (hook) | `usePascalCase.ts` | `useKeyboardShortcuts.ts` |
| File (lib) | `camelCase.ts` | `aiProvider.ts` → `ai-provider.ts` |

### Centralize Shared Types

All entity interfaces that are consumed by more than one feature live in `src/state/types.ts`. Do not duplicate them in feature files.

```ts
// ✅ Correct — import from canonical location
import type { VariableInterface } from "@/state/types";

// ❌ Wrong — redefining locally
interface Variable { id: string; ... }
```

### `unknown` over `any`

Use `unknown` for values whose shape is not yet checked. Cast to a concrete type after a type guard.

```ts
// ❌
value: any

// ✅
value: unknown
// then narrow:
if (typeof value === "string") { ... }
```

Exceptions: `action.payload` in Redux reducers may use `any` only when the Immer draft requires it. Keep these occurrences minimal.

### Non-null Assertion

The `!` operator is acceptable when the value is guaranteed by Redux state invariants (e.g., `activePackage` always exists when the editor is mounted). Document why:

```ts
// Active package is always present — enforced by setActivePackage reducer
const pkg = packages.find((p) => p.id === activePackageId)!;
```

---

## Component Patterns

### Feature Component Template

```tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { someAction } from "@/state/slices/editorSlice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MyFeature() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) =>
    s.editor.packages.find((p) => p.id === s.editor.activePackageId)?.variables ?? []
  );

  function handleAdd() {
    dispatch(someAction({ id: crypto.randomUUID() }));
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="text-xs">{item.name}</span>
        </div>
      ))}
      <Button size="sm" onClick={handleAdd}>Add</Button>
    </div>
  );
}
```

### Private Sub-components

Internal sub-components are declared in the same folder (not `components/`) and never exported:

```
features/
  my-feature/
    index.tsx          ← public export
    ItemCard.tsx       ← private sub-component, imported only by index.tsx
    useMyFeature.ts    ← private hook scoped to this feature
```

### Shadcn/UI Primitives

Use components from `src/components/ui/` for all standard controls (Button, Input, Select, Dialog, etc.). Only modify files in `src/components/ui/` when extending props — never restyle them at the call-site by targeting internal elements.

```tsx
// ✅ Use the size/variant prop system
<Button variant="ghost" size="icon">
  <IconTrash size={16} />
</Button>

// ❌ Don't override internals with arbitrary Tailwind
<Button className="!h-5 !rounded-none">...</Button>
```

### Error Boundaries

Wrap every feature in an `ErrorBoundary` at the page level so one broken panel cannot crash the editor:

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary fallback={<div className="p-4 text-xs text-destructive">Panel error</div>}>
  <VariableContainer />
</ErrorBoundary>
```

### Prop Interface

Always define props as a local `interface` at the top of the file:

```tsx
interface MyComponentProps {
  label: string;
  onConfirm: () => void;
  className?: string;
}

export function MyComponent({ label, onConfirm, className }: MyComponentProps) { ... }
```

### Dialog / Overlay Pattern

Dialogs are controlled from the parent via `open` + `onOpenChange`:

```tsx
// Parent
const [open, setOpen] = useState(false);
<MyDialog open={open} onOpenChange={setOpen} />

// Dialog component
interface MyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Render Lists

Always provide stable `key` — use the entity's UUID, never the array index:

```tsx
// ✅
{variables.map((v) => <VariableRow key={v.id} variable={v} />)}

// ❌
{variables.map((v, i) => <VariableRow key={i} variable={v} />)}
```

---

## State Management

### Slice Structure

```ts
// state/slices/exampleSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExampleState {
  items: string[];
}

const initialState: ExampleState = {
  items: [],
};

const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<string>) {
      state.items.push(action.payload);           // Immer — direct mutation is safe
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i !== action.payload);
    },
  },
});

export const { addItem, removeItem } = exampleSlice.actions;
export default exampleSlice.reducer;
```

### Selectors

Inline selectors are fine for simple access. Extract to a named selector only when the same derived value is used in three or more components:

```ts
// Inline — fine
const pkgName = useAppSelector((s) =>
  s.editor.packages.find((p) => p.id === s.editor.activePackageId)?.name
);

// Extracted selector — use when shared
export const selectActivePackage = (s: RootState) =>
  s.editor.packages.find((p) => p.id === s.editor.activePackageId);
```

### When to Use Redux vs. `useState`

| Data | Where to store |
|---|---|
| Variables, functions, runner steps, CDN packages | Redux (`editorSlice`) |
| Execution logs | Redux (`logSlice`) |
| Dialog open/closed | `useState` in the component that renders the dialog |
| Input draft text before commit | `useState` |
| Search query string | `useState` |
| AI chat message history | `useState` (ephemeral, not persisted) |
| Active tab / selected panel | `useState` |

### Dispatching Actions

Always dispatch from the component or hook that owns the interaction. Never dispatch inside a Redux reducer or middleware unexpectedly.

```tsx
const dispatch = useAppDispatch();

function handleRename(newName: string) {
  if (!newName.trim()) return;
  dispatch(renamePkg({ id: pkg.id, name: newName.trim() }));
}
```

### Undo/Redo

Actions that should be undoable must pass through `undoRedoMiddleware`. No additional annotation is needed — the middleware snapshots state on every dispatch of a whitelisted action. Add new undoable actions to the whitelist in `src/state/middleware/undoRedo.ts`.

---

## Custom Hooks

### Hook File Template

```ts
// hooks/useMyHook.ts
import { useCallback, useEffect, useState } from "react";

export interface MyHookOptions {
  initialValue: string;
  onChange?: (value: string) => void;
}

export interface MyHookReturn {
  value: string;
  setValue: (v: string) => void;
  reset: () => void;
}

export function useMyHook({ initialValue, onChange }: MyHookOptions): MyHookReturn {
  const [value, setValue] = useState(initialValue);

  const handleSet = useCallback((v: string) => {
    setValue(v);
    onChange?.(v);
  }, [onChange]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return { value, setValue: handleSet, reset };
}
```

### Rules

- Export the options interface and return interface alongside the hook — callers should not need to guess types.
- Use `useCallback` for all functions returned from hooks to prevent referential instability at call-sites.
- Clean up side effects (`addEventListener`, timers, subscriptions) in the `useEffect` return function.
- Hooks that access Redux state should use `useAppSelector` / `useAppDispatch` — never raw `useSelector`.

### Keyboard Shortcuts Hook

Register shortcuts via `useKeyboardShortcuts`. Do not add raw `window.addEventListener("keydown")` calls in components:

```ts
useKeyboardShortcuts({
  shortcuts: [
    {
      key: "k",
      ctrl: true,
      description: "Open search",
      handler: () => setSearchOpen(true),
    },
  ],
});
```

---

## Styling & UI

### Tailwind Usage

- Utility classes only — no custom CSS outside `globals.css` design tokens.
- All dynamic class merging via `cn()` from `src/lib/utils.ts`:

```tsx
<div className={cn("flex items-center gap-2", isActive && "bg-accent", className)}>
```

- Responsive prefixes: `sm:`, `md:`, `lg:` for breakpoint-specific layout.
- Interactive states: `hover:`, `focus-visible:`, `disabled:` pseudo-classes.
- Never use `!important` overrides (no `!`-prefixed Tailwind classes) — fix the specificity conflict instead.

### Design Token Usage

All colors must come from design tokens defined in `globals.css`. Never use hardcoded Tailwind color names (e.g., `bg-blue-500`):

```tsx
// ✅ Token-based
<div className="bg-primary text-primary-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="border-border" />

// ❌ Hardcoded color
<div className="bg-blue-500 text-white" />
```

### Typography Scale

| Use case | Class |
|---|---|
| Panel/section heading | `text-sm font-semibold` |
| Label | `text-xs font-medium` |
| Body / list item | `text-xs` |
| Muted/caption | `text-xs text-muted-foreground` |
| Code inline | `font-mono text-xs` |

### Spacing

Use Tailwind spacing utilities consistently. Prefer `gap-*` in flex/grid containers over individual `margin` utilities on children.

```tsx
// ✅ Gap-based spacing
<div className="flex flex-col gap-2">
  <ItemA />
  <ItemB />
</div>

// ❌ Per-child margin
<div className="flex flex-col">
  <ItemA className="mb-2" />
  <ItemB />
</div>
```

### Icon Usage

- Primary icon library: `@tabler/icons-react` — named import, `size={16}` default
- Secondary library: `lucide-react` — used only where Tabler has no equivalent
- Do not mix libraries within the same component

```tsx
import { IconVariable, IconFunction } from "@tabler/icons-react";
<IconVariable size={16} />
```

### Dark Mode

All color classes use CSS variables — dark mode is automatic via the `.dark` class on `<html>`. Do not add `dark:` manual overrides for colors defined in the token system.

---

## API Routes

### Route Handler Template

```ts
// app/api/<resource>/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate body shape before use
  if (!isValidBody(body)) {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // ... handler logic
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/<resource>]", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Streaming Responses (AI)

Return a `ReadableStream` for endpoints that stream tokens:

```ts
const stream = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of aiStream) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    } catch (err) {
      controller.error(err);
    }
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

### No Business Logic in Route Handlers

Route handlers validate input and delegate to `lib/` utilities. Never put execution logic, prompt building, or AI settings inside `route.ts`.

```ts
// ✅ Delegate to lib/
import { buildCodePrompt } from "@/lib/prompts";
const systemPrompt = buildCodePrompt(context);

// ❌ Inline logic
const systemPrompt = `You are a... ${context.variables.map(...).join(",")} ...`;
```

---

## AI Features

### Adding a New AI Mode

1. Add a new `buildXxxPrompt()` function in `src/lib/prompts.ts`
2. Pass it as `systemPrompt` to `streamChat()` from `src/lib/ai-provider.ts`
3. If a new API endpoint is needed, create `app/api/chat/<mode>/route.ts` following the streaming template above
4. Wire the mode into `AskAiOverlay.tsx` or create a dedicated overlay component

### AI Settings Access

Never read `localStorage` directly for AI settings. Use the canonical helpers:

```ts
import { getAiSettings, saveAiSettings, isAiConfigured } from "@/lib/ai-provider";

const settings = getAiSettings();      // Safe SSR guard included
if (!isAiConfigured()) return;         // Check before streaming
```

### Streaming in Components

Always handle all three callbacks from `streamChat`:

```ts
await streamChat(
  messages,
  (chunk) => setResponse((prev) => prev + chunk),   // onChunk
  () => setLoading(false),                           // onDone
  (err) => {                                         // onError
    console.error(err);
    setLoading(false);
  },
  systemPrompt
);
```

### Rate Limiting

All AI invocations in components must check `canExecuteCode()` / `recordCodeExecution()` from `src/lib/rateLimiter.ts` before calling `streamChat`. This prevents runaway API costs.

---

## Security & Validation

### CDN URLs

Never inject a CDN URL into a `<script>` tag without validating it first:

```ts
import { validateCDNUrl } from "@/lib/cdnSecurity";

const result = validateCDNUrl(userInputUrl);
if (!result.isValid) {
  dispatch(addLog({ type: "error", message: result.reason }));
  return;
}
```

### Dynamic Code Execution

All dynamic execution must go through `src/lib/executionSandbox.ts` — do not call `new Function()` or `eval()` directly in components or features.

### User Input Sanitization

Validate all external data (imports, user-typed variable names, CDN packages) using `src/lib/projectValidation.ts` before merging into Redux state:

```ts
import { validateProjectImport } from "@/lib/projectValidation";

const result = validateProjectImport(parsed);
if (!result.valid) {
  dispatch(addLog({ type: "error", message: result.error }));
  return;
}
dispatch(importProject(result.data));
```

### Code Quality Checks

When adding a code block action, run it through `src/lib/codeLinting.ts` and surface warnings via `<CodeLintWarnings />`.

---

## Performance

### Memoization

- Wrap expensive derived values in `useMemo`
- Wrap event handlers passed as props in `useCallback`
- Do not memoize primitives (strings, numbers) — only objects and functions

```ts
const activePackage = useMemo(
  () => packages.find((p) => p.id === activePackageId),
  [packages, activePackageId]
);

const handleSave = useCallback(() => {
  dispatch(updateVariable(draft));
}, [dispatch, draft]);
```

### Redux Selector Granularity

Select the smallest slice of state needed. Selecting the entire `editor` state causes re-renders on every unrelated action:

```ts
// ✅ Narrow selector
const variableCount = useAppSelector(
  (s) => s.editor.packages.find((p) => p.id === s.editor.activePackageId)?.variables.length ?? 0
);

// ❌ Over-broad selector
const editor = useAppSelector((s) => s.editor);
const variableCount = editor.packages.find(...)?.variables.length ?? 0;
```

### Dynamic Imports

Heavy libraries (D3, CodeMirror) are loaded dynamically. Follow the same pattern for any library > 50 KB:

```ts
const d3 = await import("d3");
```

For React components that are large and conditionally shown, use `next/dynamic`:

```tsx
import dynamic from "next/dynamic";
const HeavyChart = dynamic(() => import("@/features/code-detail/FlowChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});
```

### Viewport Height

Use `h-[100dvh]` (dynamic viewport height) instead of `h-screen` for full-height layouts to handle mobile browser chrome correctly.

---

## Adding a New Feature — Checklist

Use this checklist every time a new feature panel or major component is built.

### 1. Create the Feature Folder

```
src/features/<feature-name>/
  index.tsx        ← default export, client component
```

### 2. Define Types

If the feature introduces new entity shapes, add their interfaces to `src/state/types.ts`. Do not define them inline.

### 3. Extend the Redux Slice

Add new state fields and reducers to the relevant slice (`editorSlice.ts`). Export the new action creators. Update `src/state/types.ts` if the state shape changes.

### 4. Write the Component

Follow the [Feature Component Template](#feature-component-template). Use `useAppSelector` and `useAppDispatch` for state.

### 5. Wrap in Error Boundary

Add an `ErrorBoundary` wrapper in the parent page so errors are contained.

### 6. Register Keyboard Shortcuts (if applicable)

Add shortcuts via `useKeyboardShortcuts` — register them in the component that owns the interaction, not globally in `app/layout.tsx`.

### 7. Security Review

- If the feature accepts user text that will be executed → route through `executionSandbox`
- If the feature accepts URLs → validate with `validateCDNUrl`
- If the feature imports external data → validate with `projectValidation`

### 8. Update Documentation

Update `docs/DESIGN_SYSTEM.md` under **Feature Modules** with a description of the new panel, its location, and its capabilities.

---

## Quick Reference

```
New page                → app/<route>/page.tsx  (thin, compose features)
New feature panel       → features/<name>/index.tsx
New reusable component  → components/<Name>.tsx
New shadcn primitive    → components/ui/<name>.tsx
New hook                → hooks/use<Name>.ts
New utility             → lib/<name>.ts  (no React)
New Redux action        → state/slices/editorSlice.ts (or logSlice.ts)
New entity interface    → state/types.ts
New API endpoint        → app/api/<resource>/route.ts
New AI prompt builder   → lib/prompts.ts
```
