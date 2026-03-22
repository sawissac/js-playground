import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card component for grouping related content in a bordered container.
 *
 * How it works:
 * - Composed of: `Card` (outer container), `CardHeader`, `CardTitle`,
 *   `CardDescription`, `CardContent`, and `CardFooter`.
 * - `Card` provides a rounded-2xl bordered surface with background and shadow.
 *   It uses `flex flex-col` so sub-components stack vertically by default.
 * - `CardHeader` holds the title and description with consistent padding and spacing.
 *   When preceded by `CardContent` (via CSS `has` selector), it adjusts padding automatically.
 * - `CardTitle` renders as a semibold heading; `CardDescription` renders muted text below it.
 * - `CardContent` is the main body area with horizontal padding.
 * - `CardFooter` aligns items horizontally at the bottom with top padding.
 * - All sub-components accept a `className` prop for customization via `cn()`.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-6 has-data-[slot=card-action]:flex-row has-data-[slot=card-action]:items-center has-data-[slot=card-action]:justify-between",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("self-start", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pt-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
