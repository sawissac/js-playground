# User Experience Features - Implementation Guide

> **Enhanced UX for JS Playground**
>
> Keyboard shortcuts, global search, and interactive tutorials to improve productivity and ease of use.

---

## 📋 Overview

Three major UX features have been implemented:

1. **Keyboard Shortcuts** - Comprehensive shortcut system for power users
2. **Search & Filter** - Global search across all project entities
3. **Tutorial System** - Interactive onboarding with contextual hints

---

## 1. Keyboard Shortcuts System

### What Was Implemented

**Hook**: `src/hooks/useKeyboardShortcuts.ts`
**Dialog**: `src/components/KeyboardShortcutsDialog.tsx`

**Features**:
- ✅ Platform-aware shortcuts (⌘ on Mac, Ctrl on Windows/Linux)
- ✅ Extensible shortcut system
- ✅ Categorized shortcuts dialog
- ✅ Conflict-free shortcut matching
- ✅ Prevent default browser behavior

### Available Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search dialog |
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Ctrl/Cmd + R` | Open renderer |
| `Ctrl/Cmd + [` | Toggle left panel |
| `Ctrl/Cmd + ]` | Toggle right panel |
| `Ctrl/Cmd + Z` | Undo (from undo/redo system) |
| `Ctrl/Cmd + Shift + Z` | Redo (from undo/redo system) |

### Usage

**In Components:**
```typescript
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const shortcuts = [
  {
    key: "k",
    ctrl: true,
    description: "Open search",
    handler: () => setSearchOpen(true),
  },
  {
    key: "s",
    ctrl: true,
    shift: true,
    description: "Save project",
    handler: handleSave,
  },
];

useKeyboardShortcuts({ shortcuts });
```

**Format Shortcuts for Display:**
```typescript
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";

const shortcut = { key: "k", ctrl: true };
const display = formatShortcut(shortcut);
// Returns: "⌘+K" on Mac, "Ctrl+K" on Windows/Linux
```

**Show Shortcuts Dialog:**
```typescript
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";

<KeyboardShortcutsDialog
  open={shortcutsOpen}
  onOpenChange={setShortcutsOpen}
  shortcuts={shortcuts}
/>
```

### Customization

Add new shortcuts in the editor page:

```typescript
// src/app/editor/page.tsx
const shortcuts = [
  // ... existing shortcuts
  {
    key: "n",
    ctrl: true,
    shift: true,
    description: "New package",
    handler: () => dispatch(addPackage({ name: "New Package" })),
  },
];
```

---

## 2. Search & Filter System

### What Was Implemented

**Hook**: `src/hooks/useSearch.ts`
**Dialog**: `src/components/SearchDialog.tsx`

**Features**:
- ✅ Search across variables, functions, and runners
- ✅ Filter by type (all/variable/function/runner)
- ✅ Scope filter (all packages/current package)
- ✅ Real-time search results
- ✅ Navigate to items (switches packages)
- ✅ Recent items list
- ✅ Keyboard navigation hints

### Search Capabilities

**What You Can Search:**
- Variable names
- Function names
- Runner steps
- Package names
- Item descriptions

**Filters Available:**
- **Type Filter**: All, Variables, Functions, Runners
- **Scope Filter**: All Packages, Current Package Only

### Usage

**useSearch Hook:**
```typescript
import { useSearch } from "@/hooks/useSearch";

const {
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  results,
  currentPackageResults,
  recentItems,
  totalCount,
} = useSearch();

// Set search query
setSearchQuery("myVar");

// Filter by type
setFilterType("variable");

// Get results
console.log(results); // All matching items
console.log(currentPackageResults); // Current package only
```

**Search Dialog:**
```typescript
import { SearchDialog } from "@/components/SearchDialog";

<SearchDialog 
  open={searchOpen} 
  onOpenChange={setSearchOpen} 
/>
```

**Quick Jump (Cmd/Ctrl+P style):**
```typescript
import { useQuickJump } from "@/hooks/useSearch";

const { isOpen, open, close, toggle, ...searchProps } = useQuickJump();

// Open with keyboard shortcut
useKeyboardShortcuts({
  shortcuts: [
    { key: "p", ctrl: true, handler: open },
  ],
});
```

### Search Result Format

```typescript
interface SearchResult {
  id: string;
  type: "variable" | "function" | "runner";
  packageId: string;
  packageName: string;
  name: string;
  value?: any;
  description?: string;
}
```

### User Experience

**Opening Search:**
1. Press `Ctrl/Cmd + K`
2. Start typing to search
3. Use filters to narrow results
4. Click result to navigate

**Search Flow:**
```
Type query → Filter by type → Choose scope → Click result → Navigate to item
```

---

## 3. Tutorial System

### What Was Implemented

**Component**: `src/components/TutorialHints.tsx`
**Hook**: `useTutorialHints`

**Features**:
- ✅ Interactive tutorial hints with actions
- ✅ Dismissible hints with persistence (localStorage)
- ✅ Progressive onboarding flow
- ✅ Action buttons in hints
- ✅ Auto-hide option
- ✅ Progress indicators for multi-step tutorials

### Creating Tutorial Hints

**Define Hints:**
```typescript
import { TutorialHint, useTutorialHints } from "@/components/TutorialHints";

const { dismissedHints, dismissHint } = useTutorialHints();

const tutorialHints: TutorialHint[] = [
  {
    id: "welcome",
    title: "👋 Welcome!",
    description: "Let's get started with the basics.",
    action: {
      label: "Get Started",
      onClick: () => {
        // Action logic
        dismissHint("welcome");
      },
    },
  },
  {
    id: "keyboard-shortcuts",
    title: "⌨️ Keyboard Shortcuts",
    description: "Press Ctrl/Cmd+K to search!",
    dismissible: true,
  },
].filter((hint) => !dismissedHints.has(hint.id));
```

**Display Hints:**
```typescript
<TutorialHints
  hints={tutorialHints}
  onDismiss={dismissHint}
  position="bottom" // or "top" or "floating"
  autoHide={false}
  hideDelay={5000}
/>
```

### Tutorial Hint Options

```typescript
interface TutorialHint {
  id: string;                    // Unique identifier
  title: string;                 // Hint title
  description: string;           // Hint description
  action?: {                     // Optional action button
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;         // Can be dismissed (default: true)
}
```

### Hook API

```typescript
const {
  dismissedHints,        // Set of dismissed hint IDs
  dismissHint,           // Dismiss a hint by ID
  resetHints,            // Reset all dismissed hints
  isHintDismissed,       // Check if hint is dismissed
} = useTutorialHints("storage-key");
```

### Positioning

- **`bottom`**: Fixed at bottom center (default)
- **`top`**: Fixed at top center
- **`floating`**: Centered vertically

### Multi-Step Tutorials

Hints automatically show progress indicators when multiple hints are active:

```typescript
const hints = [
  { id: "step1", title: "Step 1", description: "..." },
  { id: "step2", title: "Step 2", description: "..." },
  { id: "step3", title: "Step 3", description: "..." },
];
// Shows: ● — — (progress dots)
```

### Persistence

Dismissed hints are stored in localStorage:
```javascript
// Storage key: "js-playground-hints" (default)
// Stored as: ["welcome", "keyboard-shortcuts", ...]
```

Reset hints:
```typescript
const { resetHints } = useTutorialHints();
resetHints(); // Clears all dismissed hints
```

---

## Integration in Editor

All UX features are integrated in `src/app/editor/page.tsx`:

```typescript
const Page = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { dismissedHints, dismissHint } = useTutorialHints();

  // Define shortcuts
  const shortcuts = [
    { key: "k", ctrl: true, description: "Open search", handler: () => setSearchOpen(true) },
    { key: "/", ctrl: true, description: "Show shortcuts", handler: () => setShortcutsOpen(true) },
    // ... more shortcuts
  ];

  // Register shortcuts
  useKeyboardShortcuts({ shortcuts });

  // Define tutorial hints
  const tutorialHints = [
    {
      id: "welcome",
      title: "Welcome!",
      description: "Start creating variables and functions.",
      action: { label: "Add Variable", onClick: handleAddVariable },
    },
  ].filter((hint) => !dismissedHints.has(hint.id));

  return (
    <>
      {/* Main content */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
      <TutorialHints hints={tutorialHints} onDismiss={dismissHint} />
    </>
  );
};
```

---

## Best Practices

### Keyboard Shortcuts

1. ✅ Use standard conventions (Ctrl+S for save, Ctrl+Z for undo)
2. ✅ Provide visual feedback when shortcuts are pressed
3. ✅ Show available shortcuts in help dialog (Ctrl+/)
4. ✅ Avoid conflicting with browser shortcuts
5. ✅ Use platform-appropriate modifier keys (⌘ on Mac, Ctrl elsewhere)

### Search

1. ✅ Search should be fast and responsive
2. ✅ Show clear "no results" messaging
3. ✅ Highlight search terms in results
4. ✅ Provide useful filters (type, scope)
5. ✅ Remember recent searches/items

### Tutorial Hints

1. ✅ Keep hints concise and actionable
2. ✅ Show hints at appropriate times (not all at once)
3. ✅ Allow users to dismiss hints permanently
4. ✅ Provide clear action buttons
5. ✅ Don't interrupt critical workflows

---

## Testing

### Test Keyboard Shortcuts

1. **Open search**: Press `Ctrl/Cmd + K`
   - Verify search dialog opens
2. **Show shortcuts**: Press `Ctrl/Cmd + /`
   - Verify shortcuts dialog appears
3. **Toggle panels**: Press `Ctrl/Cmd + [` and `]`
   - Verify left/right panels toggle

### Test Search

1. **Open search**: `Ctrl/Cmd + K`
2. **Type query**: "test"
   - Verify real-time results appear
3. **Filter by type**: Click "Variables"
   - Verify only variables shown
4. **Switch scope**: Click "Current Package"
   - Verify results filtered to current package
5. **Click result**: Select an item
   - Verify navigation to that item's package

### Test Tutorial Hints

1. **First visit**: Clear localStorage and reload
   - Verify welcome hint appears
2. **Dismiss hint**: Click X button
   - Verify hint disappears and doesn't reappear
3. **Action button**: Click action button
   - Verify action executes
4. **Multi-step**: Create multiple hints
   - Verify progress indicators show
5. **Reset**: Call `resetHints()`
   - Verify all hints reappear

---

## API Reference

### useKeyboardShortcuts

```typescript
useKeyboardShortcuts({
  shortcuts: KeyboardShortcut[],
  preventDefault?: boolean // default: true
})

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  enabled?: boolean;
}
```

### useSearch

```typescript
const {
  searchQuery,              // Current search query
  setSearchQuery,           // Set search query
  filterType,               // Current filter type
  setFilterType,            // Set filter type
  results,                  // All matching results
  currentPackageResults,    // Current package results
  recentItems,              // Recent items (last 10)
  totalCount,               // Total searchable items
} = useSearch()
```

### useTutorialHints

```typescript
const {
  dismissedHints,           // Set<string> of dismissed hint IDs
  dismissHint,              // (hintId: string) => void
  resetHints,               // () => void
  isHintDismissed,          // (hintId: string) => boolean
} = useTutorialHints(storageKey?: string)
```

---

## Troubleshooting

### Shortcuts not working

**Problem**: Keyboard shortcuts don't trigger
**Solution**:
1. Check if another element has focus (inputs, textareas)
2. Verify shortcut isn't conflicting with browser shortcuts
3. Check console for errors
4. Ensure `useKeyboardShortcuts` is called in component

### Search not finding items

**Problem**: Search returns no results
**Solution**:
1. Verify items exist in Redux state
2. Check search query spelling
3. Try different filters (type, scope)
4. Check if items are in active packages

### Hints not showing

**Problem**: Tutorial hints don't appear
**Solution**:
1. Check if hints were previously dismissed (check localStorage)
2. Call `resetHints()` to clear dismissed hints
3. Verify hints are defined and not filtered out
4. Check console for errors

### Hints reappearing after dismiss

**Problem**: Dismissed hints keep coming back
**Solution**:
1. Check localStorage is enabled
2. Verify correct storage key is used
3. Ensure `dismissHint()` is called on dismiss
4. Check for localStorage errors in console

---

## Future Enhancements

### Potential Additions

1. **Customizable Shortcuts**
   - User-defined shortcuts
   - Import/export shortcut profiles
   - Vim mode support

2. **Advanced Search**
   - Fuzzy matching
   - Regular expression search
   - Search history
   - Saved searches

3. **Rich Tutorials**
   - Video tutorials
   - Interactive guided tours
   - Example project library
   - Context-aware hints based on user actions

4. **Accessibility**
   - Screen reader support
   - High contrast mode
   - Keyboard-only navigation
   - Focus management

---

## Summary

✅ **Keyboard Shortcuts**: Fast navigation and actions with platform-aware shortcuts  
✅ **Search & Filter**: Find anything across all packages instantly  
✅ **Tutorial System**: Guide new users with contextual, actionable hints  

**All UX features are production-ready and fully integrated!** 🎉
