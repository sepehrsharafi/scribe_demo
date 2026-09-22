import Link from "next/link";
import { RiMicLine } from "@remixicon/react";
import { toVisitFilter } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Page, PageHead } from "@/components/page-layout";
import { getI18n } from "@/lib/i18n/server";
import { VisitList } from "./visit-list";

export default async function Visits({ searchParams }: PageProps<"/visits">) {
  const { filter } = await searchParams;
  const { t } = await getI18n();

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={t("Clinical worklist")}
        title={t("Visits")}
        description={t("Every consultation from captured audio through to a signed clinical note.")}
        actions={
          <Button render={<Link href="/new" />}>
            <RiMicLine data-icon="inline-start" />
            {t("New consultation")}
          </Button>
        }
      />
      <VisitList initialFilter={toVisitFilter(filter)} />
    </Page>
  );
}
