import type { ReactElement, ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function AdminCollectionDetailSectionShell({
  eyebrow,
  title,
  description,
  children,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
}): ReactElement {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{eyebrow}</p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="max-w-3xl text-sm leading-6 text-white/70">{description}</p>
          </div>
          {aside ?? (
            <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
              {eyebrow}
            </span>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

export function AdminCollectionDetailEmptyState({
  message
}: {
  message: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/60">
      {message}
    </div>
  );
}

export function AdminCollectionDetailTextContent({
  value,
  emptyMessage
}: {
  value: string | null;
  emptyMessage: string;
}): ReactElement {
  if (!value) {
    return <AdminCollectionDetailEmptyState message={emptyMessage} />;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-white/85">
      {value}
    </div>
  );
}
