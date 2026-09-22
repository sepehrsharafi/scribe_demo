import Link from "next/link";
import { notFound } from "next/navigation";
import { RiFileTextLine, RiMicLine } from "@remixicon/react";
import { demo as english, type PatientSummary } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/translate";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Eyebrow, Facts, Page, SectionHead } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { StatusBadge } from "@/components/status-badge";
import {
  Cell,
  RecordHead,
  RecordList,
  RecordRow,
  RowChevron,
  RowIndex,
} from "@/components/record-list";

/* One template, used by the header row and every body row, so they line up. */
const columns =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 sm:grid-cols-[2rem_minmax(0,1fr)_7rem_9.5rem_4.5rem_1rem]";

const summaryParts: { key: keyof PatientSummary; label: string }[] = [
  { key: "problems", label: "Problems" },
  { key: "medications", label: "Medications" },
  { key: "allergies", label: "Allergies" },
];

/** The standing picture a doctor checks before reading any single visit. */
function Summary({ summary, t }: { summary: PatientSummary; t: Translate }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
      {summaryParts.map(({ key, label }) => (
        <div key={key} className="bg-background p-4">
          <dt className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {t(label)}
          </dt>
          <dd className="mt-2">
            {summary[key].length ? (
              <ul className="space-y-1.5 text-sm">
                {summary[key].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">{t("None recorded")}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

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
  const signed = history.filter((visit) => visit.status === "signed").length;
  const waiting = history.filter(
    (visit) => visit.status === "draft-ready" || visit.status === "failed",
  ).length;
  const last = history[0];

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
              <span aria-hidden="true" className="size-0.5 rounded-full bg-border" />
              <span>{t("{age} years", { age: patient.age })}</span>
              <span aria-hidden="true" className="size-0.5 rounded-full bg-border" />
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
          { label: t("Signed notes"), value: signed },
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

      <section className="space-y-4">
        <SectionHead title={t("Clinical summary")} />
        <Summary summary={patient.summary} t={t} />
      </section>

      <section className="space-y-4">
        <SectionHead
          title={t("Consultation history")}
          meta={
            history.length === 1
              ? t("1 record")
              : t("{count} records", { count: history.length })
          }
        />

        {history.length ? (
          <RecordList>
            <RecordHead className={columns}>
              <span className="hidden sm:block">#</span>
              <span>{t("Consultation")}</span>
              <span className="hidden sm:block">{t("Date")}</span>
              <span className="hidden sm:block">{t("Status")}</span>
              <span className="text-end">{t("Length")}</span>
              <span className="hidden sm:block" />
            </RecordHead>

            {history.map((visit, index) => (
              <RecordRow key={visit.id} href={`/visits/${visit.id}`} className={columns}>
                <RowIndex index={index} />
                <Cell primary={visit.reason} />
                <span className="hidden font-mono text-xs tabular-nums sm:block">
                  {visit.dateLong}
                </span>
                <span className="hidden sm:block">
                  <StatusBadge status={visit.status} />
                </span>
                <span className="text-end font-mono text-xs tabular-nums">
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
        )}

      </section>
    </Page>
  );
}
