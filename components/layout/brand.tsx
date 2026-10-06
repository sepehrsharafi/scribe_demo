import { cn } from "@/lib/utils";

/** Four squares, one of them the signal colour. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-6 shrink-0 grid-cols-2 grid-rows-2 gap-0.5", className)}>
      <i className="bg-foreground" />
      <i className="bg-primary" />
      <i className="bg-border" />
      <i className="bg-foreground" />
    </span>
  );
}
