"use client";

import Image from "next/image";
import { RiCloseLine, RiFilePdf2Line, RiUploadCloud2Line } from "@remixicon/react";
import { useEffect, useEffectEvent, useState, type DragEvent } from "react";
import { toast } from "sonner";
import type { Attachment } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, typing } from "@/lib/utils";
import { acceptedFiles, useVisitExtras } from "@/components/visit-extras";
import { useI18n } from "@/components/i18n-provider";

function useFileFacts() {
  const { t } = useI18n();
  return (file: Attachment) => {
    const size =
      file.size < 1024 * 1024
        ? t("{n} KB", { n: Math.max(1, Math.round(file.size / 1024)) })
        : t("{n} MB", { n: (file.size / 1024 / 1024).toFixed(1) });
    return `${file.kind === "pdf" ? t("PDF") : t("Image")} · ${size}`;
  };
}

function Thumb({ file }: { file: Attachment }) {
  if (file.kind === "pdf") {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive dark:bg-destructive/20">
        <RiFilePdf2Line className="size-6" />
      </span>
    );
  }
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {/* Files never leave the device, so there is nothing for the image service to optimise. */}
      <Image src={file.src} alt="" fill unoptimized sizes="48px" className="object-cover" />
    </span>
  );
}

/**
 * Letters, scans and results attached to a visit. Drop them in or choose
 * them; each one can be opened in place. Files the practice attached are part
 * of the record and stay; ones added here can be taken off again.
 */
export function VisitFiles({ extrasKey, seed }: { extrasKey: string; seed: Attachment[] }) {
  const { t } = useI18n();
  const facts = useFileFacts();
  const { files: added, addFiles, removeFile } = useVisitExtras(extrasKey);
  const [dragging, setDragging] = useState(false);
  // The file stays set while the dialog closes, so it does not empty mid-animation.
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const [open, setOpen] = useState(false);
  // Only files attached while this panel was open show their upload.
  const [arriving, setArriving] = useState<string[]>([]);

  const files = [...seed, ...added];
  const removable = (file: Attachment) => added.some((item) => item.id === file.id);

  function take(list: Iterable<File> | null) {
    const all = list ? [...list] : [];
    const accepted = all.filter(
      (file) =>
        (file.type.startsWith("image/") || file.type === "application/pdf") &&
        file.size <= acceptedFiles.maxBytes,
    );
    if (accepted.length < all.length) toast.error(t("Only images and PDFs up to 25 MB can be attached."));
    if (!accepted.length) return;
    const attached = addFiles(accepted);
    setArriving(attached.map((file) => file.id));
  }

  function drag(event: DragEvent, over: boolean) {
    event.preventDefault();
    setDragging(over);
  }

  // A scan copied from the scanner's own app lands here, wherever the doctor last clicked.
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    if (typing(event.target) || !event.clipboardData?.files.length) return;
    // A pasted image is always called "image.png"; give it a name worth reading.
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    take(
      [...event.clipboardData.files].map((file) =>
        file.name === "image.png"
          ? new File([file], `${t("Pasted image {time}", { time })}.png`, { type: file.type })
          : file,
      ),
    );
  });

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  return (
    <div className="grid gap-3">
      {files.length ? (
        <ul className="grid gap-2">
          {files.map((file) => (
            <li key={file.id} className="relative">
              <button
                type="button"
                onClick={() => {
                  setViewing(file);
                  setOpen(true);
                }}
                className="flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-background p-2.5 pe-11 text-start transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Thumb file={file} />
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{facts(file)}</span>
                </span>
                {arriving.includes(file.id) ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 animate-[scribe-upload_1.4s_ease-out_both] bg-primary ltr:origin-left rtl:origin-right motion-reduce:hidden"
                  />
                ) : null}
              </button>
              {removable(file) ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute end-2 top-1/2 -translate-y-1/2"
                  onClick={() => removeFile(file.id)}
                  aria-label={t("Remove {name}", { name: file.name })}
                  title={t("Remove")}
                >
                  <RiCloseLine />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <label
        onDragOver={(event) => drag(event, true)}
        onDragLeave={(event) => drag(event, false)}
        onDrop={(event) => {
          drag(event, false);
          take(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 text-center transition-colors hover:bg-muted/40 has-focus-visible:ring-2 has-focus-visible:ring-ring",
          files.length ? "py-4" : "py-7",
          dragging && "border-primary bg-accent/60",
        )}
      >
        <RiUploadCloud2Line className={cn("mb-1 size-6", dragging ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-medium">{t("Drop files here, or choose them")}</span>
        <span className="text-xs text-muted-foreground">{t("Scans, letters and results — images or PDFs, up to 25 MB each.")}</span>
        <span className="text-xs text-muted-foreground">{t("You can also paste an image.")}</span>
        <input
          type="file"
          multiple
          accept={acceptedFiles.types}
          className="sr-only"
          onChange={(event) => {
            take(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="border-b px-5 py-4 pe-14">
            <DialogTitle className="truncate">{viewing?.name}</DialogTitle>
            <DialogDescription className="text-xs tabular-nums">
              {viewing ? facts(viewing) : null}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div
              className={cn(
                "relative bg-muted/40",
                viewing.kind === "image" ? "h-[min(65dvh,36rem)]" : "h-[min(75dvh,48rem)]",
              )}
            >
              {viewing.kind === "image" ? (
                <Image
                  src={viewing.src}
                  alt={viewing.name}
                  fill
                  unoptimized
                  loading="eager"
                  sizes="100vw"
                  className="object-contain p-4"
                />
              ) : (
                <iframe
                  src={`${viewing.src}#toolbar=0&navpanes=0`}
                  title={viewing.name}
                  className="size-full bg-background"
                />
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
