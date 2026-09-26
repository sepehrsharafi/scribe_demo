import Link from "next/link";
import { notFound } from "next/navigation";
import { RiFileTextLine, RiMicLine } from "@remixicon/react";
import { demo as english } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Eyebrow, Facts, Page } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { ClinicalHistory, type HistoryEntry } from "./clinical-history";

export function generateStaticParams() {
  return english("en").patients.map((patient) => ({ patientId: patient.id }));
}

export default async function Profile({
  params,
}: PageProps<"/patients/[patientId]">) {
  const { patientId } = await params;
  const { t, demo } = await getI18n();
  const patient = demo.getPatient(patientId);

  if (!patient) notFound();

  const history = demo.getVisitsForPatient(patient.id);
  const approved = history.filter((visit) => visit.status === "approved").length;
  const waiting = history.filter(
    (visit) => visit.status === "draft-ready" || visit.status === "failed",
  ).length;
  const last = history[0];

  const entries: HistoryEntry[] = patient.record.map((entry) => {
    const source = demo.getVisit(entry.visitId);
    return {
      entry,
      source,
      ended: demo.getVisit(entry.endedVisitId),
      pending: Boolean(source && source.status !== "approved"),
    };
  });

  return (
    <Page className="space-y-8">
      {/*
        Identity is stated once, here. Nothing below repeats the date of birth
        or the age.
      */}
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
          <div className="min-w-0">
            <Eyebrow>{t("Patient record")}</Eyebrow>
            <h1 className="mt-2 font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
              {patient.name}
            </h1>
            {/* Record data, so it is set in the mono face like every other readout. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
              <span>{t("DOB {dob}", { dob: patient.dob })}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/60" />
              <span>{t("{age} years", { age: patient.age })}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/60" />
              <span>{t("Registered {when}", { when: patient.registered })}</span>
            </div>
          </div>
        </div>

        <Button className="shrink-0" render={<Link href={`/new?patient=${patient.id}`} />}>
          <RiMicLine data-icon="inline-start" />
          {t("New consultation")}
        </Button>
      </header>

      <Facts
        items={[
          { label: t("Consultations"), value: history.length },
          { label: t("Approved notes"), value: approved },
          {
            label: t("Needs you"),
            value: waiting ? (
              <span className="text-warning">{waiting}</span>
            ) : (
              <span className="text-muted-foreground">{t("None")}</span>
            ),
          },
          { label: t("Last seen"), value: last ? last.dateLong : "—" },
        ]}
      />

      {history.length || entries.length ? (
        <ClinicalHistory entries={entries} visits={history} registered={patient.registered} />
      ) : null}

      {!history.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFileTextLine />
            </EmptyMedia>
            <EmptyTitle>{t("Nothing recorded yet")}</EmptyTitle>
            <EmptyDescription>
              {t("No consultations for {name} in this demo period.", { name: patient.name })}
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href={`/new?patient=${patient.id}`} />}>
            <RiMicLine data-icon="inline-start" />
            {t("Start the first consultation")}
          </Button>
        </Empty>
      ) : null}
    </Page>
  );
}
