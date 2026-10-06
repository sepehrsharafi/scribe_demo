"use client"

import { cn } from "cn"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiCloseLine,
  RiErrorWarningFill,
  RiInformationFill,
  RiLoaderLine,
} from "@remixicon/react"

import { buttonVariants } from "@/components/ui/button"

/*
 * Toasts are small cards laid over the page: an icon in the colour of what
 * happened, a title and its description, and their actions as buttons. A
 * hairline along the foot runs down the time the toast has left, and stops
 * while the pointer is over it, exactly as the toast's own timer does.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      duration={5000}
      gap={10}
      icons={{
        success: <RiCheckboxCircleFill className="size-5 text-primary" />,
        info: <RiInformationFill className="size-5 text-muted-foreground" />,
        warning: <RiErrorWarningFill className="size-5 text-warning" />,
        error: <RiCloseCircleFill className="size-5 text-destructive" />,
        loading: <RiLoaderLine className="size-5 animate-spin text-muted-foreground" />,
        close: <RiCloseLine className="size-4" />,
      }}
      style={
        {
          "--width": "23rem",
          "--toast-duration": "5s",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group/toast relative flex w-(--width) items-start gap-3 overflow-hidden rounded-xl border bg-popover p-4 pe-12 font-sans text-popover-foreground shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Toasts stacked behind the front one show only their edge.
            "data-[expanded=false]:data-[front=false]:*:opacity-0",
            // The countdown. Coloured only while the toast is settled, because
            // Sonner borrows ::before for its own swipe and exit geometry.
            "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:origin-left before:animate-[scribe-countdown_var(--toast-duration)_linear_forwards] data-[expanded=true]:before:[animation-play-state:paused] data-[removed=false]:data-[swiping=false]:before:bg-primary/60 rtl:before:origin-right motion-reduce:before:hidden",
          ].join(" "),
          icon: "flex size-5 shrink-0 items-center justify-center",
          content: "grid min-w-0 flex-1 gap-0.5",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 self-center"),
          cancelButton: cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 self-center"),
          closeButton: cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "absolute end-2 top-2"),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
