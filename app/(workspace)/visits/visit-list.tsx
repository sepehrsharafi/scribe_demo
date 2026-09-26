"use client";

import { RiSearchLine } from "@remixicon/react";
import { useState } from "react";
import type { VisitFilter, VisitStatus } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VisitRows } from "@/components/visit-rows";

/** The worklist. The URL seeds the filter; narrowing it from here is local. */
export function VisitList({ initialFilter }: { initialFilter: VisitFilter }) {
  const { t, demo } = useI18n();
  const { getPatient, visitFilters, visits } = demo;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  const search = query.trim().toLowerCase();
  const matches = visits.filter((visit) => {
    const patient = getPatient(visit.patientId);
    const haystack = `${patient?.name ?? ""} ${visit.reason}`.toLowerCase();
    return (
      haystack.includes(search) &&
      (filter === "all" || visit.status === (filter as VisitStatus))
    );
  });

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
            placeholder={t("Search patient or reason")}
            aria-label={t("Search patient or reason")}
          />
        </InputGroup>

        <ToggleGroup
          aria-label={t("Filter visits")}
          variant="outline"
          spacing={0}
          // On a phone the four filters share the width instead of running past it.
          className="w-full sm:w-auto"
          value={[filter]}
          onValueChange={(next) => {
            if (next[0]) setFilter(next[0] as VisitFilter);
          }}
        >
          {visitFilters.map((option) => (
            <ToggleGroupItem key={option.id} value={option.id} className="flex-1 px-2 sm:flex-none sm:px-3">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {matches.length ? (
        <VisitRows visits={matches} groupByDay />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>{t("No matching visits")}</EmptyTitle>
            <EmptyDescription>
              {t("Try a different patient name, reason, or status.")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
