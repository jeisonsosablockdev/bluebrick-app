"use client";

import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";

type ActivityType = "purchase" | "stake" | "unstake" | "claim" | "status_change";
type ActivityStatus = "completed" | "pending" | "processing";

type ActivityEvent = {
  date: string;
  type: ActivityType;
  status: ActivityStatus;
  hash: string;
  x: number;
  y: number;
};

const ACTIVITY_EVENTS: ActivityEvent[] = [
  { date: "2026-02-16", type: "purchase", status: "completed", hash: "5Hs2...y9Qa", x: 12, y: 68 },
  { date: "2026-02-21", type: "stake", status: "completed", hash: "8Pw1...m2Rk", x: 30, y: 42 },
  { date: "2026-02-25", type: "claim", status: "completed", hash: "2Qa7...z6Wx", x: 48, y: 32 },
  { date: "2026-03-01", type: "status_change", status: "pending", hash: "9Tc5...n4Vu", x: 67, y: 50 },
  { date: "2026-03-04", type: "unstake", status: "processing", hash: "1Bv3...h8Lm", x: 85, y: 62 }
];

function pointColor(status: ActivityStatus): string {
  if (status === "completed") {
    return "#34d399";
  }

  if (status === "pending") {
    return "#fbbf24";
  }

  return "#60a5fa";
}

function typeLabel(type: ActivityType, t: ReturnType<typeof useI18n>["t"]): string {
  if (type === "purchase") {
    return t({ en: "Purchase", es: "Compra", pt: "Compra" });
  }

  if (type === "stake") {
    return "Stake";
  }

  if (type === "unstake") {
    return "Unstake";
  }

  if (type === "claim") {
    return "Claim";
  }

  return t({ en: "Status change", es: "Cambio de estado", pt: "Mudanca de status" });
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

export function HistorialModule(): ReactElement {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const isEmpty = searchParams.get("view") === "empty";

  if (isEmpty) {
    return (
      <Card className="space-y-2 border-dashed">
        <h2 className="text-lg font-semibold text-white">{t({ en: "No recent activity", es: "Sin actividad reciente", pt: "Sem atividade recente" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "You do not have events to audit in this module yet.", es: "Aun no tienes eventos para auditar en este modulo.", pt: "Voce ainda nao tem eventos para auditar neste modulo." })}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Activity history", es: "Historial de actividad", pt: "Historico de atividade" })}</h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Audit purchase, stake, unstake, claim and status changes with date, type, status and hash.",
            es: "Audita compra, stake, unstake, claim y cambios de estado con fecha, tipo, estado y hash resumido.",
            pt: "Audite compra, stake, unstake, claim e mudancas de status com data, tipo, status e hash resumido."
          })}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-white">{t({ en: "Point chart", es: "Grafico de puntos", pt: "Grafico de pontos" })}</p>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
          <svg aria-label={t({ en: "Activity point chart", es: "Grafico de puntos de actividad", pt: "Grafico de pontos de atividade" })} className="h-60 w-full" viewBox="0 0 100 80">
            <line stroke="#334155" strokeWidth="0.4" x1="8" x2="92" y1="70" y2="70" />
            <line stroke="#334155" strokeWidth="0.4" x1="8" x2="8" y1="10" y2="70" />

            {ACTIVITY_EVENTS.map((point, index) => {
              const nextPoint = ACTIVITY_EVENTS[index + 1];
              return (
                <g key={`${point.date}-${point.type}`}>
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
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-white">{t({ en: "Activity timeline", es: "Timeline de actividad", pt: "Timeline de atividade" })}</p>
        <ul className="space-y-2">
          {ACTIVITY_EVENTS.map((event) => (
            <li key={`${event.date}-${event.hash}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{typeLabel(event.type, t)}</p>
              <p className="text-white/70">
                {event.date} · {statusLabel(event.status, t)} · {event.hash}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-white">{t({ en: "Simple event table", es: "Tabla simple por evento", pt: "Tabela simples por evento" })}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">{t({ en: "Date", es: "Fecha", pt: "Data" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Type", es: "Tipo", pt: "Tipo" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Status", es: "Estado", pt: "Status" })}</th>
                <th className="px-2 py-2 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY_EVENTS.map((event) => (
                <tr key={`table-${event.hash}`} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.date}</td>
                  <td className="px-2 py-2 text-white">{typeLabel(event.type, t)}</td>
                  <td className="px-2 py-2 text-white">{statusLabel(event.status, t)}</td>
                  <td className="px-2 py-2 text-cyan-200">{event.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
