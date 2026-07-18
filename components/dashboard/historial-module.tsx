"use client";

import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";

type StakeHistoryPayload = {
  ok?: boolean;
  data?: {
    walletPublicKey: string;
    items: StakeHistoryItem[];
  };
  error?: {
    message?: string;
  };
};

type StakeHistoryItem = {
  id: string;
  propertyTitle: string;
  productAction: "stake" | "unstake";
  txSignature: string;
  blockTime: string | null;
  observedAt: string;
  validationStatus: "pending" | "validated" | "reconcile_pending" | "rejected";
};

type ActivityStatus = "completed" | "pending" | "processing";

function pointColor(status: ActivityStatus): string {
  if (status === "completed") {
    return "#34d399";
  }

  if (status === "pending") {
    return "#fbbf24";
  }

  return "#60a5fa";
}

function toShortSignature(signature: string): string {
  if (signature.length <= 12) {
    return signature;
  }

  return `${signature.slice(0, 4)}...${signature.slice(-4)}`;
}

function toEventStatus(validationStatus: StakeHistoryItem["validationStatus"]): ActivityStatus {
  if (validationStatus === "validated") {
    return "completed";
  }

  if (validationStatus === "pending") {
    return "pending";
  }

  return "processing";
}

function typeLabel(action: StakeHistoryItem["productAction"], t: ReturnType<typeof useI18n>["t"]): string {
  return action === "stake"
    ? "Stake"
    : t({ en: "Unstake", es: "Unstake", pt: "Unstake" });
}

function statusLabel(status: ActivityStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "completed") {
    return t({ en: "Completed", es: "Completado", pt: "Concluido" });
  }

  if (status === "pending") {
    return t({ en: "Pending", es: "Pendiente", pt: "Pendente" });
  }

  return t({ en: "Processing", es: "En proceso", pt: "Em processo" });
}

async function parseResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

export function HistorialModule(): ReactElement {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const forceEmpty = searchParams.get("view") === "empty";
  const [items, setItems] = useState<StakeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/protected/profile/stake-history", {
          method: "GET",
          cache: "no-store"
        });
        const payload = await parseResponse<StakeHistoryPayload>(response);

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Could not load stake history.");
        }

        if (!cancelled) {
          setItems(payload.data.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t({
                  en: "Could not load stake history.",
                  es: "No se pudo cargar el historial de stake.",
                  pt: "Nao foi possivel carregar o historico de stake."
                })
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (forceEmpty) {
      setLoading(false);
      setItems([]);
      return () => undefined;
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [forceEmpty, t]);

  const events = useMemo(() => {
    return items.map((item, index, source) => {
      const x = source.length === 1 ? 50 : 12 + ((76 / Math.max(1, source.length - 1)) * index);
      const y = item.productAction === "stake" ? 34 : 58;

      return {
        ...item,
        status: toEventStatus(item.validationStatus),
        x,
        y,
        displayDate: item.blockTime ?? item.observedAt
      };
    });
  }, [items]);

  if (loading) {
    return (
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
        <div className="h-24 animate-pulse rounded bg-white/10" />
      </article>
    );
  }

  if (error) {
    return (
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-rose-400/30 bg-rose-500/5">
        <h2 className="text-lg font-semibold text-rose-100">
          {t({ en: "History unavailable", es: "Historial no disponible", pt: "Historico indisponivel" })}
        </h2>
        <p className="text-sm text-rose-100">{error}</p>
      </article>
    );
  }

  if (events.length === 0) {
    return (
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-dashed">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "No recent stake activity", es: "Sin actividad reciente de stake", pt: "Sem atividade recente de stake" })}
        </h2>
        <p className="text-sm text-white/75">
          {t({
            en: "You do not have validated or pending stake events in your profile history yet.",
            es: "Aun no tienes eventos de stake validados o pendientes en tu historial de perfil.",
            pt: "Voce ainda nao tem eventos de stake validados ou pendentes no historico do perfil."
          })}
        </p>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Stake history", es: "Historial de stake", pt: "Historico de stake" })}</h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Audit stake and unstake events persisted for your profile from canonically validated blockchain observations.",
            es: "Audita eventos de stake y unstake persistidos para tu perfil a partir de observaciones blockchain validadas canonicamente.",
            pt: "Audite eventos de stake e unstake persistidos para o seu perfil a partir de observacoes blockchain validadas canonicamente."
          })}
        </p>
      </article>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <p className="text-sm font-medium text-white">{t({ en: "Point chart", es: "Grafico de puntos", pt: "Grafico de pontos" })}</p>
        <div className="marketplace-depth-card rounded-2xl p-4">
          <svg aria-label={t({ en: "Stake activity chart", es: "Grafico de actividad de stake", pt: "Grafico de atividade de stake" })} className="h-60 w-full" viewBox="0 0 100 80">
            <line stroke="#334155" strokeWidth="0.4" x1="8" x2="92" y1="70" y2="70" />
            <line stroke="#334155" strokeWidth="0.4" x1="8" x2="8" y1="10" y2="70" />

            {events.map((point, index) => {
              const nextPoint = events[index + 1];
              return (
                <g key={point.id}>
                  {nextPoint ? (
                    <line
                      stroke="#475569"
                      strokeWidth="0.6"
                      x1={point.x}
                      x2={nextPoint.x}
                      y1={point.y}
                      y2={nextPoint.y}
                    />
                  ) : null}
                  <circle cx={point.x} cy={point.y} fill={pointColor(point.status)} r="2.2" />
                </g>
              );
            })}
          </svg>
        </div>
      </article>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <p className="text-sm font-medium text-white">{t({ en: "Stake timeline", es: "Timeline de stake", pt: "Timeline de stake" })}</p>
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="marketplace-depth-card rounded-2xl px-4 py-3 text-sm">
              <p className="font-medium text-white">{event.propertyTitle}</p>
              <p className="text-white/70">
                {typeLabel(event.productAction, t)} · {statusLabel(event.status, t)} · {toShortSignature(event.txSignature)}
              </p>
            </li>
          ))}
        </ul>
      </article>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <p className="text-sm font-medium text-white">{t({ en: "Simple event table", es: "Tabla simple por evento", pt: "Tabela simples por evento" })}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">{t({ en: "Property", es: "Propiedad", pt: "Propriedade" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Action", es: "Accion", pt: "Acao" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Status", es: "Estado", pt: "Status" })}</th>
                <th className="px-2 py-2 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={`table-${event.id}`} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.propertyTitle}</td>
                  <td className="px-2 py-2 text-white">{typeLabel(event.productAction, t)}</td>
                  <td className="px-2 py-2 text-white">{statusLabel(event.status, t)}</td>
                  <td className="px-2 py-2 text-cyan-200">{toShortSignature(event.txSignature)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

