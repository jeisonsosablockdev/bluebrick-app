import type { ReactElement } from "react";

import { AdminCollectionBlockchainAddressCard } from "@/components/admin/admin-collection-blockchain-address-card";
import { AdminCollectionDetailSectionShell } from "@/components/admin/admin-collection-detail-section-primitives";
import type { AdminCollectionBlockchainPanel } from "@/lib/admin/collection-blockchain-panel";
import { localize, type AppLocale } from "@/lib/i18n";

function SectionHeading({
  label
}: {
  label: string;
}): ReactElement {
  return <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>;
}

function ReadOnlyBadge({
  locale
}: {
  locale: AppLocale;
}): ReactElement {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
      {localize(locale, {
        en: "Read-only blockchain state",
        es: "Estado blockchain read-only",
        pt: "Estado blockchain read-only"
      })}
    </span>
  );
}

function ValueCard({
  label,
  value,
  emptyLabel,
  valueClassName = "text-sm font-medium text-white/85"
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
  valueClassName?: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className={`mt-2 break-all ${valueClassName}`}>{value ?? emptyLabel}</p>
    </div>
  );
}

function AddressCard({
  locale,
  label,
  value,
  emptyLabel
}: {
  locale: AppLocale;
  label: string;
  value: string | null;
  emptyLabel: string;
}): ReactElement {
  return (
    <AdminCollectionBlockchainAddressCard
      copiedLabel={localize(locale, { en: "Copied", es: "Copiado", pt: "Copiado" })}
      copyLabel={localize(locale, { en: "Copy address", es: "Copiar address", pt: "Copiar address" })}
      emptyLabel={emptyLabel}
      label={label}
      openLabel={localize(locale, { en: "View on Solscan", es: "Ver en Solscan", pt: "Ver no Solscan" })}
      value={value}
    />
  );
}

function formatBps(value: number | null): string | null {
  return value === null ? null : `${value} bps`;
}

function formatBoolean(value: boolean | null, locale: AppLocale): string | null {
  if (value === null) {
    return null;
  }

  return localize(locale, {
    en: value ? "Enabled" : "Disabled",
    es: value ? "Activo" : "Desactivado",
    pt: value ? "Ativo" : "Desativado"
  });
}

function formatUnixTimestamp(value: number | null): string | null {
  return value === null ? null : new Date(value * 1000).toISOString();
}

export function AdminCollectionBlockchainBasePanel({
  blockchain,
  locale
}: {
  blockchain: AdminCollectionBlockchainPanel;
  locale: AppLocale;
}): ReactElement {
  return (
    <AdminCollectionDetailSectionShell
      description={localize(locale, {
        en: "Blockchain visibility stays separate from editable marketplace content. This panel surfaces server-aggregated addresses, authority identities, guard configuration, and AppData payload fields without introducing mutation affordances.",
        es: "La visibilidad blockchain se mantiene separada del contenido editable del marketplace. Este panel expone addresses, authorities, guard configuration y campos AppData agregados en servidor sin introducir controles de mutacion.",
        pt: "A visibilidade blockchain permanece separada do conteudo editavel do marketplace. Este painel expoe enderecos, authorities, guard configuration e campos AppData agregados no servidor sem introduzir controles de mutacao."
      })}
      eyebrow={localize(locale, { en: "Blockchain v1", es: "Blockchain v1", pt: "Blockchain v1" })}
      title={localize(locale, { en: "Blockchain panel", es: "Panel blockchain", pt: "Painel blockchain" })}
      aside={<ReadOnlyBadge locale={locale} />}
    >
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {localize(locale, {
                en: "On-chain evidence handoff",
                es: "Handoff de evidencia on-chain",
                pt: "Handoff de evidencia on-chain"
              })}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-white/65">
              {localize(locale, {
                en: "Addresses and plugin state are resolved server-side from snapshots, authority registry, and canonical admin helpers so the editor never depends on client-side blockchain assumptions.",
                es: "Los addresses y el estado del plugin se resuelven server-side desde snapshots, authority registry y helpers canonicos para que el editor nunca dependa de suposiciones blockchain del cliente.",
                pt: "Os enderecos e o estado do plugin sao resolvidos no servidor a partir de snapshots, authority registry e helpers canonicos para que o editor nunca dependa de suposicoes blockchain do cliente."
              })}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueCard
              emptyLabel={localize(locale, { en: "Read-only", es: "Read-only", pt: "Read-only" })}
              label={localize(locale, { en: "Mutation access", es: "Mutation access", pt: "Mutation access" })}
              value={localize(locale, {
                en: "No write controls in this story",
                es: "Sin controles de escritura en esta story",
                pt: "Sem controles de escrita nesta story"
              })}
            />
            <ValueCard
              emptyLabel={localize(locale, { en: "Snapshot", es: "Snapshot", pt: "Snapshot" })}
              label={localize(locale, { en: "Data contract", es: "Data contract", pt: "Data contract" })}
              value={localize(locale, {
                en: "Snapshot + registry + helper normalized",
                es: "Snapshot + registry + helper normalizado",
                pt: "Snapshot + registry + helper normalizado"
              })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading
          label={localize(locale, { en: "Base addresses", es: "Direcciones base", pt: "Enderecos base" })}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Collection address", es: "Collection address", pt: "Collection address" })}
            value={blockchain.baseAddresses.collectionAddress}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Candy machine address", es: "Candy machine address", pt: "Candy machine address" })}
            value={blockchain.baseAddresses.candyMachineAddress}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, {
              en: "Snapshot has not exposed an asset mint yet.",
              es: "El snapshot aun no expone un asset mint.",
              pt: "O snapshot ainda nao expoe um asset mint."
            })}
            label={localize(locale, { en: "Asset mint address", es: "Asset mint address", pt: "Asset mint address" })}
            value={blockchain.baseAddresses.assetMintAddress}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <SectionHeading
          label={localize(locale, { en: "Visible authorities", es: "Authorities visibles", pt: "Authorities visiveis" })}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not configured", es: "No configurado", pt: "Nao configurado" })}
            label={localize(locale, { en: "Third-party signer", es: "Third-party signer", pt: "Third-party signer" })}
            value={blockchain.authorities.thirdPartySigner}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not configured", es: "No configurado", pt: "Nao configurado" })}
            label={localize(locale, { en: "Freeze delegate", es: "Freeze delegate", pt: "Freeze delegate" })}
            value={blockchain.authorities.freezeDelegate}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Registry missing", es: "Falta en registry", pt: "Registry ausente" })}
            label={localize(locale, { en: "Transfer delegate", es: "Transfer delegate", pt: "Transfer delegate" })}
            value={blockchain.authorities.transferDelegate}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Registry missing", es: "Falta en registry", pt: "Registry ausente" })}
            label={localize(locale, { en: "Appdata authority", es: "Appdata authority", pt: "Appdata authority" })}
            value={blockchain.authorities.appdataAuthority}
          />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <SectionHeading
          label={localize(locale, { en: "Guard fields", es: "Guard fields", pt: "Guard fields" })}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <ValueCard
            emptyLabel={localize(locale, { en: "Not configured", es: "No configurado", pt: "Nao configurado" })}
            label={localize(locale, { en: "Start date", es: "Start date", pt: "Start date" })}
            value={blockchain.guards.startDateIso}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not configured", es: "No configurado", pt: "Nao configurado" })}
            label={localize(locale, { en: "Token payment mint", es: "Token payment mint", pt: "Token payment mint" })}
            value={blockchain.guards.tokenPaymentMint}
          />
          <AddressCard
            locale={locale}
            emptyLabel={localize(locale, { en: "Not configured", es: "No configurado", pt: "Nao configurado" })}
            label={localize(locale, { en: "Token payment destination", es: "Token payment destination", pt: "Token payment destination" })}
            value={blockchain.guards.tokenPaymentDestination}
          />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <SectionHeading
          label={localize(locale, {
            en: "AppData economic fields",
            es: "Campos economicos AppData",
            pt: "Campos economicos AppData"
          })}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Revenue share", es: "Revenue share", pt: "Revenue share" })}
            value={formatBps(blockchain.appdata.revenueShareBps)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Yield", es: "Yield", pt: "Yield" })}
            value={formatBps(blockchain.appdata.yieldBps)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Yield mode", es: "Yield mode", pt: "Yield mode" })}
            value={blockchain.appdata.yieldMode}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Locked at", es: "Locked at", pt: "Locked at" })}
            value={formatUnixTimestamp(blockchain.appdata.lockedAt)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Eligible from", es: "Eligible from", pt: "Eligible from" })}
            value={formatUnixTimestamp(blockchain.appdata.eligibleFrom)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Earning start", es: "Earning start", pt: "Earning start" })}
            value={formatUnixTimestamp(blockchain.appdata.earningStartTs)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Distribution", es: "Distribution", pt: "Distribution" })}
            value={formatBoolean(blockchain.appdata.distributionEnabled, locale)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Economic version", es: "Economic version", pt: "Economic version" })}
            value={blockchain.appdata.economicVersion}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Last updated at", es: "Last updated at", pt: "Last updated at" })}
            value={formatUnixTimestamp(blockchain.appdata.lastUpdatedAt)}
          />
          <ValueCard
            emptyLabel={localize(locale, { en: "Not available", es: "No disponible", pt: "Indisponivel" })}
            label={localize(locale, { en: "Updated by", es: "Updated by", pt: "Updated by" })}
            value={blockchain.appdata.updatedBy}
          />
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
