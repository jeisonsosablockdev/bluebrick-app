"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EventStatus = "received" | "processed" | "failed" | "ignored";

type MonitoringEvent = {
  eventId: string;
  eventType: string;
  assetId: string;
  emissionId: string;
  wallet: string;
  signature: string;
  slot: number;
  status: EventStatus;
  source: "helius" | "backend" | "manual";
  receivedAt: string;
  processedAt: string;
  errorMessage?: string;
};

const EVENTS: MonitoringEvent[] = [
  {
    eventId: "EV-001",
    eventType: "NFT mintado",
    assetId: "MDE-RE-4421",
    emissionId: "EM-4421",
    wallet: "8Fs2...hQ9A",
    signature: "2Qa7...z6Wx",
    slot: 3211345,
    status: "processed",
    source: "helius",
    receivedAt: "2026-03-06T08:11:00Z",
    processedAt: "2026-03-06T08:11:02Z"
  },
  {
    eventId: "EV-002",
    eventType: "webhook fallido",
    assetId: "CTG-RE-1040",
    emissionId: "EM-1040",
    wallet: "4Tp1...aK3V",
    signature: "9Tc5...n4Vu",
    slot: 3211369,
    status: "failed",
    source: "backend",
    receivedAt: "2026-03-06T09:05:00Z",
    processedAt: "2026-03-06T09:05:06Z",
    errorMessage: "Timeout al reconciliar evento."
  },
  {
    eventId: "EV-003",
    eventType: "claim realizado",
    assetId: "BAQ-RE-9872",
    emissionId: "EM-9872",
    wallet: "6Dj8...mP2B",
    signature: "3Lp9...q2Er",
    slot: 3211401,
    status: "received",
    source: "manual",
    receivedAt: "2026-03-06T10:01:00Z",
    processedAt: "-"
  }
];

function statusClass(status: EventStatus): string {
  if (status === "processed") return "bg-emerald-500/20 text-emerald-200";
  if (status === "failed") return "bg-rose-500/20 text-rose-200";
  if (status === "received") return "bg-indigo-500/20 text-indigo-200";
  return "bg-slate-500/20 text-slate-200";
}

export function MonitoringConsole(): ReactElement {
  const [eventType, setEventType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [signatureFilter, setSignatureFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<MonitoringEvent | null>(null);

  const filtered = useMemo(() => {
    const walletTerm = walletFilter.trim().toLowerCase();
    const assetTerm = assetFilter.trim().toLowerCase();
    const sigTerm = signatureFilter.trim().toLowerCase();

    return EVENTS.filter((event) => {
      const typeMatch = eventType === "all" || event.eventType === eventType;
      const statusMatch = statusFilter === "all" || event.status === statusFilter;
      const walletMatch = walletTerm.length === 0 || event.wallet.toLowerCase().includes(walletTerm);
      const assetMatch = assetTerm.length === 0 || event.assetId.toLowerCase().includes(assetTerm);
      const signatureMatch = sigTerm.length === 0 || event.signature.toLowerCase().includes(sigTerm);
      return typeMatch && statusMatch && walletMatch && assetMatch && signatureMatch;
    });
  }, [assetFilter, eventType, signatureFilter, statusFilter, walletFilter]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Monitoring de eventos</h2>
        <p className="text-sm text-white/75">Trazabilidad de operaciones de mint, backend y reconciliacion.</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Toolbar de filtros</p>
        <div className="grid gap-3 lg:grid-cols-5">
          <select className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white" value={eventType} onChange={(event) => setEventType(event.target.value)}>
            <option value="all">Tipo: todos</option>
            <option value="NFT mintado">NFT mintado</option>
            <option value="webhook fallido">webhook fallido</option>
            <option value="claim realizado">claim realizado</option>
          </select>
          <select className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Estado: todos</option>
            <option value="received">received</option>
            <option value="processed">processed</option>
            <option value="failed">failed</option>
            <option value="ignored">ignored</option>
          </select>
          <Input placeholder="wallet" value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)} />
          <Input placeholder="asset" value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} />
          <Input placeholder="signature" value={signatureFilter} onChange={(event) => setSignatureFilter(event.target.value)} />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Tabla de eventos</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">eventId</th>
                <th className="px-2 py-2 font-medium">eventType</th>
                <th className="px-2 py-2 font-medium">assetId</th>
                <th className="px-2 py-2 font-medium">emissionId</th>
                <th className="px-2 py-2 font-medium">wallet</th>
                <th className="px-2 py-2 font-medium">signature</th>
                <th className="px-2 py-2 font-medium">slot</th>
                <th className="px-2 py-2 font-medium">status</th>
                <th className="px-2 py-2 font-medium">source</th>
                <th className="px-2 py-2 font-medium">receivedAt</th>
                <th className="px-2 py-2 font-medium">processedAt</th>
                <th className="px-2 py-2 font-medium">acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.eventId} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.eventId}</td>
                  <td className="px-2 py-2 text-white">{event.eventType}</td>
                  <td className="px-2 py-2 text-white">{event.assetId}</td>
                  <td className="px-2 py-2 text-white">{event.emissionId}</td>
                  <td className="px-2 py-2 text-white">{event.wallet}</td>
                  <td className="px-2 py-2 text-cyan-200">{event.signature}</td>
                  <td className="px-2 py-2 text-white">{event.slot}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(event.status)}`}>{event.status}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{event.source}</td>
                  <td className="px-2 py-2 text-white">{event.receivedAt}</td>
                  <td className="px-2 py-2 text-white">{event.processedAt}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelectedEvent(event)}>
                        Ver detalle
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="outline">
                        Reprocesar
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        Copiar signature
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        Filtrar por asset
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEvent && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Cerrar detalle evento" className="absolute inset-0 bg-black/70" onClick={() => setSelectedEvent(null)} type="button" />
          <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#070b14] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Detalle de evento</h3>
              <Button className="min-h-11" variant="ghost" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm">
              <p className="text-white/80">eventId: {selectedEvent.eventId}</p>
              <p className="text-white/80">eventType: {selectedEvent.eventType}</p>
              <p className="text-white/80">assetId: {selectedEvent.assetId}</p>
              <p className="text-white/80">emissionId: {selectedEvent.emissionId}</p>
              <p className="text-white/80">wallet: {selectedEvent.wallet}</p>
              <p className="text-white/80">signature: {selectedEvent.signature}</p>
              <p className="text-white/80">slot: {selectedEvent.slot}</p>
              <p className="text-white/80">status: {selectedEvent.status}</p>
              <p className="text-white/80">source: {selectedEvent.source}</p>
              <p className="text-white/80">receivedAt: {selectedEvent.receivedAt}</p>
              <p className="text-white/80">processedAt: {selectedEvent.processedAt}</p>
              {selectedEvent.errorMessage ? <p className="text-rose-200">errorMessage: {selectedEvent.errorMessage}</p> : null}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
