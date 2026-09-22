"use client";

import Link from "next/link";
import {
  RiArrowLeftLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiHistoryLine,
  RiMicLine,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NoteBody,
  NoteToolbar,
  SectionOutline,
  SignDialog,
  VersionList,
  useNoteState,
} from "@/components/note-editor";
import { ProgressTimeline } from "@/components/progress-timeline";
import { TranscriptView } from "@/components/transcript-panel";
import {
  Eyebrow,
  Facts,
  Page,
  PatientAvatar,
  StatusBadge,
} from "@/components/shared";

export type ConsultationData = {
  /** Absent for a consultation captured in this session and not yet filed. */
  visitId?: string;
  patient: Patient;
  reason: string;
  dateLong: string;
  time: string;
  duration: string;
  status: VisitStatus;
  failureReason?: string;
  note?: NoteSection[];
  transcript: TranscriptLine[];
  versions: NoteVersion[];
  signedAt?: string;
};

type Tab = "note" | "transcript" | "activity";

/**
 * One consultation, one page. The note, the transcript it came from and the
 * trail of how it got here are three views of the same record, not three
 * places to navigate between.
 */
export function ConsultationView({
  data,
  back = { href: "/visits", label: "Visits" },
}: {
  data: ConsultationData;
  back?: { href: string; label: string };
}) {
  const hasNote = Boolean(data.note?.length);
  const hasTranscript = data.transcript.length > 0;

  const [tab, setTab] = useState<Tab>(
    hasNote ? "note" : hasTranscript ? "transcript" : "activity",
  );
  const [showEvidence, setShowEvidence] = useState(true);
  const [signOpen, setSignOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const state = useNoteState({
    note: data.note ?? [],
    versions: data.versions,
    signed: data.status === "signed",
  });

  const failed = data.status === "failed";
  const status: VisitStatus = state.signed ? "signed" : data.status;

  return (
    <Page className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList className="font-mono text-2xs tracking-[0.1em] uppercase">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={back.href} />}>{back.label}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">{data.reason}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PatientAvatar initials={data.patient.initials} size="lg" tone="primary" />
          <div className="min-w-0">
            <Eyebrow>Consultation</Eyebrow>
            <h1 className="mt-2 font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
              {data.reason}
            </h1>
            <Link
              href={`/patients/${data.patient.id}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-primary"
            >
              <RiUserLine className="size-3.5" />
              {data.patient.name}
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {failed ? (
            <Button
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
              Retry processing
            </Button>
          ) : null}
          <Button
            variant="outline"
            render={<Link href={`/new?patient=${data.patient.id}`} />}
          >
            <RiMicLine data-icon="inline-start" />
            New consultation
          </Button>
        </div>
      </header>

      <Facts
        items={[
          { label: "Status", value: <StatusBadge status={status} /> },
          { label: "Date", value: data.dateLong },
          { label: "Started", value: data.time },
          { label: "Length", value: data.duration },
        ]}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <TabsList variant="line">
            <TabsTrigger value="note" disabled={!hasNote}>
              <RiFileTextLine data-icon="inline-start" />
              Note
            </TabsTrigger>
            <TabsTrigger value="transcript" disabled={!hasTranscript}>
              <RiVoiceprintLine data-icon="inline-start" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="activity">
              <RiHistoryLine data-icon="inline-start" />
              Activity
            </TabsTrigger>
          </TabsList>

          {tab === "note" && hasNote ? (
            <NoteToolbar
              state={state}
              showEvidence={showEvidence}
              onToggleEvidence={() => setShowEvidence((value) => !value)}
              onSign={() => setSignOpen(true)}
            />
          ) : null}
        </div>

        <TabsContent value="note" className="pt-2">
          {hasNote ? (
            <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-32">
                  <Eyebrow>Sections</Eyebrow>
                  <div className="mt-2">
                    <SectionOutline state={state} />
                  </div>
                </div>
              </aside>
              <NoteBody
                state={state}
                transcript={data.transcript}
                showEvidence={showEvidence}
                signedAt={data.signedAt}
              />
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiErrorWarningLine />
                </EmptyMedia>
                <EmptyTitle>No note yet</EmptyTitle>
                <EmptyDescription>
                  A draft appears once the consultation has been transcribed. Check the
                  Activity tab for where it has got to.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="transcript" className="pt-4">
          <TranscriptView
            transcript={data.transcript}
            note={state.note}
            duration={data.duration}
          />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <Eyebrow>Processing</Eyebrow>
              <ProgressTimeline
                status={status}
                failureReason={data.failureReason}
                action={
                  failed ? (
                    <Button
                      size="sm"
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
                      Retry
                    </Button>
                  ) : null
                }
              />
            </div>

            <aside className="space-y-6">
              <div>
                <Eyebrow>Versions · {state.versions.length}</Eyebrow>
                <div className="mt-3">
                  {state.versions.length ? (
                    <VersionList versions={state.versions} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Versions start once a draft has been written.
                    </p>
                  )}
                </div>
                {state.signed && data.signedAt ? (
                  <p className="mt-3 border-t pt-3 text-2xs text-muted-foreground">
                    Signed {data.signedAt}
                  </p>
                ) : null}
              </div>

              <div>
                <Eyebrow>Recording</Eyebrow>
                <dl className="mt-2">
                  {[
                    { label: "Format", value: "Opus 16 kHz" },
                    { label: "Stored", value: "Encrypted" },
                    { label: "Recoverable", value: "Yes" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
                    >
                      <dt className="text-xs text-muted-foreground">{row.label}</dt>
                      <dd className="text-xs font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </TabsContent>
      </Tabs>

      <SignDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        sections={state.note.length}
        versionCount={state.versions.length}
        onSign={state.sign}
      />
    </Page>
  );
}

export function ConsultationNotFound() {
  return (
    <Page>
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiErrorWarningLine />
          </EmptyMedia>
          <EmptyTitle>That consultation is not in this demo workspace</EmptyTitle>
          <EmptyDescription>
            It may have been removed, or the link may be out of date.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" render={<Link href="/visits" />}>
          <RiArrowLeftLine data-icon="inline-start" />
          Back to visits
        </Button>
      </Empty>
    </Page>
  );
}
