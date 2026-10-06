import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { WorkspaceBar } from "@/components/layout/workspace-bar";
import { ProcessingWatcher } from "@/components/processing-watcher";
import { ActiveRecordingProvider } from "@/components/active-recording";
import { NewVisitProvider } from "@/components/new-visit-dialog";
import { RecordingDock } from "@/components/recording-dock";
import { RecordingWindowProvider } from "@/components/recording-window";
import { VisitExtrasProvider } from "@/components/visit-extras";
import { getI18n } from "@/lib/i18n/server";
import { patientOptions } from "@/lib/patient-options";
import { readyAt } from "@/lib/workspace";

/** The visits from this browser still being processed, and when each will be ready. */
async function Processing() {
  const { demo } = await getI18n();
  const processing = demo.visits.flatMap((visit) =>
    visit.status === "processing" && visit.since
      ? [
          {
            visitId: visit.id,
            patientName: demo.getPatient(visit.patientId)?.name ?? "",
            readyAt: readyAt(visit.since),
          },
        ]
      : [],
  );
  return <ProcessingWatcher processing={processing} />;
}

/**
 * The chrome lives here, not in the pages. A layout is mounted once: on
 * navigation React swaps `children` and leaves the sidebar alone, so it keeps
 * its scroll and never re-renders. A recording — with the window it floats in
 * when the doctor switches tabs — and whatever was done to a visit live here
 * for the same reason: leaving a visit does not lose them.
 */
export default async function WorkspaceLayout({ children }: LayoutProps<"/">) {
  const { demo, f } = await getI18n();
  // shadcn's sidebar writes this cookie; reading it keeps a collapsed sidebar collapsed on reload.
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    // The visit extras wrap the recording: finishing one hands its files on to the new visit.
    <VisitExtrasProvider>
      <ActiveRecordingProvider>
        <RecordingWindowProvider>
          <NewVisitProvider patients={patientOptions(demo, f)}>
            <SidebarProvider defaultOpen={sidebarOpen}>
              <AppSidebar />
              {/* Sticky strips sit under the top bar when there is one. */}
              <SidebarInset className="min-w-0 [--sticky-top:3.5rem] md:peer-data-[state=expanded]:[--sticky-top:0px]">
                <WorkspaceBar />
                {children}
              </SidebarInset>
              <Processing />
              <RecordingDock />
            </SidebarProvider>
          </NewVisitProvider>
        </RecordingWindowProvider>
      </ActiveRecordingProvider>
    </VisitExtrasProvider>
  );
}
