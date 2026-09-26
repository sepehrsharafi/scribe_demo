"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** A titled block in the rail beside the capture screens. */
export function SidePanel({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="font-mono text-2xs tracking-[0.14em] uppercase">
          {t(title)}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
