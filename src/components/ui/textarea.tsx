import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea component for multi-line text input.
 *
 * How it works:
 * - A styled HTML `<textarea>` element with rounded-xl shape for a soft container feel.
 * - Accepts all native textarea props (rows, cols, placeholder, maxLength, etc.).
 * - Uses `min-h-[80px]` as the default minimum height — override via className or rows.
 * - Focus state shows a ring highlight; invalid state via `aria-invalid` shows destructive ring.
 * - Uses the same design tokens as Input (border-input, text-xs, shadow-xs) for visual consistency.
 * - Field sizing is set to `content` so the textarea can auto-grow with content when supported.
 * - Disabled state reduces opacity and blocks pointer events.
 */
function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex field-sizing-content min-h-[80px] w-full rounded-xl border bg-transparent px-4 py-3 text-xs shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
