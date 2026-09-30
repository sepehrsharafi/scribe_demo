"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { RiCloseLine, RiLoaderLine } from "@remixicon/react"

/* A toast is marked by a square in its colour, not an icon: the same square
   the brand mark is made of. */
const mark = (tone: string) => <span className={`block size-2.5 rounded-[2px] ${tone}`} />

/*
 * Toasts are slips of ink laid over the page — the inverse surface — so they
 * read as the product speaking, not as more page. Actions are set like the
 * app's labels, mono and upper case. A hairline along the foot runs down the
 * time the toast has left, and stops while the pointer is over it, exactly as
 * the toast's own timer does.
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
        success: mark("bg-inverse-signal"),
        info: mark("bg-inverse-signal"),
        warning: mark("bg-warning"),
        error: mark("bg-destructive"),
        loading: <RiLoaderLine className="size-4 animate-spin text-inverse-muted" />,
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
            "group/toast relative flex w-(--width) items-start gap-3 overflow-hidden rounded-2xl bg-inverse py-3.5 ps-4 pe-11 font-sans text-inverse-foreground shadow-[0_18px_40px_-20px_rgb(0_0_0/0.55)] outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Toasts stacked behind the front one show only their edge.
            "data-[expanded=false]:data-[front=false]:*:opacity-0",
            // The countdown. Coloured only while the toast is settled, because
            // Sonner borrows ::before for its own swipe and exit geometry.
            "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:origin-left before:animate-[scribe-countdown_var(--toast-duration)_linear_forwards] data-[expanded=true]:before:[animation-play-state:paused] data-[removed=false]:data-[swiping=false]:before:bg-inverse-signal/70 rtl:before:origin-right motion-reduce:before:hidden",
          ].join(" "),
          icon: "mt-1.5 flex size-3 shrink-0 items-center justify-center",
          content: "grid min-w-0 flex-1 gap-0.5",
          title: "text-sm leading-6 font-medium",
          description: "text-xs text-inverse-muted",
          actionButton:
            "shrink-0 self-center rounded-md px-2 py-1 font-mono text-2xs font-semibold tracking-[0.14em] text-inverse-signal uppercase outline-none transition-colors hover:bg-inverse-foreground/10 focus-visible:ring-2 focus-visible:ring-inverse-signal",
          cancelButton:
            "shrink-0 self-center rounded-md px-2 py-1 font-mono text-2xs font-semibold tracking-[0.14em] text-inverse-muted uppercase outline-none transition-colors hover:bg-inverse-foreground/10 focus-visible:ring-2 focus-visible:ring-inverse-signal",
          closeButton:
            "absolute end-2.5 top-3 flex size-7 items-center justify-center rounded-lg text-inverse-muted outline-none transition-colors hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:ring-2 focus-visible:ring-inverse-signal",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
