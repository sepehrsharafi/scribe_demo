import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function PatientAvatar({
  initials,
  size = "default",
  tone = "muted",
  className,
}: {
  initials: string;
  size?: "sm" | "default" | "lg";
  tone?: "muted" | "primary";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback
        className={cn(
          "font-medium tracking-tight",
          size === "lg" ? "text-sm" : "text-xs",
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
