"use client";

import type { ComponentType, ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** A titled block in the reassurance rail beside the capture screens. */
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

/** One promise the product is making, stated plainly. */
export function Assurance({
  icon: Icon,
  title,
  copy,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <strong className="block text-xs font-semibold">{t(title)}</strong>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(copy)}</p>
      </div>
    </div>
  );
}
