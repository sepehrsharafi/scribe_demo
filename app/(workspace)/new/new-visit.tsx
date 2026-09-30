"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiFileList3Line,
  RiMicLine,
  RiPauseFill,
  RiPlayFill,
  RiStopFill,
  RiVoiceprintLine,
} from "@remixicon/react";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { noteOrder, sectionLabels, type Note as NoteRecord, type TextSectionId } from "@/lib/demo-data";
import { saveRecording } from "@/lib/actions/workspace";
import { demoToday } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatDuration } from "@/lib/utils";
import {
  Elapsed,
  elapsedSeconds,
  useActiveRecording,
  type LiveRecording,
} from "@/components/active-recording";
import { InstructionsSheet } from "@/components/instructions-sheet";
import { PopOutButton, useRecordingWindow } from "@/components/recording-window";
import { Note } from "@/components/note";
import { useWriteUp } from "@/components/use-write-up";
import { handoutDocument, noteDocument } from "@/components/write-up-document";
import { EditorToolbar } from "@/components/write-up-editor";
import { useVisitExtrasHandover } from "@/components/visit-extras";
import { VisitFrame } from "@/components/visit-frame";
import { VisitTabs, type VisitTab } from "@/components/visit-tabs";
import { useI18n } from "@/components/i18n-provider";

type Patient = { id: string; name: string; firstName: string };

type Shared = {
  patient: Patient;
  identity: ReactNode;
  context: ReactNode;
};

/* Deterministic bar offsets — random values would break hydration. */
const bars = Array.from({ length: 14 }, (_, index) => `${((index * 37) % 9) * -0.13}s`);

/** HH:MM, some seconds ago. */
const clockAt = (secondsAgo: number) =>
  new Date(Date.now() - secondsAgo * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function Meter({ live, className }: { live: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex h-6 items-center gap-0.5", className)}>
      {bars.map((delay, index) => (
        <i
          key={index}
          className={cn(
            "h-full w-0.75 origin-center animate-[scribe-wave_1.1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none",
            !live && "[animation-play-state:paused] opacity-40",
          )}
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

/** What a tab will hold once there is something to put in it. */
function Waiting({ icon: Icon, title, children }: { icon: typeof RiMicLine; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

/** The note before it exists: its sections, faint, so the doctor knows what is coming. */
function NoteToCome({ onWrite }: { onWrite?: () => void }) {
  const { t } = useI18n();

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">
        {t("Written from the conversation when you finish recording, section by section.")}
      </p>
      <ol className="mt-5 divide-y border-y">
        {noteOrder.map((id, index) => (
          <li key={id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 py-4">
            <span className="font-mono text-2xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex items-center gap-4">
              <span className="font-heading text-base font-semibold tracking-tight text-muted-foreground">
                {t(sectionLabels[id])}
              </span>
              <span aria-hidden="true" className="h-2 flex-1 rounded-full bg-muted" />
            </span>
          </li>
        ))}
      </ol>
      {onWrite ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("Nothing to record — a phone call, a home visit?")}{" "}
          <button
            type="button"
            onClick={onWrite}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            {t("Write the note yourself")}
          </button>
        </p>
      ) : null}
    </div>
  );
}

const blank: NoteRecord = {
  sections: noteOrder
    .filter((id): id is TextSectionId => id !== "medications")
    .map((id) => ({ id, body: "" })),
  medications: [],
  instructions: { summary: "", steps: "", followUp: "", warning: "" },
};

/**
 * A visit with nothing to record: the same note and instructions, typed
 * straight in. Nothing here pretends a model was involved, and in the demo it
 * stays on this device.
 */
function WriteUp({ patient, identity, context, onBack }: Shared & { onBack: () => void }) {
  const { t, f } = useI18n();
  const [tab, setTab] = useState<VisitTab>("note");
  const writeUp = useWriteUp({
    storeKey: `new:${patient.id}`,
    approved: false,
    draft: () => ({
      note: noteDocument(blank, t, true),
      handout: handoutDocument({
        instructions: blank.instructions,
        firstName: patient.firstName,
        doctor: t("You"),
        medicines: false,
        t,
      }),
    }),
  });
  const written = writeUp.facts.written;

  const actions = writeUp.approved ? (
    <>
      <span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-medium text-primary dark:bg-primary/20">
        <RiCheckDoubleLine className="size-4" />
        {t("Approved")}
      </span>
      <span className="text-xs text-muted-foreground">{t("Hand-written visits stay on this device in the demo.")}</span>
    </>
  ) : (
    <>
      <span className="flex items-center gap-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          {t("Record instead")}
        </Button>
        <Button
          size="lg"
          disabled={!written}
          onClick={() => {
            writeUp.approve();
            toast.success(t("Note and instructions approved"));
          }}
        >
          {t("Approve")}
        </Button>
      </span>
      <span className="text-xs text-muted-foreground">
        {written ? t("Signs off the note and the instructions together.") : t("Write at least one section to approve.")}
      </span>
    </>
  );

  return (
    <VisitFrame identity={identity} actions={actions}>
      <VisitTabs
        value={tab}
        onValueChange={setTab}
        recorded={false}
        tools={
          tab === "note" ? (
            <EditorToolbar editor={writeUp.note} saving={writeUp.saving} facts={writeUp.facts} />
          ) : tab === "instructions" ? (
            <EditorToolbar editor={writeUp.handout} saving={writeUp.saving} />
          ) : null
        }
        panels={{
          context,
          transcript: null,
          note: <Note writeUp={writeUp} doctor={t("You")} manual />,
          instructions: <InstructionsSheet writeUp={writeUp} patientName={patient.name} date={f.date(demoToday)} />,
        }}
      />
    </VisitFrame>
  );
}

/**
 * Starting a visit: the patient is already chosen, so one press starts the
 * recording. Consent is asked in the room, not in a checkbox; the line under
 * the button says that pressing it confirms it was given.
 * The tabs are there from the first moment — context to add, a note and
 * instructions to come — and the recording runs in the header, so any of them
 * can be read while it does.
 *
 * The recording itself lives above this page: leaving it minimises the
 * recording to the corner rather than stopping it.
 */
export function NewVisit({ patient, identity, context, recovered }: Shared & { recovered: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const controls = useActiveRecording();
  const recordingWindow = useRecordingWindow();
  const handover = useVisitExtrasHandover();
  const [tab, setTab] = useState<VisitTab>("context");
  const [writing, setWriting] = useState(false);
  // Throwing a recording away takes two presses, never one.
  const [discarding, setDiscarding] = useState(false);
  // The recording as it was handed to the server, shown while it saves: the
  // live one is cleared at once so the corner card never outlives it.
  const [filed, setFiled] = useState<LiveRecording | null>(null);
  const [saving, startSaving] = useTransition();
  const extrasKey = `new:${patient.id}`;

  const live = controls.recording;

  if (live && live.patient.id !== patient.id) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("{name} is still being recorded", { name: live.patient.name })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Finish or discard that visit before starting one with {name}.", { name: patient.name })}
        </p>
        <Button className="mt-6" render={<Link href={`/new?patient=${live.patient.id}`} />}>
          {t("Back to the recording")}
        </Button>
      </div>
    );
  }

  if (writing) {
    return <WriteUp patient={patient} identity={identity} context={context} onBack={() => setWriting(false)} />;
  }

  const recording = live ?? filed;
  const running = recording?.phase === "recording" && !filed;

  function finish() {
    if (!live) return;
    const now = Date.now();
    const seconds = elapsedSeconds(live, now);
    const id = `r${now.toString(36)}`;
    setFiled({ ...live, phase: "paused", banked: seconds * 1000, since: null });
    controls.clear();
    // Whatever was attached while recording follows the visit to its new address.
    handover.move(extrasKey, id);
    startSaving(() =>
      saveRecording({ id, patientId: patient.id, seconds, time: clockAt(seconds), stoppedAt: now }),
    );
  }

  function discard() {
    controls.clear();
    handover.clear(extrasKey);
    toast(t("Recording discarded"));
    router.push("/");
  }

  const actions = !recording ? (
    <>
      {/* As tall as the recording bar that takes its place, so starting moves nothing. */}
      <Button
        size="lg"
        className="h-11.5 px-5 has-data-[icon=inline-start]:ps-4"
        onClick={() => {
          controls.start({ id: patient.id, name: patient.name }, recovered);
          // The click is what lets the browser open the window that keeps the recording in sight.
          recordingWindow.open();
        }}
      >
        <RiMicLine data-icon="inline-start" />
        {recovered ? t("Resume recording") : t("Start recording")}
      </Button>
      {/* Two lines on a phone, like the recording's own line that replaces it. */}
      <span className="text-xs text-muted-foreground max-sm:min-h-[2lh]">
        {recovered
          ? t("{duration} was restored from this device.", { duration: formatDuration(recovered) })
          : t("Record only with the patient's consent. Starting confirms you have it.")}
      </span>
    </>
  ) : (
    <>
      <span
        className={cn(
          "flex animate-in items-center gap-2 rounded-full border bg-background p-1 ps-4 transition-colors duration-200 fade-in-0 zoom-in-95 motion-reduce:animate-none",
          running && "border-destructive/30",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", running ? "animate-pulse bg-destructive" : "bg-muted-foreground")}
        />
        <Elapsed recording={recording} className="w-14 font-mono text-base font-medium tabular-nums" />
        <Meter live={running} className="me-1 hidden sm:flex" />
        {filed ? null : <PopOutButton />}
        <Button
          variant="ghost"
          size="icon"
          disabled={saving || Boolean(filed)}
          onClick={running ? controls.pause : controls.resume}
          aria-label={running ? t("Pause") : t("Resume")}
          title={running ? t("Pause") : t("Resume")}
        >
          {running ? <RiPauseFill /> : <RiPlayFill />}
        </Button>
        <Button disabled={saving || Boolean(filed)} onClick={finish}>
          {filed ? <Spinner data-icon="inline-start" /> : <RiStopFill data-icon="inline-start" />}
          {filed ? t("Saving") : t("Finish")}
        </Button>
      </span>
      <span className="flex items-center gap-3 text-xs text-muted-foreground max-sm:min-h-[2lh]" aria-live="polite">
        {filed
          ? t("Filing the visit — the note is written next.")
          : running
            ? recordingWindow.floating
              ? t("Recording. It stays on top in its own window, wherever you go.")
              : t("Recording. You can leave this page; it carries on in the corner.")
            : t("Paused.")}
        {filed ? null : (
          <button
            type="button"
            onClick={() => (discarding ? discard() : setDiscarding(true))}
            onBlur={() => setDiscarding(false)}
            className={cn(
              "inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline",
              discarding ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <RiDeleteBinLine className="size-3.5" />
            {discarding ? t("Discard this recording?") : t("Discard")}
          </button>
        )}
      </span>
    </>
  );

  return (
    <VisitFrame identity={identity} actions={actions}>
      <VisitTabs
        value={tab}
        onValueChange={setTab}
        marks={{
          transcript: running ? (
            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-destructive" />
          ) : null,
        }}
        panels={{
          context,
          transcript: recording ? (
            <Waiting icon={RiVoiceprintLine} title={running ? t("Listening") : t("Paused")}>
              <Meter live={running} className="mx-auto mb-4 h-8 justify-center" />
              {t("The transcript is written when you finish, with every voice in the room labelled.")}
            </Waiting>
          ) : (
            <Waiting icon={RiVoiceprintLine} title={t("Nothing recorded yet")}>
              {t("Once the visit is recorded, the conversation appears here, turn by turn.")}
            </Waiting>
          ),
          note: <NoteToCome onWrite={recording ? undefined : () => setWriting(true)} />,
          instructions: (
            <Waiting icon={RiFileList3Line} title={t("Written for {name} when you finish", { name: patient.firstName })}>
              {t("The plan in plain words, for the patient to take home. You can change any of it before you approve.")}
            </Waiting>
          ),
        }}
      />
    </VisitFrame>
  );
}
