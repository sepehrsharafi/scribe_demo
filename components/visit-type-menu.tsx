"use client";

import { RiArrowDownSLine } from "@remixicon/react";
import { useOptimistic, useTransition } from "react";
import type { VisitType } from "@/lib/demo-data";
import { setVisitType } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n-provider";

/**
 * The kind of visit, said quietly in the header and changed in one click:
 * Scribe's guess is only a starting point, the doctor has the last word.
 */
export function VisitTypeMenu({
  visitId,
  value,
  options,
}: {
  visitId: string;
  value: VisitType;
  /** Every type, named in the current language. */
  options: { value: VisitType; label: string }[];
}) {
  const { t } = useI18n();
  const [, startTransition] = useTransition();
  const [type, setType] = useOptimistic(value);

  function choose(next: VisitType) {
    startTransition(async () => {
      setType(next);
      await setVisitType(visitId, next);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            title={t("Visit type")}
            className="-mx-1 h-6 gap-0.5 px-1 font-normal text-muted-foreground"
          />
        }
      >
        {options.find((option) => option.value === type)?.label}
        <RiArrowDownSLine />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={type} onValueChange={(next) => choose(next as VisitType)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
