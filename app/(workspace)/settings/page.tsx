import { Page, PageHead } from "@/components/page-layout";
import { getI18n } from "@/lib/i18n/server";
import { SettingsForm } from "./settings-form";

export default async function Settings() {
  const { t, demo } = await getI18n();

  return (
    <Page className="max-w-3xl space-y-8">
      <PageHead
        title={t("Settings")}
        description={t("Your demo profile, capture behaviour, and note review preferences.")}
      />
      <SettingsForm doctor={demo.doctor} recoveredSeconds={demo.recovery.seconds} />
    </Page>
  );
}
