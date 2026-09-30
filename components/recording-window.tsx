"use client";

import { useRouter } from "next/navigation";
import { RiExpandDiagonalLine, RiPauseFill, RiPictureInPicture2Line, RiPlayFill } from "@remixicon/react";
import { createContext, use, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Elapsed, useActiveRecording } from "@/components/active-recording";
import { useI18n } from "@/components/i18n-provider";

/** Chromium's Document Picture-in-Picture: an always-on-top window the page draws into. */
type DocumentPictureInPicture = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
  window: Window | null;
};

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

const noSubscription = () => () => {};

/* Four bars of the sign-in screen's wave, offset so they never move together. */
const bars = ["0s", "-0.4s", "-0.8s", "-0.2s"];

/**
 * Opens the floating window and dresses it like the app: the same
 * stylesheets, fonts, theme and direction, so what is drawn into it is the
 * app's own card, not a lookalike.
 */
async function float(api: DocumentPictureInPicture, title: string) {
  const floating = await api.requestWindow({ width: 380, height: 96 });
  const { document: doc } = floating;
  for (const sheet of [...document.styleSheets]) {
    // A stylesheet file is linked again rather than copied: its fonts are
    // addressed relative to the file, and only the file's own address finds them.
    if (sheet.href) {
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      doc.head.append(link);
      continue;
    }
    try {
      const style = doc.createElement("style");
      style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      doc.head.append(style);
    } catch {
      // A sheet that cannot be read is one the window can do without.
    }
  }
  doc.documentElement.className = document.documentElement.className;
  doc.documentElement.lang = document.documentElement.lang;
  doc.documentElement.dir = document.documentElement.dir;
  doc.body.className = "bg-background font-sans text-foreground antialiased";
  doc.title = title;
  return floating;
}

type Floating = { window: Window; automatic: boolean };

/** Floats the recording unless it already is, and reports the window coming and going. */
function popOut(title: string, automatic: boolean, set: (next: Floating | null) => void) {
  const api = window.documentPictureInPicture;
  if (!api || api.window) return;
  float(api, title)
    .then((opened) => {
      opened.addEventListener("pagehide", () => set(null), { once: true });
      set({ window: opened, automatic });
    })
    .catch(() => {});
}

type Controls = {
  supported: boolean;
  /** Floats the recording, if it is not already. Needs a click to have just happened. */
  open: () => void;
  floating: boolean;
};

const WindowContext = createContext<Controls>({ supported: false, open: () => {}, floating: false });

/** Whether the recording is floating in its own window, and the way to float it. */
export const useRecordingWindow = () => use(WindowContext);

/** Floats the recording by hand, where the browser can. Nothing at all where it cannot. */
export function PopOutButton({ className }: { className?: string }) {
  const { supported, open, floating } = useRecordingWindow();
  const { t } = useI18n();
  if (!supported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={open}
      disabled={floating}
      aria-label={t("Pop out the recording")}
      title={t("Pop out: it stays on top while you work in other tabs and apps")}
    >
      <RiPictureInPicture2Line />
    </Button>
  );
}

/**
 * The recording as the floating window shows it — the same card the app
 * shows in its corner: who, how long, pause, and the way back.
 */
function FloatingRecording({ onBack }: { onBack: () => void }) {
  const { recording, pause, resume } = useActiveRecording();
  const { t } = useI18n();
  if (!recording) return null;
  const live = recording.phase === "recording";

  return (
    <section
      aria-label={t("Recording in progress")}
      className="flex h-dvh items-center gap-3 border-t-2 border-primary px-3 select-none"
    >
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center gap-0.5 rounded-2xl bg-accent">
        {bars.map((delay) => (
          <i
            key={delay}
            className={cn(
              "h-4 w-0.75 origin-center animate-[scribe-wave_1.2s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none",
              !live && "[animation-play-state:paused] opacity-50",
            )}
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate font-heading text-base font-semibold tracking-tight">
          {recording.patient.name}
        </strong>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
          <span className={cn("size-2 shrink-0 rounded-full", live ? "animate-pulse bg-destructive" : "bg-muted-foreground")} />
          {live ? t("Recording") : t("Paused")}
          <span aria-hidden="true">·</span>
          <Elapsed recording={recording} className="text-foreground" />
        </span>
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={live ? pause : resume}
        aria-label={live ? t("Pause") : t("Resume")}
        title={live ? t("Pause") : t("Resume")}
      >
        {live ? <RiPauseFill /> : <RiPlayFill />}
      </Button>
      <Button size="icon" onClick={onBack} aria-label={t("Back to the recording")} title={t("Back to the recording")}>
        <RiExpandDiagonalLine />
      </Button>
    </section>
  );
}

/**
 * A recording that stays in sight wherever the doctor goes. Pressing Start
 * floats it in a small window that stays on top of everything — other pages
 * here, other tabs, other apps — with pause and the way back, until the
 * recording ends or the doctor closes it. It opens at Start because a browser
 * only opens a window straight after a click; closed, it opens again by
 * itself on a tab switch where the browser allows (a page using the
 * microphone), or by hand from Pop out.
 *
 * Only Chrome and Edge float windows at all. Elsewhere, or once the window is
 * closed, the corner card is where the recording shows while the doctor is
 * away from it — never both at once.
 */
export function RecordingWindowProvider({ children }: { children: ReactNode }) {
  const { recording } = useActiveRecording();
  const { t } = useI18n();
  const router = useRouter();
  // Floated by the browser on a tab switch (automatic), it goes when the doctor comes back.
  const [floating, setFloating] = useState<Floating | null>(null);
  const supported = useSyncExternalStore(noSubscription, () => Boolean(window.documentPictureInPicture), () => false);
  const exists = recording !== null;
  const title = t("Recording");

  useEffect(() => {
    if (!exists || !supported) return;
    const action = "enterpictureinpicture" as MediaSessionAction;
    try {
      navigator.mediaSession.setActionHandler(action, () => popOut(title, true, setFloating));
    } catch {
      // This browser does not float windows on its own.
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {}
    };
  }, [exists, supported, title]);

  // The recording is over, or the doctor is back in the tab the browser floated it away from.
  useEffect(() => {
    if (!floating) return;
    if (!exists) {
      floating.window.close();
      return;
    }
    // The theme can change while it floats; the window follows.
    const theme = new MutationObserver(() => {
      floating.window.document.documentElement.className = document.documentElement.className;
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onReturn = () => {
      if (floating.automatic && document.visibilityState === "visible") floating.window.close();
    };
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      theme.disconnect();
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [floating, exists]);

  function back() {
    if (!recording) return;
    window.focus();
    router.push(`/new?patient=${recording.patient.id}`);
  }

  return (
    <WindowContext value={{ supported, open: () => popOut(title, false, setFloating), floating: floating !== null }}>
      {children}
      {floating ? createPortal(<FloatingRecording onBack={back} />, floating.window.document.body) : null}
    </WindowContext>
  );
}
