import { RiLockLine, RiQuillPenLine, RiSparklingLine } from "@remixicon/react";
import type { NoteVersion } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

/** The version chain, newest first. */
export function VersionList({ versions }: { versions: NoteVersion[] }) {
  return (
    <div className="grid gap-3">
      {versions
        .slice()
        .reverse()
        .map((version) => (
          <div key={version.id} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                version.kind === "approval"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {version.kind === "ai" ? (
                <RiSparklingLine className="size-3" />
              ) : version.kind === "approval" ? (
                <RiLockLine className="size-3" />
              ) : (
                <RiQuillPenLine className="size-3" />
              )}
            </span>
            <div className="min-w-0">
              <strong className="block text-xs font-medium">{version.label}</strong>
              <span className="text-2xs text-muted-foreground">
                {version.author} · {version.time}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}
