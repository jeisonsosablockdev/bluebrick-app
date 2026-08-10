"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PortfolioDataStatus = "ready" | "partial" | "empty" | "wallet_required" | "error";
type PurchasePriceSource = "marketplace_listing_usd" | "unavailable";
type YieldSource = "marketplace_projected_net_roi" | "marketplace_annual_roi" | "unavailable";

type InvestorPortfolioPayload = {
  ok?: boolean;
  data?: InvestorPortfolio;
  error?: {
    code?: string;
    message?: string;
  };
};

type InvestorPortfolio = {
  walletPublicKey: string | null;
  accountStatus: "wallet_bound" | "wallet_required" | "session_conflict";
  positions: InvestorPortfolioPosition[];
  summary: {
    positionCount: number;
    totalOwnedQuantity: number;
    knownProjectOwnershipPctSum: number;
    knownPurchasePriceUsd: number;
  };
  dataQuality: {
    status: PortfolioDataStatus;
    degradedSources: string[];
    refreshedAt: string;
  };
};

type InvestorPortfolioPosition = {
  collectionAddress: string;
  propertyId: string;
  propertyTitle: string;
  locationLabel: string | null;
  imageUrl: string | null;
  nftIds: string[];
  nftIdPreview: string[];
  ownedQuantity: number;
  supplyTotal: number | null;
  projectOwnershipPct: number | null;
  purchasePriceUsd: number | null;
  purchasePriceSource: PurchasePriceSource;
  estimatedYieldPct: number | null;
  yieldSource: YieldSource;
  statusCounts: {
    readyToStake: number;
    readyToUnstake: number;
    syncPending: number;
    unsupported: number;
  };
  documents: Array<{
    id: string;
    label: string;
    url: string;
  }>;
};

type TranslateFn = ReturnType<typeof useI18n>["t"];

async function parseResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

async function fetchPortfolio(): Promise<InvestorPortfolio> {
  const response = await fetch("/api/protected/portfolio", {
    method: "GET",
    cache: "no-store"
  });
  const payload = await parseResponse<InvestorPortfolioPayload>(response);

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Could not load investor portfolio.");
  }

  return payload.data;
}

function formatUsd(value: number | null, t: TranslateFn): string {
  if (value === null || !Number.isFinite(value)) {
    return t({ en: "Not available yet", es: "No disponible todavia", pt: "Ainda nao disponivel" });
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatPercent(value: number | null, t: TranslateFn): string {
  if (value === null || !Number.isFinite(value)) {
    return t({ en: "Not available yet", es: "No disponible todavia", pt: "Ainda nao disponivel" });
  }

  return `${value.toFixed(2)}%`;
}

function priceSourceLabel(source: PurchasePriceSource, t: TranslateFn): string {
  if (source === "marketplace_listing_usd") {
    return t({ en: "Marketplace listing", es: "Listing de marketplace", pt: "Listing do marketplace" });
  }

  return t({ en: "Unavailable", es: "No disponible", pt: "Nao disponivel" });
}

function yieldSourceLabel(source: YieldSource, t: TranslateFn): string {
  if (source === "marketplace_projected_net_roi") {
    return t({ en: "Projected net ROI", es: "ROI neto proyectado", pt: "ROI liquido projetado" });
  }

  if (source === "marketplace_annual_roi") {
    return t({ en: "Marketplace annual ROI", es: "ROI anual de marketplace", pt: "ROI anual do marketplace" });
  }

  return t({ en: "Unavailable", es: "No disponible", pt: "Nao disponivel" });
}

function PortfolioSkeleton(): ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={`portfolio-skeleton-${index}`} className="marketplace-depth-card space-y-2 rounded-2xl p-5">
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
          </article>
        ))}
      </div>
      <article className="marketplace-depth-card h-44 animate-pulse rounded-2xl p-5">
        <span className="sr-only">Loading portfolio positions</span>
      </article>
    </div>
  );
}

function ErrorState({ message, t }: { message: string; t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-red-400/40 bg-red-500/5">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "Could not load portfolio", es: "No se pudo cargar el portfolio", pt: "Nao foi possivel carregar o portfolio" })}
      </h2>
      <p className="text-sm text-white/80">{message}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={() => window.location.reload()}>
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </Card>
  );
}

function WalletRequiredState({ t }: { t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-cyan-400/30 bg-cyan-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Wallet required", es: "Wallet requerida", pt: "Wallet necessaria" })}</h2>
      <p className="text-sm text-white/75">
        {t({
          en: "Connect and authenticate a wallet to load collection-level portfolio holdings.",
          es: "Conecta y autentica una wallet para cargar tus posiciones de portfolio por collection.",
          pt: "Conecte e autentique uma wallet para carregar suas posicoes de portfolio por collection."
        })}
      </p>
    </Card>
  );
}

function EmptyState({ hasFilters, t }: { hasFilters: boolean; t: TranslateFn }): ReactElement {
  if (hasFilters) {
    return (
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">{t({ en: "No results", es: "Sin resultados", pt: "Sem resultados" })}</h2>
        <p className="text-sm text-white/70">
          {t({
            en: "No portfolio positions match this search.",
            es: "Ninguna posicion de portfolio coincide con esta busqueda.",
            pt: "Nenhuma posicao de portfolio corresponde a esta busca."
          })}
        </p>
      </article>
    );
  }

  return (
    <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "No BRIDS portfolio positions yet", es: "Aun no hay posiciones BRIDS en portfolio", pt: "Ainda nao ha posicoes BRIDS no portfolio" })}
      </h2>
      <p className="text-sm text-white/70">
        {t({
          en: "This screen only shows BRIDS NFTs currently owned by the authenticated wallet and grouped by collection.",
          es: "Esta pantalla solo muestra NFTs BRIDS actualmente poseidos por la wallet autenticada y agrupados por collection.",
          pt: "Esta tela mostra apenas NFTs BRIDS atualmente possuidos pela wallet autenticada e agrupados por collection."
        })}
      </p>
      <Link href="/marketplace">
        <Button className="min-h-11" variant="primary">
          {t({ en: "Explore marketplace", es: "Explorar marketplace", pt: "Explorar marketplace" })}
        </Button>
      </Link>
    </article>
  );
}

function StatusBanner({ portfolio, t }: { portfolio: InvestorPortfolio; t: TranslateFn }): ReactElement | null {
  if (portfolio.dataQuality.status !== "partial") {
    return null;
  }

  return (
    <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
      <p className="text-sm font-semibold text-amber-100">{t({ en: "Partial portfolio data", es: "Datos parciales de portfolio", pt: "Dados parciais de portfolio" })}</p>
      <p className="text-sm text-amber-100/80">
        {t({ en: "Some marketplace enrichment is unavailable:", es: "Parte del enriquecimiento de marketplace no esta disponible:", pt: "Parte do enriquecimento de marketplace nao esta disponivel:" })}{" "}
        {portfolio.dataQuality.degradedSources.join(", ")}
      </p>
    </Card>
  );
}

function SummaryCards({ portfolio, t }: { portfolio: InvestorPortfolio; t: TranslateFn }): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Positions", es: "Posiciones", pt: "Posicoes" })}</p>
        <p className="text-2xl font-semibold text-white">{portfolio.summary.positionCount}</p>
        <p className="text-xs text-white/55">{t({ en: "Grouped by collection", es: "Agrupadas por collection", pt: "Agrupadas por collection" })}</p>
      </article>
      <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Total NFTs", es: "NFTs totales", pt: "NFTs totais" })}</p>
        <p className="text-2xl font-semibold text-white">{portfolio.summary.totalOwnedQuantity}</p>
        <p className="text-xs text-white/55">{t({ en: "Current wallet inventory", es: "Inventario actual de wallet", pt: "Inventario atual da wallet" })}</p>
      </article>
      <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Known purchase price", es: "Precio de compra conocido", pt: "Preco de compra conhecido" })}</p>
        <p className="text-2xl font-semibold text-white">{formatUsd(portfolio.summary.knownPurchasePriceUsd, t)}</p>
        <p className="text-xs text-white/55">{t({ en: "Marketplace listing basis", es: "Base listing marketplace", pt: "Base listing marketplace" })}</p>
      </article>
    </div>
  );
}

function PositionCard({ position, t }: { position: InvestorPortfolioPosition; t: TranslateFn }): ReactElement {
  return (
    <article data-testid="portfolio-position-card" className="marketplace-depth-card min-w-0 overflow-hidden rounded-2xl p-0">
      {position.imageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-slate-900/60">
          <Image
            alt={position.propertyTitle}
            className="h-full w-full object-cover"
            height={360}
            src={position.imageUrl}
            width={640}
          />
        </div>
      ) : (
        <div className="h-32 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_rgba(15,23,42,0.95)_55%,_rgba(2,6,23,1)_100%)]" />
      )}

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-white">{position.propertyTitle}</p>
          <p className="text-sm text-white/60">{position.locationLabel ?? position.collectionAddress}</p>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/60">NFT ID</dt>
            <dd className="mt-1 space-y-1 font-mono text-xs text-white">
              {position.nftIdPreview.map((nftId) => (
                <p key={nftId} className="break-all" data-testid="portfolio-nft-id">{nftId}</p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Quantity / Fraction", es: "Cantidad / Fraccion", pt: "Quantidade / Fracao" })}</dt>
            <dd className="mt-1 font-medium text-white">
              {position.ownedQuantity} {position.ownedQuantity === 1 ? "NFT" : "NFTs"} / {formatPercent(position.projectOwnershipPct, t)}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Purchase price", es: "Precio de compra", pt: "Preco de compra" })}</dt>
            <dd className="mt-1 font-medium text-white">{formatUsd(position.purchasePriceUsd, t)}</dd>
            <dd className="mt-1 text-xs text-white/50">{priceSourceLabel(position.purchasePriceSource, t)}</dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Estimated yield", es: "Rentabilidad estimada", pt: "Rentabilidade estimada" })}</dt>
            <dd className="mt-1 font-medium text-emerald-300">{formatPercent(position.estimatedYieldPct, t)}</dd>
            <dd className="mt-1 text-xs text-white/50">{yieldSourceLabel(position.yieldSource, t)}</dd>
          </div>
        </dl>

        <div className="marketplace-depth-card rounded-2xl p-4 text-xs text-white/70">
          {t({ en: "Stake state", es: "Estado stake", pt: "Estado stake" })}:{" "}
          {position.statusCounts.readyToStake} {t({ en: "ready to stake", es: "listos para stake", pt: "prontos para stake" })},{" "}
          {position.statusCounts.readyToUnstake} {t({ en: "ready to unstake", es: "listos para unstake", pt: "prontos para unstake" })},{" "}
          {position.statusCounts.syncPending} {t({ en: "sync pending", es: "sync pendiente", pt: "sync pendente" })}
        </div>

        {position.documents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {position.documents.slice(0, 3).map((document) => (
              <a
                key={document.id}
                className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-3 text-xs text-cyan-200 hover:bg-white/10"
                href={document.url}
                target="_blank"
                rel="noreferrer"
              >
                {document.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function filterPositions(positions: InvestorPortfolioPosition[], searchTerm: string): InvestorPortfolioPosition[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return positions;
  }

  return positions.filter((position) => {
    return position.propertyTitle.toLowerCase().includes(normalizedSearch)
      || position.collectionAddress.toLowerCase().includes(normalizedSearch)
      || position.nftIds.some((nftId) => nftId.toLowerCase().includes(normalizedSearch));
  });
}

export function PortfolioModule(): ReactElement {
  const { t } = useI18n();
  const [portfolio, setPortfolio] = useState<InvestorPortfolio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setIsLoading(true);
      setError(null);

      try {
        const nextPortfolio = await fetchPortfolio();
        if (!cancelled) {
          setPortfolio(nextPortfolio);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load investor portfolio.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  if (error || !portfolio) {
    return <ErrorState message={error ?? "Could not load investor portfolio."} t={t} />;
  }

  if (portfolio.accountStatus === "wallet_required") {
    return <WalletRequiredState t={t} />;
  }

  const filteredPositions = filterPositions(portfolio.positions, searchTerm);
  const hasFilters = searchTerm.trim().length > 0;

  return (
    <div className="space-y-4">
      <StatusBanner portfolio={portfolio} t={t} />
      <SummaryCards portfolio={portfolio} t={t} />

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Collection-level positions", es: "Posiciones por collection", pt: "Posicoes por collection" })}
        </h2>
        <p className="text-sm text-white/70">
          {t({
            en: "Multiple NFTs from the same collection are consolidated into one portfolio position.",
            es: "Multiples NFTs de la misma collection se consolidan en una sola posicion de portfolio.",
            pt: "Multiplos NFTs da mesma collection sao consolidados em uma unica posicao de portfolio."
          })}
        </p>
        <Input
          aria-label={t({ en: "Search portfolio by property, collection, or NFT ID", es: "Buscar portfolio por propiedad, collection o NFT ID", pt: "Buscar portfolio por propriedade, collection ou NFT ID" })}
          placeholder={t({ en: "Search property, collection, or NFT ID...", es: "Buscar propiedad, collection o NFT ID...", pt: "Buscar propriedade, collection ou NFT ID..." })}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </article>

      {filteredPositions.length === 0 ? (
        <EmptyState hasFilters={hasFilters} t={t} />
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {filteredPositions.map((position) => (
            <PositionCard key={position.collectionAddress} position={position} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
