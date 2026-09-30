import Link from "next/link";
import { notFound } from "next/navigation";
import { RiAddLine, RiFileTextLine } from "@remixicon/react";
import { getI18n } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Allergies } from "@/components/allergies";
import { Eyebrow, Facts, Page, SectionHead } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { PatientContext } from "@/components/patient-context";
import { VisitHistory } from "./visit-history";

export default async function Profile({
  params,
}: PageProps<"/patients/[patientId]">) {
  const { patientId } = await params;
  const { t, f, demo } = await getI18n();
  const patient = demo.getPatient(patientId);

  if (!patient) notFound();

  const history = demo.getVisitsForPatient(patient.id);
  const approved = history.filter((visit) => visit.status === "approved").length;
  const waiting = history.filter(
    (visit) => visit.status === "ready" || visit.status === "failed",
  ).length;
  const last = history[0];

  return (
    <Page className="space-y-8">
      {/*
        Identity is stated once, here. Nothing below repeats the date of birth
        or the age; the allergies sit beside the name, as they do on every visit.
      */}
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PatientAvatar initials={f.initials(patient.name)} size="lg" tone="primary" />
          <div className="min-w-0">
            <Eyebrow>{t("Patient record")}</Eyebrow>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
                {patient.name}
              </h1>
              <Allergies patientId={patient.id} />
            </div>
            {/* Record data, so it is set in the mono face like every other readout. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
              <span>{t("DOB {dob}", { dob: f.date(patient.born) })}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/60" />
              <span>{t("{age} years", { age: f.age(patient.born) })}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/60" />
              <span>{t("Registered {when}", { when: f.month(patient.registered) })}</span>
            </div>
          </div>
        </div>

        <Button className="shrink-0" render={<Link href={`/new?patient=${patient.id}`} />}>
          <RiAddLine data-icon="inline-start" />
          {t("New visit")}
        </Button>
      </header>

      <Facts
        items={[
          { label: t("Visits"), value: history.length },
          { label: t("Approved notes"), value: approved },
          {
            label: t("Needs you"),
            value: waiting ? (
              <span className="text-warning">{waiting}</span>
            ) : (
              <span className="text-muted-foreground">{t("None")}</span>
            ),
          },
          { label: t("Last seen"), value: last ? f.date(last.day, "short") : "—" },
        ]}
      />

      <section className="space-y-6">
        <SectionHead title={t("Patient context")} meta={t("As it stands for the next visit")} />
        <PatientContext patientId={patient.id} />
      </section>

      {history.length ? <VisitHistory patient={patient} visits={history} /> : null}

      {!history.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFileTextLine />
            </EmptyMedia>
            <EmptyTitle>{t("Nothing recorded yet")}</EmptyTitle>
            <EmptyDescription>
              {t("No visits for {name} in this demo period.", { name: patient.name })}
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href={`/new?patient=${patient.id}`} />}>
            <RiAddLine data-icon="inline-start" />
            {t("Start the first visit")}
          </Button>
        </Empty>
      ) : null}
    </Page>
  );
}
