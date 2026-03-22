import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Skeleton component for displaying loading placeholder shapes.
 *
 * How it works:
 * - Renders a `<div>` with a pulsing animation to indicate loading state.
 * - Uses `animate-pulse` for a gentle fade in/out effect on the muted background.
 * - Default shape is `rounded-xl` for a soft, rounded placeholder block.
 * - Has no fixed dimensions — control size via `className` (e.g. `h-4 w-[200px]`).
 * - Commonly used to mirror the layout of content that hasn't loaded yet.
 *   For example, use a `Skeleton` with `rounded-full` and `size-10` to placeholder an avatar,
 *   or `h-4 w-3/4` to placeholder a line of text.
 * - Multiple skeletons can be stacked in a flex column to simulate a card or list.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
