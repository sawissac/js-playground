import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button component for triggering actions and navigation.
 *
 * How it works:
 * - Uses CVA (Class Variance Authority) to manage style variants.
 * - Supports `variant` prop to switch between visual styles:
 *   `default` (primary fill), `destructive` (danger), `outline` (bordered),
 *   `secondary` (subtle fill), `ghost` (transparent hover), `link` (underlined text).
 * - Supports `size` prop: `default`, `sm`, `lg`, `icon` (square icon button).
 * - Set `asChild` to `true` to render a child element (e.g. an anchor tag) with button styles
 *   using Radix UI's Slot pattern for polymorphic rendering.
 * - All buttons use pill-shaped rounded corners for a soft, minimal aesthetic.
 * - Focus and invalid states are handled via `focus-visible` and `aria-invalid` attributes.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-4 py-1 has-[>svg]:px-3 text-xs",
        sm: "h-7 gap-1.5 px-3 has-[>svg]:px-2 text-xs",
        lg: "h-10 px-5 has-[>svg]:px-4 text-sm",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
