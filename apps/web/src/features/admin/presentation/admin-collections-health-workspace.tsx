import Link from "next/link";
import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { formatAdminDate } from "@/features/admin/presentation/admin-collection-view-format";
import type { AdminCollectionHealthRow, AdminCollectionHealthState } from "@/lib/admin/collection-health-read-model";
import type { AdminCollectionsHealthPageState } from "@/lib/admin/collections-health-page-state";
import { localize, type AppLocale } from "@/lib/i18n";

function getStateClass(healthState: AdminCollectionHealthState): string {
  switch (healthState) {
    case "manual_review_required":
      return "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100";
    case "bootstrap_failed":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "inconsistent":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "missing_snapshot":
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }
}

function getStateLabel(locale: AppLocale, healthState: AdminCollectionHealthState): string {
  switch (healthState) {
    case "manual_review_required":
      return localize(locale, { en: "Manual review", es: "Revision manual", pt: "Revisao manual" });
    case "bootstrap_failed":
      return localize(locale, { en: "Bootstrap failed", es: "Bootstrap fallido", pt: "Bootstrap falhou" });
    case "inconsistent":
      return localize(locale, { en: "Inconsistent", es: "Inconsistente", pt: "Inconsistente" });
    case "missing_snapshot":
      return localize(locale, { en: "Missing snapshot", es: "Falta snapshot", pt: "Snapshot ausente" });
  }
}

function HealthStatePanel({
  locale,
  kind,
  message
}: {
  locale: AppLocale;
  kind: "empty" | "error";
  message?: string;
}): ReactElement {
  const isError = kind === "error";

  return (
    <Card className="space-y-4">
      <div className={`rounded-2xl border p-4 ${isError ? "border-rose-300/20 bg-rose-400/10 text-rose-100" : "border-sky-300/20 bg-sky-400/10 text-sky-100"}`}>
        <p className="text-xs uppercase tracking-[0.18em]">
          {isError
            ? localize(locale, { en: "Degraded state", es: "Estado degradado", pt: "Estado degradado" })
            : localize(locale, { en: "Empty queue", es: "Cola vacia", pt: "Fila vazia" })}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {isError
            ? localize(locale, {
                en: "Collections health unavailable",
                es: "Salud de colecciones no disponible",
                pt: "Saude de colecoes indisponivel"
              })
            : localize(locale, {
                en: "No degraded collection rows",
                es: "No hay filas degradadas de colecciones",
                pt: "Nao ha linhas degradadas de colecoes"
              })}
        </p>
        <p className="mt-2 text-sm text-current/80">
          {message ??
            localize(locale, {
              en: "The read-only health queue is clear for this admin actor.",
              es: "La cola read-only de health esta vacia para este actor admin.",
              pt: "A fila read-only de health esta vazia para este ator admin."
            })}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
          href="/admin/collections"
        >
          {localize(locale, { en: "Back to collections", es: "Volver a colecciones", pt: "Voltar para colecoes" })}
        </Link>
      </div>
    </Card>
  );
}

function HealthRowCard({
  locale,
  row
}: {
  locale: AppLocale;
  row: AdminCollectionHealthRow;
}): ReactElement {
  return (
    <li className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-medium ${getStateClass(row.healthState)}`}>
              {getStateLabel(locale, row.healthState)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              {row.source === "bootstrap"
                ? localize(locale, { en: "Bootstrap", es: "Bootstrap", pt: "Bootstrap" })
                : localize(locale, { en: "Consistency", es: "Consistencia", pt: "Consistencia" })}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-white">{row.title}</p>
            <p className="text-xs text-white/50">
              {localize(locale, { en: "Checked", es: "Verificada", pt: "Verificada" })}:{" "}
              {formatAdminDate(locale, row.lastCheckedAt)}
            </p>
          </div>
        </div>
        {row.cta ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/15 sm:min-w-44"
            href={row.cta.href}
          >
            {localize(locale, { en: row.cta.label, es: "Ver contexto", pt: "Ver contexto" })}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
        {row.failureReason}
      </div>

      <div className="mt-4 grid gap-2 text-xs text-white/70">
        <p className="break-all rounded-xl border border-white/10 bg-black/10 px-3 py-2">
          <span className="text-white/45">
            {localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })}:
          </span>{" "}
          {row.collectionAddress}
        </p>
        <p className="break-all rounded-xl border border-white/10 bg-black/10 px-3 py-2">
          <span className="text-white/45">
            {localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })}:
          </span>{" "}
          {row.candyMachineAddress}
        </p>
      </div>
    </li>
  );
}

export function AdminCollectionsHealthWorkspace({
  locale,
  state
}: {
  locale: AppLocale;
  state: AdminCollectionsHealthPageState;
}): ReactElement {
  if (state.kind === "error") {
    return <HealthStatePanel kind="error" locale={locale} message={state.message} />;
  }

  if (state.kind === "empty") {
    return <HealthStatePanel kind="empty" locale={locale} />;
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Review queue", es: "Cola de revision", pt: "Fila de revisao" })}
          </p>
          <h3 className="text-sm font-semibold text-white">
            {localize(locale, { en: "Review items", es: "Items de revision", pt: "Itens de revisao" })}
          </h3>
          <p className="text-sm leading-6 text-white/70">
            {localize(locale, {
              en: "Rows here need operator context before they can return to the editable collections list.",
              es: "Las filas aqui necesitan contexto operativo antes de volver a la lista editable de colecciones.",
              pt: "As linhas aqui precisam de contexto operacional antes de voltar para a lista editavel de colecoes."
            })}
          </p>
        </div>
        <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
          {state.rows.length}{" "}
          {state.rows.length === 1
            ? localize(locale, { en: "row", es: "fila", pt: "linha" })
            : localize(locale, { en: "rows", es: "filas", pt: "linhas" })}
        </span>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
        {state.rows.map((row) => (
          <HealthRowCard key={row.entryId} locale={locale} row={row} />
        ))}
      </ul>
    </Card>
  );
}
