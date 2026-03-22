import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input component for single-line text entry.
 *
 * How it works:
 * - A styled HTML `<input>` element with rounded-full pill shape for a soft look.
 * - Accepts all native input props via `React.ComponentProps<"input">`.
 * - Type-safe — pass `type` to switch between text, email, password, number, etc.
 * - Focus state uses a ring highlight (`focus-visible:ring`) for clear visual feedback.
 * - Invalid state is indicated via `aria-invalid` with a destructive ring color.
 * - File inputs are styled inline with transparent background.
 * - Disabled state reduces opacity and blocks pointer events.
 * - Uses minimal height (h-8) and small text (text-xs) for compact layouts.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 w-full min-w-0 rounded-full border bg-transparent px-4 py-1 text-xs shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
