"use client";

import Link from "next/link";
import { RiErrorWarningLine, RiFileTextLine, RiMicLine } from "@remixicon/react";
import {
  getNote,
  getPatient,
  getVisitsForPatient,
  type Visit,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Cell,
  Eyebrow,
  Facts,
  Page,
  PatientAvatar,
  RecordHead,
  RecordList,
  RecordRow,
  RowChevron,
  RowIndex,
  SectionHead,
  StatusBadge,
} from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* One template, used by the header row and every body row, so they line up. */
const cols =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 sm:grid-cols-[2rem_minmax(0,1fr)_7rem_9.5rem_4.5rem_1rem]";

function historyNote(visit: Visit) {
  if (getNote(visit.id)) {
    return visit.status === "signed" ? "Signed note" : "Draft note";
  }
  return visit.status === "failed" ? "Processing stopped" : "No note yet";
}

export function PatientProfile({ patientId }: { patientId: string }) {
  const patient = getPatient(patientId);

  if (!patient) {
    return (
      <Page>
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiErrorWarningLine />
            </EmptyMedia>
            <EmptyTitle>That patient is not in this demo workspace</EmptyTitle>
            <EmptyDescription>
              It may have been removed, or the link may be out of date.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" render={<Link href="/patients" />}>
            Back to patients
          </Button>
        </Empty>
      </Page>
    );
  }

  const visits = getVisitsForPatient(patient.id);
  const signedCount = visits.filter((visit) => visit.status === "signed").length;
  const waiting = visits.filter(
    (visit) => visit.status === "draft-ready" || visit.status === "failed",
  ).length;
  const last = visits[0];

  return (
    <Page className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList className="font-mono text-2xs tracking-[0.1em] uppercase">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/patients" />}>Patients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">{patient.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/*
        Identity is stated once, here. Nothing below repeats the date of birth,
        the age or the pronouns.
      */}
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
          <div className="min-w-0">
            <Eyebrow>Patient record</Eyebrow>
            <h1 className="mt-2 font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
              {patient.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">DOB {patient.dob}</span>
              <span aria-hidden="true" className="size-0.5 rounded-full bg-border" />
              <span className="tabular-nums">{patient.age} years</span>
              <span aria-hidden="true" className="size-0.5 rounded-full bg-border" />
              <span>{patient.pronouns}</span>
              <span aria-hidden="true" className="size-0.5 rounded-full bg-border" />
              <span>Registered {patient.registered}</span>
            </div>
          </div>
        </div>

        <Button
          className="shrink-0"
          render={<Link href={`/new?patient=${patient.id}`} />}
        >
          <RiMicLine data-icon="inline-start" />
          New consultation
        </Button>
      </header>

      <Facts
        items={[
          { label: "Consultations", value: visits.length },
          { label: "Signed notes", value: signedCount },
          {
            label: "Needs you",
            value: waiting ? (
              <span className="text-warning">{waiting}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            ),
          },
          { label: "Last seen", value: last ? last.dateLong : "—" },
        ]}
      />

      <section className="space-y-4">
        <SectionHead
          title="Consultation history"
          meta={`${visits.length} ${visits.length === 1 ? "record" : "records"}`}
        />

        {visits.length ? (
          <RecordList>
            <RecordHead className={cols}>
              <span className="hidden sm:block">#</span>
              <span>Consultation</span>
              <span className="hidden sm:block">Date</span>
              <span className="hidden sm:block">Status</span>
              <span className="text-right">Length</span>
              <span className="hidden sm:block" />
            </RecordHead>

            {visits.map((visit, index) => (
              <RecordRow key={visit.id} href={`/visits/${visit.id}`} className={cols}>
                <RowIndex index={index} />
                <Cell primary={visit.reason} secondary={historyNote(visit)} />
                <span className="hidden font-mono text-xs tabular-nums sm:block">
                  {visit.dateLong}
                </span>
                <span className="hidden sm:block">
                  <StatusBadge status={visit.status} />
                </span>
                <span className="text-right font-mono text-xs tabular-nums">
                  {visit.duration}
                </span>
                <RowChevron />
              </RecordRow>
            ))}
          </RecordList>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiFileTextLine />
              </EmptyMedia>
              <EmptyTitle>Nothing recorded yet</EmptyTitle>
              <EmptyDescription>
                No consultations for {patient.name} in this demo period.
              </EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href={`/new?patient=${patient.id}`} />}>
              <RiMicLine data-icon="inline-start" />
              Start the first consultation
            </Button>
          </Empty>
        )}

        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          This record holds a name and a date of birth. Every finding, assessment and plan
          lives in the consultation it was recorded in.
        </p>
      </section>
    </Page>
  );
}
