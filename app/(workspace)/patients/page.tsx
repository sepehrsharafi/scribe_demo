import Link from "next/link";
import { RiMicLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Page, PageHead } from "@/components/page-layout";
import { getI18n } from "@/lib/i18n/server";
import { PatientList } from "./patient-list";

export default async function Patients() {
  const { t } = await getI18n();

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={t("Records")}
        title={t("Patients")}
        description={t("Only what is needed to group consultations: a name and a date of birth.")}
        actions={
          <Button render={<Link href="/new" />}>
            <RiMicLine data-icon="inline-start" />
            {t("New consultation")}
          </Button>
        }
      />
      <PatientList />
    </Page>
  );
}
