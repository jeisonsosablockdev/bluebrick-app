"use client";

import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";

type ActivityEvent = {
  date: string;
  type: "Compra" | "Stake" | "Unstake" | "Claim" | "Cambio de estado";
  status: string;
  hash: string;
  x: number;
  y: number;
};

const ACTIVITY_EVENTS: ActivityEvent[] = [
  { date: "2026-02-16", type: "Compra", status: "Completado", hash: "5Hs2...y9Qa", x: 12, y: 68 },
  { date: "2026-02-21", type: "Stake", status: "Completado", hash: "8Pw1...m2Rk", x: 30, y: 42 },
  { date: "2026-02-25", type: "Claim", status: "Completado", hash: "2Qa7...z6Wx", x: 48, y: 32 },
  { date: "2026-03-01", type: "Cambio de estado", status: "Pendiente", hash: "9Tc5...n4Vu", x: 67, y: 50 },
  { date: "2026-03-04", type: "Unstake", status: "En proceso", hash: "1Bv3...h8Lm", x: 85, y: 62 }
];

function pointColor(status: string): string {
  if (status === "Completado") {
    return "#34d399";
  }

  if (status === "Pendiente") {
    return "#fbbf24";
  }

  return "#60a5fa";
}

export function HistorialModule(): ReactElement {
  const searchParams = useSearchParams();
  const isEmpty = searchParams.get("view") === "empty";

  if (isEmpty) {
    return (
      <Card className="space-y-2 border-dashed">
        <h2 className="text-lg font-semibold text-white">Sin actividad reciente</h2>
        <p className="text-sm text-white/75">Aun no tienes eventos para auditar en este modulo.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Historial de actividad</h2>
        <p className="text-sm text-white/75">
          Audita compra, stake, unstake, claim y cambios de estado con fecha, tipo, estado y hash resumido.
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-white">Grafico de puntos</p>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
          <svg aria-label="Grafico de puntos de actividad" className="h-60 w-full" viewBox="0 0 100 80">
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
        <p className="text-sm font-medium text-white">Timeline de actividad</p>
        <ul className="space-y-2">
          {ACTIVITY_EVENTS.map((event) => (
            <li key={`${event.date}-${event.hash}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{event.type}</p>
              <p className="text-white/70">
                {event.date} · {event.status} · {event.hash}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-white">Tabla simple por evento</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">Fecha</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY_EVENTS.map((event) => (
                <tr key={`table-${event.hash}`} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.date}</td>
                  <td className="px-2 py-2 text-white">{event.type}</td>
                  <td className="px-2 py-2 text-white">{event.status}</td>
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
