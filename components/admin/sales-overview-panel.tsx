"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminSalesOverview,
  type MetricsRange,
  type SalesOverviewResponse
} from "@/lib/admin-metrics-client";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function normalizeRange(input: string): MetricsRange {
  return input === "7d" || input === "30d" ? input : "24h";
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function formatSolFromLamports(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  return `${sol.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
}

type SalesOverviewPanelProps = {
  initialData: SalesOverviewResponse | null;
  initialRange: MetricsRange;
};

export function SalesOverviewPanel({ initialData, initialRange }: SalesOverviewPanelProps) {
  const { t } = useI18n();
  const [range, setRange] = useState<MetricsRange>(initialRange);
  const [status, setStatus] = useState<string>("all");
  const [wallet, setWallet] = useState("");
  const [candyMachine, setCandyMachine] = useState("");
  const [isLoading, setIsLoading] = useState(initialData === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<SalesOverviewResponse | null>(initialData);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminSalesOverview({
        range,
        status: status === "all" ? null : status,
        wallet: wallet || null,
        candyMachine: candyMachine || null
      });
      setOverview(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load sales overview.");
    } finally {
      setIsLoading(false);
    }
  }, [candyMachine, range, status, wallet]);

  useEffect(() => {
    if (
      initialData &&
      range === initialData.meta.range &&
      status === "all" &&
      !wallet &&
      !candyMachine
    ) {
      setOverview(initialData);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    void load();
  }, [candyMachine, initialData, load, range, status, wallet]);

  const highlights = useMemo(() => {
    if (!overview) {
      return [
        t({ en: "Sales events", es: "Eventos de venta", pt: "Eventos de venda" }),
        t({ en: "Buyer wallet", es: "Wallet compradora", pt: "Wallet compradora" }),
        t({ en: "Volume and conversion", es: "Volumen y conversion", pt: "Volume e conversao" })
      ];
    }

    return overview.highlights.map((item) => `${item.label}: ${item.value}`);
  }, [overview, t]);

  const listTitle = t({
    en: "Sales overview",
    es: "Resumen de ventas",
    pt: "Resumo de vendas"
  });

  const metaBadges = overview
    ? [
        `range: ${overview.meta.range}`,
        `freshness: ${overview.meta.dataFreshness}`,
        `source: ${overview.meta.source}`,
        `lastSync: ${overview.meta.lastSyncedAt ?? "n/a"}`
      ]
    : [];

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Filters", es: "Filtros", pt: "Filtros" })}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
            value={range}
            onChange={(event) => setRange(normalizeRange(event.target.value))}
          >
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
          <select
            className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">{t({ en: "Status: all", es: "Estado: todos", pt: "Status: todos" })}</option>
            <option value="created">created</option>
            <option value="prepared">prepared</option>
            <option value="submitted">submitted</option>
            <option value="confirmed">confirmed</option>
            <option value="failed">failed</option>
          </select>
          <Input
            placeholder={t({ en: "wallet", es: "wallet", pt: "wallet" })}
            value={wallet}
            onChange={(event) => setWallet(event.target.value)}
          />
          <Input
            placeholder={t({ en: "candy machine", es: "candy machine", pt: "candy machine" })}
            value={candyMachine}
            onChange={(event) => setCandyMachine(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white"
            onClick={() => void load()}
            type="button"
          >
            {t({ en: "Apply filters", es: "Aplicar filtros", pt: "Aplicar filtros" })}
          </button>
          <button
            className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white"
            onClick={() => {
              setRange(initialRange);
              setStatus("all");
              setWallet("");
              setCandyMachine("");
            }}
            type="button"
          >
            {t({ en: "Clear filters", es: "Limpiar filtros", pt: "Limpar filtros" })}
          </button>
        </div>
      </Card>

      {isLoading && !overview ? (
        <Card className="space-y-2">
          <div className="h-6 w-44 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        </Card>
      ) : null}

      {errorMessage && !overview ? (
        <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">
            {t({ en: "Could not load sales overview", es: "No se pudo cargar el resumen de ventas", pt: "Nao foi possivel carregar o resumo de vendas" })}
          </p>
          <p className="text-sm text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      <AdminModulePlaceholder
        title={t({ en: "Sales", es: "Ventas", pt: "Vendas" })}
        subtitle={t({
          en: "Commercial tracking for NFT sales.",
          es: "Seguimiento comercial de ventas NFT.",
          pt: "Acompanhamento comercial de vendas NFT."
        })}
        highlights={highlights}
        listTitle={listTitle}
        metaBadges={metaBadges}
      >
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-white">
            {t({ en: "Recent sales", es: "Ventas recientes", pt: "Vendas recentes" })}
          </p>
          {!overview || overview.recentSales.length === 0 ? (
            <p className="text-sm text-white/70">
              {t({ en: "No sales for current filters.", es: "No hay ventas para los filtros actuales.", pt: "Sem vendas para os filtros atuais." })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/60">
                    <th className="px-2 py-2 font-medium">date</th>
                    <th className="px-2 py-2 font-medium">property</th>
                    <th className="px-2 py-2 font-medium">wallet</th>
                    <th className="px-2 py-2 font-medium">status</th>
                    <th className="px-2 py-2 font-medium">qty</th>
                    <th className="px-2 py-2 font-medium">revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentSales.map((row) => (
                    <tr key={row.attemptId} className="border-b border-white/10">
                      <td className="px-2 py-2 text-white">{formatDate(row.createdAt)}</td>
                      <td className="px-2 py-2 text-white">{row.propertyId}</td>
                      <td className="px-2 py-2 text-white">{row.walletPublicKey}</td>
                      <td className="px-2 py-2 text-white">{row.status}</td>
                      <td className="px-2 py-2 text-white">{row.quantity}</td>
                      <td className="px-2 py-2 text-white">{formatSolFromLamports(row.revenueLamports)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AdminModulePlaceholder>
    </div>
  );
}
