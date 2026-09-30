"use client";

import { RiCheckDoubleLine, RiErrorWarningLine } from "@remixicon/react";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { Note as NoteRecord, VisitStatus } from "@/lib/demo-data";
import { approveNote, reopenNote, retryUpload } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { InstructionsSheet } from "@/components/instructions-sheet";
import { jumpTo, Note } from "@/components/note";
import { ProcessingSteps } from "@/components/processing-steps";
import { StatusBadge } from "@/components/status-badge";
import { useWriteUp } from "@/components/use-write-up";
import { handoutDocument, noteDocument } from "@/components/write-up-document";
import { EditorToolbar } from "@/components/write-up-editor";
import { useVisitExtras } from "@/components/visit-extras";
import { VisitFrame } from "@/components/visit-frame";
import { VisitTabs, type VisitTab } from "@/components/visit-tabs";
import { useI18n } from "@/components/i18n-provider";

/** A filed visit, as its page hands it over. Worked out on the server. */
export type VisitSummary = {
  id: string;
  status: VisitStatus;
  since?: number;
  failure?: string;
  approvedAt?: string;
  /** False for a visit written by hand: no audio, no transcript. */
  recorded: boolean;
  patientName: string;
  firstName: string;
  /** The visit's date, as the patient's instructions are dated. */
  date: string;
  /** Files the practice attached before the visit. */
  seededFiles: number;
};

type Parts = {
  visit: VisitSummary;
  now: number;
  doctor: string;
  identity: ReactNode;
  context: ReactNode;
  transcript: ReactNode;
  tab: VisitTab;
  onTab: (tab: VisitTab) => void;
};

function Count({ value, tone = "muted" }: { value: number; tone?: "muted" | "warning" }) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-2xs font-semibold tabular-nums",
        tone === "warning" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** A visit whose note is written: read it, correct it, approve it. */
function WrittenVisit({
  visit,
  note: draft,
  doctor,
  identity,
  context,
  transcript,
  tab,
  onTab,
}: Parts & { note: NoteRecord }) {
  const { t } = useI18n();
  const [, startTransition] = useTransition();
  const writeUp = useWriteUp({
    storeKey: visit.id,
    approved: visit.status === "approved",
    draft: () => ({
      note: noteDocument(draft, t, !visit.recorded),
      handout: handoutDocument({
        instructions: draft.instructions,
        firstName: visit.firstName,
        doctor,
        medicines: draft.medications.length > 0,
        t,
      }),
    }),
  });
  const { files } = useVisitExtras(visit.id);
  const { facts } = writeUp;
  const toCheck = writeUp.approved ? 0 : facts.unconfirmed + facts.uncertain;

  function approve() {
    const time = clock();
    const again = writeUp.approved;
    writeUp.approve();
    startTransition(() => approveNote(visit.id, time));
    toast.success(again ? t("Changes approved") : t("Note and instructions approved"), {
      action: again
        ? undefined
        : {
            label: t("Undo"),
            onClick: () => {
              writeUp.reopen();
              startTransition(() => reopenNote(visit.id));
            },
          },
    });
  }

  const actions = writeUp.approved ? (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-medium text-primary dark:bg-primary/20">
          <RiCheckDoubleLine className="size-4" />
          {visit.approvedAt ? t("Approved at {time}", { time: visit.approvedAt }) : t("Approved")}
        </span>
        {writeUp.edited ? (
          <Button variant="outline" size="lg" onClick={approve} disabled={facts.unconfirmed > 0}>
            {t("Approve changes")}
          </Button>
        ) : null}
      </span>
      <span className="text-xs text-muted-foreground">
        {writeUp.edited ? t("Changed since it was approved.") : t("Still editable — changes save as you type.")}
      </span>
    </>
  ) : (
    <>
      <Button size="lg" onClick={approve} disabled={facts.unconfirmed > 0}>
        <RiCheckDoubleLine data-icon="inline-start" />
        {t("Approve")}
      </Button>
      {facts.unconfirmed ? (
        <button
          type="button"
          onClick={() => {
            onTab("note");
            window.setTimeout(() => jumpTo("medications"), 80);
          }}
          className="inline-flex items-center gap-1.5 text-start text-xs font-medium text-warning underline-offset-4 hover:underline"
        >
          <RiErrorWarningLine className="size-4 shrink-0" />
          {facts.unconfirmed === 1
            ? t("Confirm 1 medication to approve")
            : t("Confirm {count} medications to approve", { count: facts.unconfirmed })}
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">{t("Signs off the note and the instructions together.")}</span>
      )}
    </>
  );

  return (
    <VisitFrame identity={identity} actions={actions}>
      <VisitTabs
        value={tab}
        onValueChange={onTab}
        recorded={visit.recorded}
        marks={{
          context: visit.seededFiles + files.length ? <Count value={visit.seededFiles + files.length} /> : null,
          note: toCheck ? <Count value={toCheck} tone="warning" /> : null,
        }}
        tools={
          tab === "note" ? (
            <EditorToolbar editor={writeUp.note} saving={writeUp.saving} facts={facts} />
          ) : tab === "instructions" ? (
            <EditorToolbar editor={writeUp.handout} saving={writeUp.saving} />
          ) : null
        }
        panels={{
          context,
          transcript,
          note: <Note writeUp={writeUp} doctor={doctor} approvedAt={visit.approvedAt} manual={!visit.recorded} />,
          instructions: <InstructionsSheet writeUp={writeUp} patientName={visit.patientName} date={visit.date} />,
        }}
      />
    </VisitFrame>
  );
}

/** A visit still on its way to a note — or stopped on the way, waiting for a retry. */
function PendingVisit({ visit, now, identity, context, tab, onTab }: Parts) {
  const [retrying, startRetry] = useTransition();
  const steps = (
    <ProcessingSteps
      since={visit.since}
      now={now}
      patientName={visit.firstName}
      failure={visit.failure}
      onRetry={() => startRetry(() => retryUpload(visit.id))}
      retrying={retrying}
    />
  );

  return (
    <VisitFrame identity={identity} actions={<StatusBadge status={visit.status} className="h-8 px-3 text-sm" />}>
      <VisitTabs
        value={tab}
        onValueChange={onTab}
        recorded={visit.recorded}
        marks={{
          note:
            visit.status === "failed" ? (
              <span aria-hidden="true" className="size-2 rounded-full bg-destructive" />
            ) : (
              <Spinner className="size-3.5 text-muted-foreground" aria-hidden="true" />
            ),
        }}
        panels={{ context, transcript: steps, note: steps, instructions: steps }}
      />
    </VisitFrame>
  );
}

/**
 * One visit, one page, from the moment its recording stops to long after it
 * is approved. The tab the doctor is on belongs to the page, so when the note
 * arrives it takes the place of the progress without moving them.
 */
export function VisitWorkspace({
  note,
  ...parts
}: Omit<Parts, "tab" | "onTab"> & { note?: NoteRecord }) {
  const [tab, setTab] = useState<VisitTab>("note");

  return note ? (
    <WrittenVisit {...parts} note={note} tab={tab} onTab={setTab} />
  ) : (
    <PendingVisit {...parts} tab={tab} onTab={setTab} />
  );
}
