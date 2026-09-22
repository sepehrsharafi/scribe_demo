"use client";

import {
  RiArrowRightLine,
  RiArrowRightSLine,
  RiHistoryLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiUserAddLine,
} from "@remixicon/react";
import { useState, type FormEvent } from "react";
import type { Patient } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n/locales";
import type { Translate } from "@/lib/i18n/translate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Eyebrow } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { useI18n } from "@/components/i18n-provider";
import { Assurance, SidePanel } from "./side-panel";

const steps = [
  { label: "Confirm consent", detail: "One line, before anything is captured." },
  {
    label: "Record the visit",
    detail: "Elapsed time and a live level meter, nothing else.",
  },
  {
    label: "Read the draft",
    detail: "A structured note, with the transcript beside it.",
  },
];

/** Builds a patient record from the only two fields the product asks for. */
function newPatient(name: string, dob: string, locale: Locale, t: Translate): Patient {
  const trimmed = name.trim();
  return {
    id: "new-patient",
    name: trimmed,
    initials: trimmed
      .split(/\s+/)
      .map((word) => word[0])
      // Persian letters would join into a word; a zero-width non-joiner keeps them apart.
      .join(locale === "fa" ? "\u200c" : "")
      .slice(0, 2)
      .toUpperCase(),
    dob: new Date(dob).toLocaleDateString(locale === "fa" ? "fa-IR-u-nu-latn" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    age: Math.max(0, new Date().getFullYear() - new Date(dob).getFullYear()),
    registered: t("Today"),
    summary: { problems: [], medications: [], allergies: [] },
  };
}

export function PickPatient({ onSelect }: { onSelect: (patient: Patient) => void }) {
  const { t, locale, demo } = useI18n();
  const { patients } = demo;
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const search = query.trim().toLowerCase();
  const matches = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search),
  );

  function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !dob) return;
    onSelect(newPatient(name, dob, locale, t));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        {!creating ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">{t("Choose a patient")}</CardTitle>
              <Eyebrow>{t("{count} records", { count: matches.length })}</Eyebrow>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputGroup>
                <InputGroupAddon>
                  <RiSearchLine />
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Search by name")}
                  aria-label={t("Search by name")}
                />
              </InputGroup>

              <ItemGroup className="gap-1">
                {matches.map((patient) => (
                  <Item
                    key={patient.id}
                    size="sm"
                    className="cursor-pointer text-start hover:bg-muted"
                    render={<button type="button" onClick={() => onSelect(patient)} />}
                  >
                    <ItemMedia>
                      <PatientAvatar initials={patient.initials} />
                    </ItemMedia>
                    <ItemContent>
                      <span className="text-sm font-semibold">{patient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("DOB {dob}", { dob: patient.dob })} ·{" "}
                        {t("{age} years", { age: patient.age })}
                      </span>
                    </ItemContent>
                    <ItemActions className="ms-auto">
                      <RiArrowRightSLine className="size-4 text-muted-foreground rtl:-scale-x-100" />
                    </ItemActions>
                  </Item>
                ))}

                {!matches.length ? (
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyTitle>{t("No patient by that name")}</EmptyTitle>
                      <EmptyDescription>
                        {t("Add them below — a name and date of birth is all that is needed.")}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}
              </ItemGroup>

              <Separator />

              <Item
                variant="outline"
                className="cursor-pointer border-dashed text-start hover:bg-muted"
                render={<button type="button" onClick={() => setCreating(true)} />}
              >
                <ItemMedia variant="icon">
                  <RiUserAddLine />
                </ItemMedia>
                <ItemContent>
                  <span className="text-sm font-semibold">{t("Add a new patient")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("Only a name and a date of birth")}
                  </span>
                </ItemContent>
                <ItemActions className="ms-auto">
                  <RiArrowRightSLine className="size-4 text-muted-foreground rtl:-scale-x-100" />
                </ItemActions>
              </Item>
            </CardContent>
          </>
        ) : (
          /* The form is the card's only child, so it has to carry the card's
             own vertical rhythm — otherwise the first field sits on the rule. */
          <form onSubmit={create} className="flex flex-col gap-(--card-spacing)">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">{t("Add a patient")}</CardTitle>
              <Eyebrow>{t("Name and DOB only")}</Eyebrow>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-patient-name">{t("Full name")}</Label>
                  <Input
                    id="new-patient-name"
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("e.g. Amara Patel")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-patient-dob">{t("Date of birth")}</Label>
                  <Input
                    id="new-patient-dob"
                    type="date"
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                  {t("Back")}
                </Button>
                <Button type="submit" disabled={!name.trim() || !dob}>
                  {t("Add and continue")}
                  <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
                </Button>
              </div>
            </CardContent>
          </form>
        )}
      </Card>

      <aside className="space-y-4">
        <SidePanel title="What happens next">
          <ol className="grid gap-4">
            {steps.map((step, index) => (
              <li key={step.label} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-2xs tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <strong className="block text-xs font-semibold">{t(step.label)}</strong>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(step.detail)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SidePanel>

        <SidePanel title="Safeguards">
          <div className="grid gap-4">
            <Assurance
              icon={RiShieldCheckLine}
              title="Saved as you speak"
              copy="Encrypted chunks written continuously, never one fragile file."
            />
            <Assurance
              icon={RiHistoryLine}
              title="Survives a closed tab"
              copy="If the browser stops, the recording is offered back on return."
            />
          </div>
        </SidePanel>
      </aside>
    </div>
  );
}
