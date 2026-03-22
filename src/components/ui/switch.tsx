"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Switch component for toggling between on/off states.
 *
 * How it works:
 * - A custom toggle built with a native `<button>` element and `role="switch"`.
 * - The `checked` prop controls the on/off state; `onCheckedChange` fires when toggled.
 *   Also supports uncontrolled usage — omit `checked` and it manages its own state.
 * - Visually renders as a pill-shaped track with a sliding circular thumb.
 *   When off: muted background. When on: primary color background.
 * - The thumb slides from left to right via `translate-x` transition on state change.
 * - Uses `aria-checked` for screen reader accessibility.
 * - Disabled state reduces opacity and blocks interaction.
 * - Sized at 36x20px (track) with a 16x16px (thumb) for compact form layouts.
 */
function Switch({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "role" | "type"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = checked !== undefined ? checked : internalChecked

  const handleClick = () => {
    if (disabled) return
    const next = !isChecked
    if (checked === undefined) setInternalChecked(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      data-slot="switch"
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "bg-primary" : "bg-input",
        className
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
          isChecked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
