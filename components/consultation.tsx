"use client";

import Link from "next/link";
import {
  RiErrorWarningLine,
  RiFileTextLine,
  RiHistoryLine,
  RiQuillPenLine,
  RiRefreshLine,
  RiUserLine,
  RiVoiceprintLine,
} from "@remixicon/react";
import { useState } from "react";
import type {
  NoteSection,
  NoteVersion,
  Patient,
  TranscriptLine,
  VisitStatus,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eyebrow, Facts, Page } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { StatusBadge } from "@/components/status-badge";
import { Note, NoteOutline, NoteToolbar } from "@/components/note";
import { SignDialog } from "@/components/note-sign-dialog";
import { VersionList } from "@/components/note-versions";
import { ProcessingTimeline } from "@/components/processing-timeline";
import { TranscriptView } from "@/components/transcript";
import { useNote } from "@/components/use-note";
import { useI18n } from "@/components/i18n-provider";

export type ConsultationData = {
  patient: Patient;
  reason: string;
  dateLong: string;
  time: string;
  /** Recording length. Absent on a consultation written by hand. */
  duration?: string;
  status: VisitStatus;
  failureReason?: string;
  note?: NoteSection[];
  transcript: TranscriptLine[];
  versions: NoteVersion[];
  signedAt?: string;
  /** Typed straight into the note: no audio, no transcript, no pipeline. */
  manual?: boolean;
};

/** Retrying is nothing but a spinner on this button, so it owns that state. */
function RetryButton({ size }: { size?: "sm" }) {
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);

  return (
    <Button
      size={size}
      variant="destructive"
      disabled={retrying}
      onClick={() => {
        setRetrying(true);
        window.setTimeout(() => setRetrying(false), 1600);
      }}
    >
      {retrying ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <RiRefreshLine data-icon="inline-start" />
      )}
      {size === "sm" ? t("Retry") : t("Retry processing")}
    </Button>
  );
}

/**
 * One consultation, one page. The note, the transcript it came from and the
 * trail of how it got here are views of the same record, not places to
 * navigate between. Signing it is the page's primary action.
 */
export function Consultation({ data }: { data: ConsultationData }) {
  const { t } = useI18n();
  const hasNote = Boolean(data.note?.length);
  const hasTranscript = !data.manual && data.transcript.length > 0;
  const failed = data.status === "failed";

  const [tab, setTab] = useState(
    hasNote ? "note" : hasTranscript ? "transcript" : "activity",
  );
  const [signing, setSigning] = useState(false);

  const note = useNote({
    note: data.note ?? [],
    versions: data.versions,
    signed: data.status === "signed",
  });

  const status: VisitStatus = note.signed ? "signed" : data.status;

  return (
    <Page className="space-y-8">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PatientAvatar initials={data.patient.initials} size="lg" tone="primary" />
          <div className="min-w-0">
            <Eyebrow>{t("Consultation")}</Eyebrow>
            <h1 className="mt-2 font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
              {data.reason}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                href={`/patients/${data.patient.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                <RiUserLine className="size-3.5" />
                {data.patient.name}
              </Link>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {t("{age} yrs", { age: data.patient.age })}
              </span>
            </div>
          </div>
        </div>

        {/* This is a consultation that already happened. The only thing left to
            do to it is sign it. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {failed ? <RetryButton /> : null}
          {hasNote && !note.signed ? (
            <Button onClick={() => setSigning(true)}>
              <RiQuillPenLine data-icon="inline-start" />
              {t("Sign note")}
            </Button>
          ) : null}
        </div>
      </header>

      <Facts
        items={[
          { label: t("Status"), value: <StatusBadge status={status} /> },
          { label: t("Date"), value: data.dateLong },
          { label: t("Started"), value: data.time },
          data.manual
            ? { label: t("Source"), value: t("Written by hand") }
            : { label: t("Length"), value: data.duration ?? "—" },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <TabsList variant="line">
            <TabsTrigger value="note" disabled={!hasNote}>
              <RiFileTextLine data-icon="inline-start" />
              {t("Note")}
            </TabsTrigger>
            {!data.manual ? (
              <TabsTrigger value="transcript" disabled={!hasTranscript}>
                <RiVoiceprintLine data-icon="inline-start" />
                {t("Transcript")}
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="activity">
              <RiHistoryLine data-icon="inline-start" />
              {t("Activity")}
            </TabsTrigger>
          </TabsList>

          {tab === "note" && hasNote ? <NoteToolbar note={note} /> : null}
        </div>

        <TabsContent value="note" className="pt-2">
          {hasNote ? (
            <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-32">
                  <Eyebrow>{t("Sections")}</Eyebrow>
                  <div className="mt-2">
                    <NoteOutline note={note} />
                  </div>
                </div>
              </aside>
              <Note note={note} signedAt={data.signedAt} manual={data.manual} />
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiErrorWarningLine />
                </EmptyMedia>
                <EmptyTitle>{t("No note yet")}</EmptyTitle>
                <EmptyDescription>
                  {t("A draft appears once the consultation has been transcribed. Check the Activity tab for where it has got to.")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        {!data.manual ? (
          <TabsContent value="transcript" className="pt-4">
            <TranscriptView
              transcript={data.transcript}
              duration={data.duration ?? "—"}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="activity" className="pt-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <Eyebrow>{data.manual ? t("How this note was made") : t("Processing")}</Eyebrow>
              {data.manual ? (
                <div className="rounded-2xl border px-5 py-4">
                  <strong className="text-sm font-semibold">{t("Written by hand")}</strong>
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
                    {t("This consultation was typed straight into the note. Nothing was recorded, so there was no upload, no transcript and no draft — the text below is the doctor’s own from the first word.")}
                  </p>
                </div>
              ) : (
                <ProcessingTimeline
                  status={status}
                  failureReason={data.failureReason}
                  action={failed ? <RetryButton size="sm" /> : null}
                />
              )}
            </div>

            <aside className="space-y-6">
              <div>
                <Eyebrow>{t("Versions · {count}", { count: note.versions.length })}</Eyebrow>
                <div className="mt-3">
                  {note.versions.length ? (
                    <VersionList versions={note.versions} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("Versions start once a draft has been written.")}
                    </p>
                  )}
                </div>
                {note.signed && data.signedAt ? (
                  <p className="mt-3 border-t pt-3 font-mono text-2xs text-muted-foreground">
                    {t("Signed {when}", { when: data.signedAt })}
                  </p>
                ) : null}
              </div>

              {!data.manual ? (
                <div>
                  <Eyebrow>{t("Recording")}</Eyebrow>
                  <dl className="mt-2">
                    {[
                      { label: t("Format"), value: "Opus 16 kHz" },
                      { label: t("Stored"), value: t("Encrypted") },
                      { label: t("Recoverable"), value: t("Yes") },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
                      >
                        <dt className="text-xs text-muted-foreground">{row.label}</dt>
                        <dd className="font-mono text-xs font-medium">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </aside>
          </div>
        </TabsContent>
      </Tabs>

      <SignDialog
        open={signing}
        onOpenChange={setSigning}
        sections={note.note.length}
        versions={note.versions.length}
        unsaved={note.unsaved}
        onSign={note.sign}
      />
    </Page>
  );
}
