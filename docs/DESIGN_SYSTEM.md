# Design System

A rounded, minimal component library built with Tailwind CSS 4, CVA, and Radix UI primitives.

## Design Principles

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
