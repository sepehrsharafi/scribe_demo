"use client";

import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiPencilLine,
} from "@remixicon/react";
import { useState } from "react";
import type { Medication } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

type Fields = Omit<Medication, "id" | "unconfirmed">;

const columns: { field: keyof Fields; label: string }[] = [
  { field: "drug", label: "Drug" },
  { field: "dose", label: "Dose" },
  { field: "frequency", label: "Frequency" },
  { field: "duration", label: "Duration" },
];

/** One row being edited. Its fields are held here until the doctor presses Done. */
function EditingRow({
  row,
  onDone,
  onRemove,
}: {
  row: Medication;
  /** For an unconfirmed row, finishing the edit is what confirms it. */
  onDone: (fields: Fields) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [fields, setFields] = useState<Fields>({
    drug: row.drug,
    dose: row.dose,
    frequency: row.frequency,
    duration: row.duration,
  });

  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      {columns.map((column, index) => (
        <TableCell key={column.field} className="px-2 align-top">
          <Input
            autoFocus={index === 0}
            value={fields[column.field]}
            aria-label={t(column.label)}
            placeholder={t(column.label)}
            onChange={(event) => setFields({ ...fields, [column.field]: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") onDone(fields);
            }}
            className="h-9 min-w-24 rounded-lg bg-background dark:bg-background"
          />
        </TableCell>
      ))}
      <TableCell className="px-2 align-top">
        <span className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={t("Remove medication")}
            title={t("Remove medication")}
          >
            <RiDeleteBinLine />
          </Button>
          <Button size="sm" onClick={() => onDone(fields)}>
            {row.unconfirmed ? <RiCheckLine data-icon="inline-start" /> : null}
            {row.unconfirmed ? t("Confirm") : t("Done")}
          </Button>
        </span>
      </TableCell>
    </TableRow>
  );
}

/**
 * The medications as a table: drug, dose, frequency, duration. A row Scribe
 * could not be sure of is marked Unconfirmed with the reason, and the note
 * cannot be approved until the doctor has confirmed or corrected every one.
 * It sits inside the note like any other part of it, so every change is one
 * more step in the note's own undo history.
 */
export function MedicationTable({ rows, onChange }: { rows: Medication[]; onChange: (rows: Medication[]) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);

  const update = (id: string, change: (row: Medication) => Medication) =>
    onChange(rows.map((row) => (row.id === id ? change(row) : row)));

  function add() {
    const id = `added-${Date.now()}`;
    onChange([...rows, { id, drug: "", dose: "", frequency: "", duration: "" }]);
    setEditing(id);
  }

  if (!rows.length) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-4 py-3">
        <span className="text-muted-foreground">{t("None prescribed or changed.")}</span>
        <Button variant="outline" size="sm" onClick={add}>
          <RiAddLine data-icon="inline-start" />
          {t("Add medication")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.field}
                  className="h-10 text-start font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {t(column.label)}
                </TableHead>
              ))}
              <TableHead className="h-10">
                <span className="sr-only">{t("Actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) =>
              editing === row.id ? (
                <EditingRow
                  key={row.id}
                  row={row}
                  onDone={(fields) => {
                    // Finishing the edit of an unconfirmed row is what confirms it.
                    update(row.id, (item) => ({ ...item, ...fields, unconfirmed: undefined }));
                    setEditing(null);
                  }}
                  onRemove={() => {
                    onChange(rows.filter((item) => item.id !== row.id));
                    setEditing(null);
                  }}
                />
              ) : (
                <TableRow
                  key={row.id}
                  className={cn(
                    "align-top",
                    row.unconfirmed && "bg-warning/5 hover:bg-warning/10 dark:bg-warning/10",
                  )}
                >
                  <TableCell className="whitespace-normal">
                    <span className="font-semibold">{row.drug || "—"}</span>
                    {row.unconfirmed ? (
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge className="gap-1.5 bg-warning/15 px-2.5 text-warning dark:bg-warning/20">
                          <RiErrorWarningLine />
                          {t("Unconfirmed")}
                        </Badge>
                      </span>
                    ) : null}
                  </TableCell>
                  {columns.slice(1).map((column) => (
                    <TableCell key={column.field} className="whitespace-normal">
                      {row[column.field] || (
                        <span className="text-muted-foreground italic">{t("Not stated")}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <span className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(row.id)}
                        aria-label={t("Edit {drug}", { drug: row.drug || t("medication") })}
                        title={t("Edit")}
                      >
                        <RiPencilLine />
                      </Button>
                      {row.unconfirmed ? (
                        <Button size="sm" onClick={() => update(row.id, (item) => ({ ...item, unconfirmed: undefined }))}>
                          <RiCheckLine data-icon="inline-start" />
                          {t("Confirm")}
                        </Button>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>

      {/* Why each unconfirmed row is unconfirmed, in words, under the table. */}
      {rows
        .filter((row) => row.unconfirmed)
        .map((row) => (
          <p key={row.id} className="flex max-w-prose gap-2 text-xs leading-relaxed text-muted-foreground">
            <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <span className="font-semibold text-foreground">{row.drug}: </span>
              {row.unconfirmed}
            </span>
          </p>
        ))}

      <Button variant="outline" size="sm" onClick={add}>
        <RiAddLine data-icon="inline-start" />
        {t("Add medication")}
      </Button>
    </div>
  );
}
