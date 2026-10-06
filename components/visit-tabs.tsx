"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n-provider";

export type VisitTab = "context" | "transcript" | "note" | "instructions";

/*
 * The tabs read in the order the doctor works: what was known going in, what
 * they wrote, what the patient takes home — and last, the conversation it all
 * came from, there to check against.
 */
const tabs: { id: VisitTab; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "note", label: "Note" },
  { id: "instructions", label: "Instructions" },
  { id: "transcript", label: "Transcript" },
];

/**
 * One visit, four views of it. The strip sticks under the page's top edge so
 * the way between them never scrolls away, and the tools the open tab needs
 * stay with it in a row of their own.
 */
export function VisitTabs({
  value,
  onValueChange,
  recorded = true,
  panels,
  marks,
  tools,
}: {
  value: VisitTab;
  onValueChange: (tab: VisitTab) => void;
  /** A visit written by hand has no transcript, so it has no tab for one. */
  recorded?: boolean;
  panels: Record<VisitTab, ReactNode>;
  /** A small mark beside a tab's name for what is waiting there. */
  marks?: Partial<Record<VisitTab, ReactNode>>;
  tools?: ReactNode;
}) {
  const { t } = useI18n();
  const shown = tabs.filter((tab) => recorded || tab.id !== "transcript");

  return (
    <Tabs value={value} onValueChange={onValueChange} className="min-w-0 gap-0">
      <div className="sticky top-(--sticky-top) z-20 -mx-6 bg-background px-6 sm:-mx-10 sm:px-10">
        <TabsList
          variant="line"
          className="w-full justify-start gap-4 overflow-x-auto border-b [scrollbar-width:none] sm:gap-6"
        >
          {shown.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {t(label)}
              {marks?.[id]}
            </TabsTrigger>
          ))}
        </TabsList>
        {tools ? <div className="py-3">{tools}</div> : null}
      </div>

      {shown.map(({ id }) => (
        <TabsContent key={id} value={id} className="pt-6 pb-16">
          {panels[id]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
