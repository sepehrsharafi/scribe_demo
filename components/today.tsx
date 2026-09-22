"use client";

import Link from "next/link";
import {
  RiArrowRightLine,
  RiHistoryLine,
  RiMicLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { useState } from "react";
import { actionableVisits, getNote, getPatient, today, visits } from "@/lib/demo-data";
import type { Visit } from "@/lib/demo-data";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Cell,
  Eyebrow,
  Page,
  PageHead,
  PatientAvatar,
  RecordHead,
  RecordList,
  RecordRow,
  RowChevron,
  RowIndex,
  SectionHead,
  StatusBadge,
  visitRowCols,
} from "@/components/shared";

function whatIsWaiting(visit: Visit) {
  if (visit.status === "draft-ready") return "Draft ready to read";
  if (visit.status === "failed") return "Processing stopped";
  if (getNote(visit.id)) return "Signed note";
  return "Note not drafted yet";
}

function VisitRows({ items, showDate }: { items: Visit[]; showDate?: boolean }) {
  return (
    <RecordList>
      <RecordHead className={visitRowCols}>
        <span className="hidden sm:block">#</span>
        <span className="hidden sm:block" />
        <span>Patient</span>
        <span className="hidden sm:block">Consultation</span>
        <span className="hidden sm:block">Status</span>
        <span className="hidden text-right sm:block">When</span>
        <span className="hidden sm:block" />
      </RecordHead>

      {items.map((visit, index) => {
        const patient = getPatient(visit.patientId);
        return (
          <RecordRow key={visit.id} href={`/visits/${visit.id}`} className={visitRowCols}>
            <RowIndex index={index} />
            <span className="hidden sm:block">
              <PatientAvatar initials={patient?.initials ?? "–"} />
            </span>
            <Cell
              primary={patient?.name ?? "Unknown"}
              secondary={`DOB ${patient?.dob ?? "—"}`}
            />
            <Cell
              className="hidden sm:grid"
              primary={visit.reason}
              secondary={whatIsWaiting(visit)}
            />
            <span className="sm:justify-self-start">
              <StatusBadge status={visit.status} />
            </span>
            <Cell
              className="hidden sm:grid"
              align="end"
              mono
              primary={visit.time}
              secondary={showDate ? visit.date : visit.duration}
            />
            <RowChevron />
          </RecordRow>
        );
      })}
    </RecordList>
  );
}

export function Today() {
  const [recovery, setRecovery] = useState(true);

  const todays = visits.filter((visit) => visit.date === "Today");
  const signedToday = todays.filter((visit) => visit.status === "signed").length;
  const needsAction = actionableVisits.length;
  const minutes = Math.round(
    todays.reduce((total, visit) => total + visit.durationSeconds, 0) / 60,
  );

  const stats = [
    { value: todays.length, label: "Visits today" },
    { value: signedToday, label: "Signed" },
    { value: minutes, label: "Minutes captured" },
  ];

  return (
    <Page className="space-y-10">
      <PageHead
        eyebrow={`${today.weekday} · ${today.long}`}
        title="Today"
        actions={
          <Button render={<Link href="/new" />}>
            <RiMicLine data-icon="inline-start" />
            New consultation
          </Button>
        }
      />

      {recovery ? (
        <Alert className="sm:pr-56">
          <RiHistoryLine />
          <AlertTitle>A recording was recovered</AlertTitle>
          <AlertDescription>
            Maya Thompson · 08:42 captured before the browser closed.
          </AlertDescription>
          <AlertAction className="static mt-3 flex items-center gap-2 sm:absolute sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
            <Button variant="ghost" size="sm" onClick={() => setRecovery(false)}>
              Dismiss
            </Button>
            <Button size="sm" render={<Link href="/new?resume=1" />}>
              Resume visit
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col justify-between gap-8">
          <div className="flex items-start gap-5">
            <strong className="font-heading text-6xl leading-none font-bold tracking-tighter tabular-nums">
              {needsAction}
            </strong>
            <div className="space-y-2 pt-1">
              <p className="font-heading text-lg leading-snug font-medium text-balance">
                {needsAction === 1 ? "visit needs" : "visits need"} you before the day
                closes.
              </p>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                One draft is ready to read and sign. One visit stopped partway through
                processing and can be retried — the audio is safe.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-background p-4">
                <strong className="font-heading text-2xl font-bold tracking-tight tabular-nums">
                  {stat.value}
                </strong>
                <Eyebrow className="mt-1">{stat.label}</Eyebrow>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <Eyebrow>Capture</Eyebrow>
            <CardTitle className="text-xl">Start a consultation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Choose the patient, confirm consent, and press record. Cima stays out of the
            way until you have finished talking.
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button size="lg" className="w-full" render={<Link href="/new" />}>
              <RiMicLine data-icon="inline-start" />
              Select patient
            </Button>
            <Separator />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <RiShieldCheckLine className="size-3.5" /> Consent required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RiHistoryLine className="size-3.5" /> Recovery on
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>

      <section className="space-y-4">
        <SectionHead
          title="Needs your attention"
          action={
            <Button
              variant="link"
              size="sm"
              render={<Link href="/visits?filter=draft-ready" />}
            >
              Open worklist
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          }
        />
        <VisitRows items={actionableVisits} showDate />
      </section>

      <section className="space-y-4">
        <SectionHead
          title="Today’s consultations"
          action={
            <Button variant="link" size="sm" render={<Link href="/visits" />}>
              All visits
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          }
        />
        <VisitRows items={todays} />
      </section>
    </Page>
  );
}
