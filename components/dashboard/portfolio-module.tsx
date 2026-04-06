"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PortfolioStatus = "available" | "staked" | "frozen";

type LocalizedText = {
  en: string;
  es: string;
  pt: string;
};

type PortfolioItem = {
  id: string;
  property: string;
  imageUrl: string;
  fraction: string;
  purchasePrice: string;
  status: PortfolioStatus;
  estimatedYield: string;
  metadata: {
    collection: string;
    tokenStandard: string;
    location: string;
    registryId?: string;
  };
  dates: {
    mintedAt: string;
    purchasedAt: string;
    stakeUnlockAt?: string;
    lastUpdateAt?: string;
  };
  recentHistory: Array<{
    date: string;
    event: LocalizedText;
    status: LocalizedText;
  }>;
  documents: Array<{
    label: LocalizedText;
    href: string;
  }>;
};

const PORTFOLIO_DATA: PortfolioItem[] = [
  {
    id: "9fK3...2Hqa",
    property: "Torre Magnolia Medellin",
    imageUrl: "/nft/torre-magnolia.svg",
    fraction: "2.50%",
    purchasePrice: "$8,500.00",
    status: "available",
    estimatedYield: "11.2% APY",
    metadata: {
      collection: "BRIDS Real Estate Series A",
      tokenStandard: "Metaplex NFT",
      location: "Medellin, CO",
      registryId: "MDE-RE-4421"
    },
    dates: {
      mintedAt: "2026-01-10",
      purchasedAt: "2026-01-12",
      lastUpdateAt: "2026-03-01"
    },
    recentHistory: [
      {
        date: "2026-03-01",
        event: { en: "Metadata update", es: "Actualizacion metadata", pt: "Atualizacao de metadata" },
        status: { en: "Completed", es: "Completado", pt: "Concluido" }
      },
      {
        date: "2026-02-20",
        event: { en: "Yield distribution", es: "Renta distribuida", pt: "Renda distribuida" },
        status: { en: "Completed", es: "Completado", pt: "Concluido" }
      }
    ],
    documents: [
      {
        label: { en: "Asset technical sheet", es: "Ficha tecnica del activo", pt: "Ficha tecnica do ativo" },
        href: "#"
      },
      {
        label: { en: "Tokenization contract", es: "Contrato de tokenizacion", pt: "Contrato de tokenizacao" },
        href: "#"
      }
    ]
  },
  {
    id: "3xPm...Q8tB",
    property: "Vista Mar Cartagena",
    imageUrl: "/nft/vista-mar.svg",
    fraction: "1.00%",
    purchasePrice: "$4,200.00",
    status: "staked",
    estimatedYield: "12.6% APY",
    metadata: {
      collection: "BRIDS Coastal Assets",
      tokenStandard: "Metaplex NFT",
      location: "Cartagena, CO",
      registryId: "CTG-RE-1040"
    },
    dates: {
      mintedAt: "2025-12-05",
      purchasedAt: "2025-12-08",
      stakeUnlockAt: "2026-04-15",
      lastUpdateAt: "2026-03-04"
    },
    recentHistory: [
      {
        date: "2026-03-04",
        event: { en: "Stake applied", es: "Stake aplicado", pt: "Stake aplicado" },
        status: { en: "In progress", es: "En curso", pt: "Em curso" }
      },
      {
        date: "2026-02-28",
        event: { en: "Claim executed", es: "Claim ejecutado", pt: "Claim executado" },
        status: { en: "Completed", es: "Completado", pt: "Concluido" }
      }
    ],
    documents: [
      {
        label: { en: "Staking conditions", es: "Condiciones de staking", pt: "Condicoes de staking" },
        href: "#"
      },
      {
        label: { en: "Property legal detail", es: "Detalle legal de propiedad", pt: "Detalhe legal da propriedade" },
        href: "#"
      }
    ]
  },
  {
    id: "6Nh1...L5eV",
    property: "Parque Central Bogota",
    imageUrl: "/nft/parque-central.svg",
    fraction: "0.75%",
    purchasePrice: "$3,100.00",
    status: "frozen",
    estimatedYield: "9.8% APY",
    metadata: {
      collection: "BRIDS Capital Core",
      tokenStandard: "Metaplex NFT",
      location: "Bogota, CO"
    },
    dates: {
      mintedAt: "2025-11-18",
      purchasedAt: "2025-12-01",
      lastUpdateAt: "2026-02-25"
    },
    recentHistory: [
      {
        date: "2026-02-25",
        event: {
          en: "Asset frozen by process",
          es: "Activo congelado por proceso",
          pt: "Ativo congelado por processo"
        },
        status: { en: "Pending", es: "Pendiente", pt: "Pendente" }
      }
    ],
    documents: [
      {
        label: {
          en: "Asset status report",
          es: "Informe de estado del activo",
          pt: "Relatorio de estado do ativo"
        },
        href: "#"
      }
    ]
  },
  {
    id: "7sQ2...Y3rN",
    property: "Riviera Norte Barranquilla",
    imageUrl: "/nft/riviera-norte.svg",
    fraction: "1.20%",
    purchasePrice: "$5,900.00",
    status: "available",
    estimatedYield: "10.9% APY",
    metadata: {
      collection: "BRIDS North Growth",
      tokenStandard: "Metaplex NFT",
      location: "Barranquilla, CO",
      registryId: "BAQ-RE-9872"
    },
    dates: {
      mintedAt: "2026-01-22",
      purchasedAt: "2026-02-03",
      lastUpdateAt: "2026-03-02"
    },
    recentHistory: [
      {
        date: "2026-03-02",
        event: { en: "Status change", es: "Cambio de estado", pt: "Mudanca de status" },
        status: { en: "Completed", es: "Completado", pt: "Concluido" }
      },
      {
        date: "2026-02-26",
        event: { en: "Accumulated yield", es: "Renta acumulada", pt: "Renda acumulada" },
        status: { en: "Completed", es: "Completado", pt: "Concluido" }
      }
    ],
    documents: [
      {
        label: { en: "Valuation summary", es: "Resumen de valuacion", pt: "Resumo de avaliacao" },
        href: "#"
      },
      {
        label: { en: "Rental information", es: "Informacion de alquiler", pt: "Informacoes de aluguel" },
        href: "#"
      }
    ]
  }
];

const STATUS_FILTERS: Array<{ value: "all" | PortfolioStatus; label: LocalizedText }> = [
  { value: "all", label: { en: "All", es: "Todos", pt: "Todos" } },
  { value: "available", label: { en: "Available", es: "Disponible", pt: "Disponivel" } },
  { value: "staked", label: { en: "Staked", es: "Staked", pt: "Staked" } },
  { value: "frozen", label: { en: "Frozen", es: "Congelado", pt: "Congelado" } }
];

function statusLabel(status: PortfolioStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "staked") {
    return t({ en: "Staked", es: "Staked", pt: "Staked" });
  }

  if (status === "frozen") {
    return t({ en: "Frozen", es: "Frozen", pt: "Frozen" });
  }

  return t({ en: "Available", es: "Disponible", pt: "Disponivel" });
}

function statusClassName(status: PortfolioStatus): string {
  if (status === "staked") {
    return "bg-indigo-500/20 text-indigo-200";
  }

  if (status === "frozen") {
    return "bg-amber-500/20 text-amber-200";
  }

  return "bg-emerald-500/20 text-emerald-200";
}

function PortfolioEmptyState({
  hasFilters,
  t
}: {
  hasFilters: boolean;
  t: ReturnType<typeof useI18n>["t"];
}): ReactElement {
  if (hasFilters) {
    return (
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "No results", es: "Sin resultados", pt: "Sem resultados" })}</h2>
        <p className="text-sm text-white/70">{t({ en: "No Fractions found with those filters. Try another status or term.", es: "No encontramos Fracciones con esos filtros. Prueba con otro estado o termino.", pt: "Nao encontramos Frações com esses filtros. Tente outro status ou termo." })}</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">{t({ en: "You do not have Fractions in your portfolio", es: "No tienes Fracciones en portfolio", pt: "Voce nao tem Frações no portfolio" })}</h2>
      <p className="text-sm text-white/70">
        {t({
          en: "When you buy your first fractional Fraction, this screen will show your positions and estimated yield.",
          es: "Cuando compres tu primer Fracción fraccionado, esta pantalla mostrara tus posiciones y su rentabilidad estimada.",
          pt: "Quando voce comprar seu primeiro Fração fracionado, esta tela mostrara suas posicoes e rentabilidade estimada."
        })}
      </p>
    </Card>
  );
}

function valueOrFallback(value: string | undefined, t: ReturnType<typeof useI18n>["t"]): string {
  return value && value.trim().length > 0
    ? value
    : t({ en: "Not available", es: "No disponible", pt: "Nao disponivel" });
}

function DetailModal({
  item,
  onClose
}: {
  item: PortfolioItem;
  onClose: () => void;
}): ReactElement {
  const { t } = useI18n();
  const canStake = item.status === "available";
  const canUnstake = item.status === "staked";
  const showOnlyYield = item.status === "frozen";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label={t({ en: "Close detail", es: "Cerrar detalle", pt: "Fechar detalhe" })}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <section className="glass-drawer-surface relative ml-auto h-full w-full overflow-y-auto md:max-w-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b1224]/85 px-4 py-3 backdrop-blur-md sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{t({ en: "Fraction detail", es: "Detalle Fracción", pt: "Detalhe Fração" })}</p>
            <h2 className="text-lg font-semibold text-white">{item.property}</h2>
          </div>
          <Button className="min-h-11" variant="ghost" onClick={onClose}>
            {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
          </Button>
        </header>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <Card className="space-y-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
              <Image alt={`NFT ${item.property}`} className="h-full w-full object-cover" height={360} src={item.imageUrl} width={640} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(item.status)}`}>{statusLabel(item.status, t)}</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">ID: {item.id}</span>
            </div>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{t({ en: "Basic metadata", es: "Metadata basica", pt: "Metadata basica" })}</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/60">{t({ en: "Collection", es: "Coleccion", pt: "Colecao" })}</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.collection, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">{t({ en: "Token standard", es: "Token standard", pt: "Padrao do token" })}</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.tokenStandard, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.location, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Registry ID</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.registryId, t)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{t({ en: "Relevant dates", es: "Fechas relevantes", pt: "Datas relevantes" })}</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/60">{t({ en: "Minted", es: "Minted", pt: "Minted" })}</dt>
                <dd className="text-white">{valueOrFallback(item.dates.mintedAt, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">{t({ en: "Purchase", es: "Compra", pt: "Compra" })}</dt>
                <dd className="text-white">{valueOrFallback(item.dates.purchasedAt, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">{t({ en: "Stake unlock", es: "Unlock stake", pt: "Unlock stake" })}</dt>
                <dd className="text-white">{valueOrFallback(item.dates.stakeUnlockAt, t)}</dd>
              </div>
              <div>
                <dt className="text-white/60">{t({ en: "Last update", es: "Ultima actualizacion", pt: "Ultima atualizacao" })}</dt>
                <dd className="text-white">{valueOrFallback(item.dates.lastUpdateAt, t)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{t({ en: "Recent history", es: "Historial reciente", pt: "Historico recente" })}</h3>
            {item.recentHistory.length === 0 ? (
              <p className="text-sm text-white/70">{t({ en: "No recent events.", es: "Sin eventos recientes.", pt: "Sem eventos recentes." })}</p>
            ) : (
              <ul className="space-y-2">
                {item.recentHistory.map((entry) => (
                  <li key={`${entry.date}-${entry.event.es}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="font-medium text-white">{t(entry.event)}</p>
                    <p className="text-white/70">
                      {entry.date} · {t(entry.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{t({ en: "Asset documents and links", es: "Documentos y enlaces del activo", pt: "Documentos e links do ativo" })}</h3>
            {item.documents.length === 0 ? (
              <p className="text-sm text-white/70">{t({ en: "No documents available for this asset.", es: "No hay documentos disponibles para este activo.", pt: "Nao ha documentos disponiveis para este ativo." })}</p>
            ) : (
              <ul className="space-y-1">
                {item.documents.map((doc) => (
                  <li key={doc.label.es}>
                    <Link className="text-sm text-cyan-300 hover:text-cyan-200" href={doc.href}>
                      {t(doc.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 border-amber-400/30 bg-amber-500/5">
            <p className="text-sm text-amber-100">
              {t({
                en: "Notice: when an Fraction enters staking, transfers are blocked until unlock period ends.",
                es: "Aviso: si un Fracción entra en staking, las transferencias quedan bloqueadas hasta el periodo de desbloqueo.",
                pt: "Aviso: se um Fração entra em staking, as transferencias ficam bloqueadas ate o periodo de desbloqueio."
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {canStake && (
                <Button className="min-h-11" variant="primary">
                  Stake
                </Button>
              )}
              {canUnstake && (
                <Button className="min-h-11" variant="outline">
                  Unstake
                </Button>
              )}
              {(showOnlyYield || canStake || canUnstake) && (
                <Link
                  className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-sm text-white/90 hover:bg-white/10"
                  href="/protected/rentas"
                >
                  {t({ en: "View yield", es: "Ver rentas", pt: "Ver rendas" })}
                </Link>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function PortfolioModule(): ReactElement {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const forceEmpty = searchParams.get("state") === "empty";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PortfolioStatus>("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const sourceData = useMemo(() => (forceEmpty ? [] : PORTFOLIO_DATA), [forceEmpty]);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredData = useMemo(() => {
    return sourceData.filter((item) => {
      const statusMatches = statusFilter === "all" || item.status === statusFilter;
      const searchMatches =
        normalizedSearch.length === 0 ||
        item.property.toLowerCase().includes(normalizedSearch) ||
        item.id.toLowerCase().includes(normalizedSearch);

      return statusMatches && searchMatches;
    });
  }, [normalizedSearch, sourceData, statusFilter]);

  const hasFilters = normalizedSearch.length > 0 || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Fraction assets", es: "Activos Fracción", pt: "Ativos Fração" })}</h2>
        <p className="text-sm text-white/70">{t({ en: "Filter by status or search by property and ID to find a position quickly.", es: "Filtra por estado o busca por propiedad e ID para ubicar una posicion rapido.", pt: "Filtre por status ou busque por propriedade e ID para localizar uma posicao rapidamente." })}</p>
        <div className="grid gap-3 md:grid-cols-[1fr,auto]">
          <Input
            aria-label={t({ en: "Search Fraction by property or ID", es: "Buscar Fracción por propiedad o ID", pt: "Buscar Fração por propriedade ou ID" })}
            placeholder={t({ en: "Search by property or ID...", es: "Buscar por propiedad o ID...", pt: "Buscar por propriedade ou ID..." })}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filterOption) => {
              const active = statusFilter === filterOption.value;
              return (
                <Button
                  key={filterOption.value}
                  className="min-h-11"
                  variant={active ? "primary" : "ghost"}
                  onClick={() => setStatusFilter(filterOption.value)}
                >
                  {t(filterOption.label)}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {filteredData.length === 0 ? (
        <PortfolioEmptyState hasFilters={hasFilters} t={t} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredData.map((item) => (
            <Card key={item.id} className="space-y-3">
              <button
                aria-label={t({ en: `View detail for ${item.property}`, es: `Ver detalle de ${item.property}`, pt: `Ver detalhe de ${item.property}` })}
                className="relative block aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60"
                onClick={() => setSelectedItem(item)}
                type="button"
              >
                <Image
                  alt={`NFT ${item.property}`}
                  className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
                  height={360}
                  priority={false}
                  src={item.imageUrl}
                  width={640}
                />
              </button>

              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.property}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(item.status)}`}>
                  {statusLabel(item.status, t)}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-white/60">NFT ID</dt>
                  <dd className="mt-1 font-medium text-white">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-white/60">{t({ en: "Quantity / Fraction", es: "Cantidad / Fraccion", pt: "Quantidade / Fracao" })}</dt>
                  <dd className="mt-1 font-medium text-white">{item.fraction}</dd>
                </div>
                <div>
                  <dt className="text-white/60">{t({ en: "Purchase price", es: "Precio de compra", pt: "Preco de compra" })}</dt>
                  <dd className="mt-1 font-medium text-white">{item.purchasePrice}</dd>
                </div>
                <div>
                  <dt className="text-white/60">{t({ en: "Estimated yield", es: "Rentabilidad estimada", pt: "Rentabilidade estimada" })}</dt>
                  <dd className="mt-1 font-medium text-emerald-300">{item.estimatedYield}</dd>
                </div>
              </dl>

              <Button className="min-h-11 w-full" variant="outline" onClick={() => setSelectedItem(item)}>
                {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
