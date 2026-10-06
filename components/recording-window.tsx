"use client";

import { useRouter } from "next/navigation";
import {
  RiDeleteBinLine,
  RiExpandDiagonalLine,
  RiPauseFill,
  RiPictureInPicture2Line,
  RiPlayFill,
  RiStopFill,
} from "@remixicon/react";
import { createContext, use, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
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

/** The theme and colour scheme of the page, given to the floating window. */
function dress(root: HTMLElement) {
  root.className = document.documentElement.className;
  root.style.colorScheme = document.documentElement.style.colorScheme;
}

/**
 * Opens the floating window and dresses it like the app: the same
 * stylesheets, fonts, theme and direction, so what is drawn into it is the
 * app's own card, not a lookalike.
 */
async function float(api: DocumentPictureInPicture, title: string) {
  // Room for the name, the time, the wave and the controls; the doctor can
  // make it smaller or larger, and the layout follows.
  const floating = await api.requestWindow({ width: 360, height: 184 });
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
  dress(doc.documentElement);
  doc.documentElement.lang = document.documentElement.lang;
  doc.documentElement.dir = document.documentElement.dir;
  doc.body.className = "overflow-hidden bg-background font-sans text-foreground antialiased";
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

/* The wave: a bar enters every `step` milliseconds while the strip glides one
   bar along in between. Enough bars to fill a wide window; a narrow one shows
   only the newest. A silent bar rests at 8% of its height. */
const wave = { bars: 120, step: 90, rest: 0.08 };

/** How loud the microphone is, 0 to 1, read on demand; null while its audio is not running. */
function listen(stream: MediaStream) {
  try {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    if (context.state === "suspended") context.resume().catch(() => {});
    return {
      level: () => {
        if (context.state !== "running") return null;
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        // Speech sits around 0.02–0.2 RMS; the curve lifts a quiet voice into view.
        return Math.min(1, (Math.sqrt(sum / samples.length) * 9) ** 0.7);
      },
      close: () => {
        context.close().catch(() => {});
      },
    };
  } catch {
    return null;
  }
}

/** A voice-like rise and fall, drawn when there is no microphone to listen to. */
function speechLike(time: number) {
  const seconds = time / 1000;
  const syllables = Math.abs(Math.sin(seconds * 5.3) * Math.sin(seconds * 1.7 + 1));
  const phrases = 0.5 + 0.5 * Math.sin(seconds * 0.6);
  return syllables * (0.3 + 0.7 * phrases) * (0.75 + 0.25 * Math.random());
}

/**
 * The microphone's level as a wave that runs from the end of the window
 * towards its start, newest bar first — so in Farsi and Arabic it runs the
 * other way, as their text does.
 *
 * It draws outside React: once a frame it moves one transform on the strip,
 * and once a step it rescales the bars, which the browser does without
 * layout. Frames come from the window the wave is drawn in, so a floating
 * window keeps it moving while the app's tab is hidden, and nothing runs at
 * all while paused. Reduced motion gets a still wave.
 */
function LevelWave({ live, className }: { live: boolean; className?: string }) {
  const { microphone } = useActiveRecording();
  const strip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = strip.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view || !live) return;
    const bars = [...element.children] as HTMLElement[];

    if (view.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bars.forEach((bar, index) => {
        bar.style.scale = `1 ${(0.2 + 0.5 * Math.abs(Math.sin(index * 0.9) * Math.sin(index * 0.31))).toFixed(3)}`;
      });
      return;
    }

    const audio = microphone ? listen(microphone) : null;
    const pitch = Math.abs(bars[1].getBoundingClientRect().left - bars[0].getBoundingClientRect().left) || 6;
    const towardsStart = view.getComputedStyle(element).direction === "rtl" ? 1 : -1;
    let shown = 0;
    let stepStarted = -1;
    let frame = 0;

    const draw = (time: number) => {
      frame = view.requestAnimationFrame(draw);
      if (stepStarted < 0) stepStarted = time;
      const progress = (time - stepStarted) / wave.step;
      if (progress < 1) {
        element.style.transform = `translateX(${(towardsStart * progress * pitch).toFixed(2)}px)`;
        return;
      }
      // One bar along: every bar takes its neighbour's height and the strip
      // jumps back, which looks like nothing moved at all.
      for (let index = 0; index < bars.length - 1; index++) bars[index].style.scale = bars[index + 1].style.scale;
      // Rises at once and falls gently, as a meter's needle does.
      shown = Math.max(audio?.level() ?? speechLike(time), shown * 0.6);
      bars[bars.length - 1].style.scale = `1 ${Math.max(wave.rest, shown).toFixed(3)}`;
      element.style.transform = "";
      stepStarted = time;
    };

    frame = view.requestAnimationFrame(draw);
    return () => {
      view.cancelAnimationFrame(frame);
      audio?.close();
    };
  }, [live, microphone]);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex overflow-hidden transition-opacity duration-300 ltr:mask-l-from-60% rtl:mask-r-from-60%",
        !live && "opacity-40",
        className,
      )}
    >
      {/* One bar wider than the window: the newest waits just past the end and glides in. */}
      <span ref={strip} className="-me-1.5 flex min-w-0 flex-1 justify-end gap-0.75 will-change-transform">
        {Array.from({ length: wave.bars }, (_, index) => (
          <i key={index} className="w-0.75 shrink-0 scale-y-8 rounded-full bg-primary" />
        ))}
      </span>
    </span>
  );
}

/** Red and breathing while it records; grey and still while paused. */
function StatusDot({ live }: { live: boolean }) {
  return (
    <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
      {live ? (
        <span className="absolute inset-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-destructive/50 motion-reduce:hidden" />
      ) : null}
      <span className={cn("relative size-2.5 rounded-full", live ? "bg-destructive" : "bg-muted-foreground")} />
    </span>
  );
}

/**
 * The recording as the floating window shows it, like a small player: who it
 * is for, the time large, the microphone's wave, and the controls along the
 * bottom — Finish first, Pause beside it, Discard quiet and two presses away.
 *
 * Short windows put the time and the wave side by side; from 15rem tall the
 * time grows and the wave gets a row of its own.
 */
function FloatingRecording({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const { recording, pause, resume, discard } = useActiveRecording();
  const { t } = useI18n();
  // Throwing a recording away takes two presses, never one.
  const [discarding, setDiscarding] = useState(false);
  if (!recording) return null;
  const live = recording.phase === "recording";

  return (
    <section aria-label={t("Recording in progress")} className="@container flex h-dvh flex-col select-none">
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-2.5 pb-3 [@media(min-height:15rem)]:gap-3 [@media(min-height:15rem)]:px-5 [@media(min-height:15rem)]:pt-4">
        <header className="flex h-7 shrink-0 items-center gap-2 text-xs">
          <StatusDot live={live} />
          <span className="font-semibold" aria-live="polite">
            {live ? t("Recording") : t("Paused")}
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{recording.patient.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="-me-1.5 text-muted-foreground"
            onClick={onBack}
            aria-label={t("Back to the recording")}
            title={t("Back to the recording")}
          >
            <RiExpandDiagonalLine />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 items-center gap-4 [@media(min-height:15rem)]:flex-col [@media(min-height:15rem)]:items-stretch [@media(min-height:15rem)]:justify-center">
          <Elapsed
            recording={recording}
            className={cn(
              "shrink-0 text-[clamp(2rem,15vmin,4.5rem)] leading-none font-semibold tracking-tight tabular-nums transition-colors",
              !live && "text-muted-foreground",
            )}
          />
          <LevelWave
            live={live}
            className="h-10 min-w-0 flex-1 [@media(min-height:15rem)]:h-auto [@media(min-height:15rem)]:max-h-28 [@media(min-height:15rem)]:min-h-10"
          />
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t bg-sidebar px-3 py-2.5 [@media(min-height:15rem)]:px-4 [@media(min-height:15rem)]:py-3">
        <Button
          variant={discarding ? "destructive" : "ghost"}
          size={discarding ? "sm" : "icon-sm"}
          className={cn(!discarding && "text-muted-foreground")}
          onClick={() => (discarding ? discard() : setDiscarding(true))}
          onBlur={() => setDiscarding(false)}
          aria-label={discarding ? t("Discard this recording?") : t("Discard")}
          title={discarding ? t("Discard this recording?") : t("Discard")}
        >
          <RiDeleteBinLine data-icon="inline-start" />
          {discarding ? t("Discard?") : null}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={live ? pause : resume}
          title={live ? t("Pause") : t("Resume")}
        >
          {live ? <RiPauseFill data-icon="inline-start" /> : <RiPlayFill data-icon="inline-start" />}
          <span className="@max-3xs:sr-only">{live ? t("Pause") : t("Resume")}</span>
        </Button>
        <Button size="sm" onClick={onFinish}>
          <RiStopFill data-icon="inline-start" />
          {t("Finish")}
        </Button>
      </footer>
    </section>
  );
}

/**
 * A recording that stays in sight wherever the doctor goes. Pressing Start
 * floats it in a small window that stays on top of everything — other pages
 * here, other tabs, other apps — with the time, the microphone's wave, pause,
 * finish, discard and the way back, until the recording ends or the doctor
 * closes it. It opens at Start because a browser only opens a window straight
 * after a click; closed, it opens again by itself on a tab switch where the
 * browser allows (a page using the microphone), or by hand from Pop out.
 *
 * Only Chrome and Edge float windows at all. Elsewhere, or once the window is
 * closed, the corner card is where the recording shows while the doctor is
 * away from it — never both at once.
 */
export function RecordingWindowProvider({ children }: { children: ReactNode }) {
  const { recording, finish } = useActiveRecording();
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
    const theme = new MutationObserver(() => dress(floating.window.document.documentElement));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
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

  // Finished from the window, the app comes forward with the visit being written.
  function finishHere() {
    window.focus();
    finish();
  }

  return (
    <WindowContext value={{ supported, open: () => popOut(title, false, setFloating), floating: floating !== null }}>
      {children}
      {floating
        ? createPortal(<FloatingRecording onBack={back} onFinish={finishHere} />, floating.window.document.body)
        : null}
    </WindowContext>
  );
}
