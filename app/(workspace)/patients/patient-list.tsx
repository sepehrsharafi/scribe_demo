"use client";

import { RiGroupLine, RiSearchLine } from "@remixicon/react";
import { useState } from "react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PatientAvatar } from "@/components/patient-avatar";
import { Cell, RecordHead, RecordList, RecordRow, RowChevron } from "@/components/record-list";
import { useI18n } from "@/components/i18n-provider";

const columns =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[2rem_minmax(0,1fr)_4rem_minmax(0,11rem)_1.25rem]";

/** One patient as the list shows them. Worked out on the server. */
export type PatientRow = {
  id: string;
  name: string;
  initials: string;
  age: number;
  visits: number;
  last?: { day: string; reason: string };
};

export function PatientList({ rows }: { rows: PatientRow[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const search = query.trim().toLocaleLowerCase();
  const matches = rows.filter((patient) => patient.name.toLocaleLowerCase().includes(search));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="sm:max-w-80">
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search patient names")}
            aria-label={t("Search patient names")}
          />
        </InputGroup>
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("{shown} of {total}", { shown: matches.length, total: rows.length })}
        </p>
      </div>

      {matches.length ? (
        <RecordList>
          <RecordHead className={columns}>
            <span className="sm:col-span-2">{t("Patient")}</span>
            <span className="hidden text-end sm:block">{t("Visits")}</span>
            <span className="hidden text-end sm:block">{t("Last seen")}</span>
            <span className="hidden sm:block" />
          </RecordHead>

          {matches.map((patient) => {
            const { last } = patient;
            return (
              <RecordRow key={patient.id} href={`/patients/${patient.id}`} className={columns}>
                <span className="hidden sm:block">
                  <PatientAvatar initials={patient.initials} />
                </span>
                <Cell
                  primary={
                    <>
                      {patient.name}
                      <span className="ms-2 text-xs font-normal text-muted-foreground tabular-nums">
                        {t("{age} yrs", { age: patient.age })}
                      </span>
                    </>
                  }
                  // On a phone the last-seen column is hidden, so it rides under the name.
                  secondary={last ? `${last.day} · ${last.reason}` : t("No visits")}
                  secondaryClassName="sm:hidden"
                />
                <span className="hidden text-end text-sm tabular-nums sm:block">{patient.visits}</span>
                <Cell
                  className="hidden sm:grid"
                  align="end"
                  primary={last ? last.day : "—"}
                  secondary={last ? last.reason : t("No visits")}
                />
                <RowChevron />
              </RecordRow>
            );
          })}
        </RecordList>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiGroupLine />
            </EmptyMedia>
            <EmptyTitle>{t("No matching patients")}</EmptyTitle>
            <EmptyDescription>{t("Search by the name recorded on the patient record.")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
