import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Label component for associating descriptive text with form controls.
 *
 * How it works:
 * - A styled HTML `<label>` element that pairs with inputs, selects, or textareas.
 * - Uses `text-sm font-medium` for clear, readable form labels.
 * - Automatically styles as muted and italic when the associated control is disabled
 *   (via the `peer-disabled` modifier — the input must have the `peer` class).
 * - Accepts all native label props including `htmlFor` to link to an input by ID.
 * - Keeps a minimal footprint — just text styling with no extra wrapper elements.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
