"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PortfolioStatus = "available" | "staked" | "frozen";

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
    event: string;
    status: string;
  }>;
  documents: Array<{
    label: string;
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
      { date: "2026-03-01", event: "Actualizacion metadata", status: "Completado" },
      { date: "2026-02-20", event: "Renta distribuida", status: "Completado" }
    ],
    documents: [
      { label: "Ficha tecnica del activo", href: "#" },
      { label: "Contrato de tokenizacion", href: "#" }
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
      { date: "2026-03-04", event: "Stake aplicado", status: "En curso" },
      { date: "2026-02-28", event: "Claim ejecutado", status: "Completado" }
    ],
    documents: [
      { label: "Condiciones de staking", href: "#" },
      { label: "Detalle legal de propiedad", href: "#" }
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
    recentHistory: [{ date: "2026-02-25", event: "Activo congelado por proceso", status: "Pendiente" }],
    documents: [{ label: "Informe de estado del activo", href: "#" }]
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
      { date: "2026-03-02", event: "Cambio de estado", status: "Completado" },
      { date: "2026-02-26", event: "Renta acumulada", status: "Completado" }
    ],
    documents: [
      { label: "Resumen de valuacion", href: "#" },
      { label: "Informacion de alquiler", href: "#" }
    ]
  }
];

const STATUS_FILTERS: Array<{ value: "all" | PortfolioStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponible" },
  { value: "staked", label: "Staked" },
  { value: "frozen", label: "Frozen" }
];

function statusLabel(status: PortfolioStatus): string {
  if (status === "staked") {
    return "Staked";
  }

  if (status === "frozen") {
    return "Frozen";
  }

  return "Disponible";
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

function PortfolioEmptyState({ hasFilters }: { hasFilters: boolean }): ReactElement {
  if (hasFilters) {
    return (
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Sin resultados</h2>
        <p className="text-sm text-white/70">No encontramos NFTs con esos filtros. Prueba con otro estado o termino.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">No tienes NFTs en portfolio</h2>
      <p className="text-sm text-white/70">
        Cuando compres tu primer NFT fraccionado, esta pantalla mostrara tus posiciones y su rentabilidad estimada.
      </p>
    </Card>
  );
}

function valueOrFallback(value: string | undefined): string {
  return value && value.trim().length > 0 ? value : "No disponible";
}

function DetailModal({
  item,
  onClose
}: {
  item: PortfolioItem;
  onClose: () => void;
}): ReactElement {
  const canStake = item.status === "available";
  const canUnstake = item.status === "staked";
  const showOnlyRentas = item.status === "frozen";

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Cerrar detalle" className="absolute inset-0 bg-black/70" onClick={onClose} type="button" />

      <section className="relative ml-auto h-full w-full overflow-y-auto border-l border-white/10 bg-[#070b14] md:max-w-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Detalle NFT</p>
            <h2 className="text-lg font-semibold text-white">{item.property}</h2>
          </div>
          <Button className="min-h-11" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <Card className="space-y-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
              <Image alt={`NFT ${item.property}`} className="h-full w-full object-cover" height={360} src={item.imageUrl} width={640} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(item.status)}`}>{statusLabel(item.status)}</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">ID: {item.id}</span>
            </div>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Metadata basica</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/60">Coleccion</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.collection)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Token standard</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.tokenStandard)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Ubicacion</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.location)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Registry ID</dt>
                <dd className="text-white">{valueOrFallback(item.metadata.registryId)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Fechas relevantes</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/60">Minted</dt>
                <dd className="text-white">{valueOrFallback(item.dates.mintedAt)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Compra</dt>
                <dd className="text-white">{valueOrFallback(item.dates.purchasedAt)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Unlock Stake</dt>
                <dd className="text-white">{valueOrFallback(item.dates.stakeUnlockAt)}</dd>
              </div>
              <div>
                <dt className="text-white/60">Ultima actualizacion</dt>
                <dd className="text-white">{valueOrFallback(item.dates.lastUpdateAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Historial reciente</h3>
            {item.recentHistory.length === 0 ? (
              <p className="text-sm text-white/70">Sin eventos recientes.</p>
            ) : (
              <ul className="space-y-2">
                {item.recentHistory.map((entry) => (
                  <li key={`${entry.date}-${entry.event}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="font-medium text-white">{entry.event}</p>
                    <p className="text-white/70">
                      {entry.date} · {entry.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Documentos y enlaces del activo</h3>
            {item.documents.length === 0 ? (
              <p className="text-sm text-white/70">No hay documentos disponibles para este activo.</p>
            ) : (
              <ul className="space-y-1">
                {item.documents.map((doc) => (
                  <li key={doc.label}>
                    <Link className="text-sm text-cyan-300 hover:text-cyan-200" href={doc.href}>
                      {doc.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 border-amber-400/30 bg-amber-500/5">
            <p className="text-sm text-amber-100">
              Aviso: si un NFT entra en staking, las transferencias quedan bloqueadas hasta el periodo de desbloqueo.
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
              {(showOnlyRentas || canStake || canUnstake) && (
                <Link
                  className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-sm text-white/90 hover:bg-white/10"
                  href="/protected/rentas"
                >
                  Ver rentas
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
        <h2 className="text-lg font-semibold text-white">Activos NFT</h2>
        <p className="text-sm text-white/70">Filtra por estado o busca por propiedad e ID para ubicar una posicion rapido.</p>
        <div className="grid gap-3 md:grid-cols-[1fr,auto]">
          <Input
            aria-label="Buscar NFT por propiedad o ID"
            placeholder="Buscar por propiedad o ID..."
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
                  {filterOption.label}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {filteredData.length === 0 ? (
        <PortfolioEmptyState hasFilters={hasFilters} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredData.map((item) => (
            <Card key={item.id} className="space-y-3">
              <button
                aria-label={`Ver detalle de ${item.property}`}
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
                  {statusLabel(item.status)}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-white/60">NFT ID</dt>
                  <dd className="mt-1 font-medium text-white">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Cantidad / Fraccion</dt>
                  <dd className="mt-1 font-medium text-white">{item.fraction}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Precio de compra</dt>
                  <dd className="mt-1 font-medium text-white">{item.purchasePrice}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Rentabilidad estimada</dt>
                  <dd className="mt-1 font-medium text-emerald-300">{item.estimatedYield}</dd>
                </div>
              </dl>

              <Button className="min-h-11 w-full" variant="outline" onClick={() => setSelectedItem(item)}>
                Ver detalle
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
