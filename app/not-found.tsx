import Link from "next/link";
import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <Empty className="py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiErrorWarningLine />
        </EmptyMedia>
        <EmptyTitle>{t("That record is not in this demo workspace")}</EmptyTitle>
        <EmptyDescription>
          {t("It may have been removed, or the link may be out of date.")}
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" render={<Link href="/" />}>
        <RiArrowLeftLine data-icon="inline-start" className="rtl:-scale-x-100" />
        {t("Back to today")}
      </Button>
    </Empty>
  );
}
