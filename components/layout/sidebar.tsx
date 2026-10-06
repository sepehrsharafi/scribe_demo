import { visitTypeLabels } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AccountMenu } from "@/components/layout/account-menu";
import { Nav } from "@/components/layout/nav";
import { VisitList, type VisitRow } from "@/components/layout/visit-list";
import { NewVisitButton } from "@/components/new-visit-dialog";

/**
 * The sidebar is the doctor's list of visits, with the way to start the next
 * one above it. It is rendered once, by the workspace layout; the list and the
 * nav are the only parts that react to navigation.
 */
export async function AppSidebar() {
  const { t, f, dir, demo } = await getI18n();
  const { doctor } = demo;

  const rows: VisitRow[] = demo.visits.map((visit) => ({
    id: visit.id,
    patient: demo.getPatient(visit.patientId)?.name ?? "",
    reason: visit.reason,
    type: visit.reason ? t(visitTypeLabels[demo.getVisitType(visit)]) : "",
    day: f.day(visit.day),
    time: visit.time,
    status: visit.status,
  }));

  return (
    // In Farsi the sidebar sits on the reading side, which is the right.
    <Sidebar variant="inset" collapsible="offcanvas" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <NewVisitButton className="flex-1" />
          <SidebarTrigger className="text-muted-foreground rtl:-scale-x-100" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-hidden">
        <VisitList rows={rows} />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-1">
        <Nav />
        <AccountMenu
          name={doctor.name}
          specialty={doctor.specialty}
          // The title is not part of the name.
          initials={f.initials(doctor.name.replace(/^(Dr\.?|دکتر|د\.)\s+/, ""))}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
