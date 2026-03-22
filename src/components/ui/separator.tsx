import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Separator component for visually dividing content sections.
 *
 * How it works:
 * - Renders a thin line (1px) using the `border` color token.
 * - `orientation` prop controls the direction:
 *   `"horizontal"` (default) — full-width line, 1px tall.
 *   `"vertical"` — full-height line, 1px wide.
 * - Uses `role="separator"` and `aria-orientation` for accessibility.
 * - `decorative` prop (default: true) sets `aria-hidden="true"` so screen readers
 *   skip purely visual separators. Set to `false` for meaningful content dividers.
 * - Designed to work inline in flex/grid layouts — shrinks to fit via `shrink-0`.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}) {
  return (
    <div
      data-slot="separator"
      role="separator"
      aria-orientation={orientation}
      aria-hidden={decorative}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
