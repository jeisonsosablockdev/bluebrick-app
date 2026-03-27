"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addComplianceCaseNoteClient,
  applyComplianceAmlDecision,
  applyComplianceKycDecision,
  fetchComplianceCaseDetail,
  fetchComplianceCasesQueue,
  fetchComplianceCaseNotes,
  suspendComplianceWallet,
  unsuspendComplianceWallet
} from "@/lib/admin-compliance-client";
import type {
  ComplianceCaseDetailForAdmin,
  ComplianceNoteRecord,
  ListComplianceCasesResult
} from "@/lib/compliance/profile-repository";
import type { ComplianceStatus } from "@/lib/compliance/compliance-status-projector";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ComplianceConsoleProps = {
  initialData: ListComplianceCasesResult | null;
  initialStatus?: ComplianceStatus;
};

const STATUS_OPTIONS: Array<{ value: "all" | ComplianceStatus; label: string }> = [
  { value: "all", label: "all" },
  { value: "pending_kyc", label: "pending_kyc" },
  { value: "pending_aml", label: "pending_aml" },
  { value: "pending_review", label: "pending_review" },
  { value: "fully_verified", label: "fully_verified" },
  { value: "restricted_aml", label: "restricted_aml" },
  { value: "suspended", label: "suspended" }
];

function normalizeStatusFilter(value: "all" | ComplianceStatus): ComplianceStatus | null {
  return value === "all" ? null : value;
}

function statusBadgeClass(value: ComplianceStatus): string {
  if (value === "fully_verified") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (value === "restricted_aml" || value === "suspended") {
    return "bg-rose-500/20 text-rose-200";
  }

  return "bg-amber-500/20 text-amber-200";
}

function truncateMiddle(value: string, left = 6, right = 6): string {
  if (!value || value.length <= left + right + 3) {
    return value;
  }

  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "n/a";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function normalizeCursorToken(value: string): string | null {
  return value ? value : null;
}

export function ComplianceConsole({ initialData, initialStatus }: ComplianceConsoleProps): ReactElement {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<"all" | ComplianceStatus>(initialStatus ?? "all");
  const [queue, setQueue] = useState<ListComplianceCasesResult | null>(initialData);
  const [isQueueLoading, setIsQueueLoading] = useState(initialData === null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [detail, setDetail] = useState<ComplianceCaseDetailForAdmin | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [notes, setNotes] = useState<ComplianceNoteRecord[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string>("idle");
  const [isActionRunning, setIsActionRunning] = useState(false);

  const [kycDecision, setKycDecision] = useState<"verified" | "rejected">("verified");
  const [kycReason, setKycReason] = useState("");
  const [amlDecision, setAmlDecision] = useState<"clear" | "flagged">("clear");
  const [amlReason, setAmlReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [noteText, setNoteText] = useState("");

  const pendingCount = useMemo(() => {
    const items = queue?.items ?? [];
    return items.filter((item) => item.complianceStatus !== "fully_verified").length;
  }, [queue]);

  const loadQueue = useCallback(async (input?: { status?: "all" | ComplianceStatus; cursor?: string | null }) => {
    const requestedStatus = input?.status ?? statusFilter;
    const requestedCursor = typeof input?.cursor === "undefined" ? currentCursor : input.cursor;
    setIsQueueLoading(true);
    setQueueError(null);

    try {
      const data = await fetchComplianceCasesQueue({
        status: normalizeStatusFilter(requestedStatus),
        cursor: requestedCursor,
        limit: 20
      });
      setQueue(data);
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "Could not load compliance queue.");
    } finally {
      setIsQueueLoading(false);
    }
  }, [currentCursor, statusFilter]);

  const loadDetail = useCallback(async (walletPublicKey: string) => {
    setSelectedWallet(walletPublicKey);
    setIsDetailLoading(true);
    setDetailError(null);
    setActionError(null);

    try {
      const data = await fetchComplianceCaseDetail(walletPublicKey);
      setDetail(data);
      setNotes(data.recentNotes);
    } catch (error) {
      setDetail(null);
      setDetailError(error instanceof Error ? error.message : "Could not load case detail.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const refreshNotes = useCallback(async (walletPublicKey: string) => {
    setIsNotesLoading(true);
    setNotesError(null);
    try {
      const data = await fetchComplianceCaseNotes({ walletPublicKey, limit: 50 });
      setNotes(data);
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : "Could not load notes.");
    } finally {
      setIsNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      void loadQueue({ status: statusFilter, cursor: currentCursor });
    }
  }, [currentCursor, initialData, loadQueue, statusFilter]);

  const runAction = useCallback(async (label: string, work: () => Promise<void>) => {
    setActionState(label);
    setIsActionRunning(true);
    setActionError(null);
    try {
      await work();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setIsActionRunning(false);
      setActionState("idle");
    }
  }, []);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Compliance dashboard", es: "Panel de cumplimiento", pt: "Painel de compliance" })}</h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Manage KYC/AML exceptions with auditability and incident controls.",
            es: "Gestiona excepciones KYC/AML con trazabilidad y controles de incidente.",
            pt: "Gerencie excecoes de KYC/AML com rastreabilidade e controles de incidente."
          })}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`queue=${queue?.items.length ?? 0}`}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`pending=${pendingCount}`}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`cursor=${currentCursor ? "set" : "root"}`}</span>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Queue filters", es: "Filtros de cola", pt: "Filtros da fila" })}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
            value={statusFilter}
            onChange={(event) => {
              const nextStatus = event.target.value as "all" | ComplianceStatus;
              setStatusFilter(nextStatus);
              setCurrentCursor(null);
              setCursorHistory([]);
              void loadQueue({ status: nextStatus, cursor: null });
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            className="min-h-11"
            variant="outline"
            onClick={() => {
              setCurrentCursor(null);
              setCursorHistory([]);
              void loadQueue({ status: statusFilter, cursor: null });
            }}
            disabled={isQueueLoading}
          >
            {isQueueLoading ? t({ en: "Loading...", es: "Cargando...", pt: "Carregando..." }) : t({ en: "Refresh", es: "Refrescar", pt: "Atualizar" })}
          </Button>
        </div>
        {queueError ? <p className="text-sm text-rose-200">{queueError}</p> : null}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{t({ en: "Cases queue", es: "Cola de casos", pt: "Fila de casos" })}</p>
          <div className="flex gap-2">
            <Button
              className="min-h-11"
              variant="ghost"
              disabled={isQueueLoading || cursorHistory.length === 0}
              onClick={() => {
                const previous = cursorHistory[cursorHistory.length - 1] ?? "";
                const nextHistory = cursorHistory.slice(0, -1);
                setCursorHistory(nextHistory);
                setCurrentCursor(normalizeCursorToken(previous));
                void loadQueue({ status: statusFilter, cursor: normalizeCursorToken(previous) });
              }}
            >
              {t({ en: "Prev", es: "Anterior", pt: "Anterior" })}
            </Button>
            <Button
              className="min-h-11"
              variant="ghost"
              disabled={isQueueLoading || !queue?.nextCursor}
              onClick={() => {
                if (!queue?.nextCursor) {
                  return;
                }

                setCursorHistory((previous) => [...previous, currentCursor ?? ""]);
                setCurrentCursor(queue.nextCursor);
                void loadQueue({ status: statusFilter, cursor: queue.nextCursor });
              }}
            >
              {t({ en: "Next", es: "Siguiente", pt: "Proximo" })}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">wallet</th>
                <th className="px-2 py-2 font-medium">username</th>
                <th className="px-2 py-2 font-medium">kyc</th>
                <th className="px-2 py-2 font-medium">aml</th>
                <th className="px-2 py-2 font-medium">risk</th>
                <th className="px-2 py-2 font-medium">compliance</th>
                <th className="px-2 py-2 font-medium">updatedAt</th>
                <th className="px-2 py-2 font-medium">action</th>
              </tr>
            </thead>
            <tbody>
              {(queue?.items ?? []).map((item) => (
                <tr key={item.walletPublicKey} className="border-b border-white/10">
                  <td className="px-2 py-2 text-cyan-200">{truncateMiddle(item.walletPublicKey, 8, 8)}</td>
                  <td className="px-2 py-2 text-white">{item.username || "-"}</td>
                  <td className="px-2 py-2 text-white">{item.kycStatus}</td>
                  <td className="px-2 py-2 text-white">{item.amlStatus}</td>
                  <td className="px-2 py-2 text-white">{typeof item.amlRiskScore === "number" ? item.amlRiskScore : "-"}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(item.complianceStatus)}`}>{item.complianceStatus}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{formatDate(item.complianceStatusUpdatedAt)}</td>
                  <td className="px-2 py-2">
                    <Button
                      className="min-h-11 px-3 py-1 text-xs"
                      variant="outline"
                      onClick={() => void loadDetail(item.walletPublicKey)}
                    >
                      {t({ en: "Open", es: "Abrir", pt: "Abrir" })}
                    </Button>
                  </td>
                </tr>
              ))}
              {(queue?.items ?? []).length === 0 && !isQueueLoading ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-white/70" colSpan={8}>
                    {t({ en: "No cases found for this filter.", es: "No hay casos para este filtro.", pt: "Nenhum caso para este filtro." })}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold text-white">{t({ en: "Case detail", es: "Detalle de caso", pt: "Detalhe do caso" })}</h3>
        {!selectedWallet ? (
          <p className="text-sm text-white/70">{t({ en: "Select a case from the queue.", es: "Selecciona un caso de la cola.", pt: "Selecione um caso da fila." })}</p>
        ) : null}
        {isDetailLoading ? (
          <p className="text-sm text-white/70">{t({ en: "Loading detail...", es: "Cargando detalle...", pt: "Carregando detalhe..." })}</p>
        ) : null}
        {detailError ? <p className="text-sm text-rose-200">{detailError}</p> : null}

        {detail ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/60">wallet</p>
                <p className="break-all text-sm text-white">{detail.walletPublicKey}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/60">kyc</p>
                <p className="text-sm text-white">{detail.kycStatus}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/60">aml</p>
                <p className="text-sm text-white">{detail.amlStatus}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/60">compliance</p>
                <p className="text-sm text-white">{detail.complianceStatus}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">KYC decision</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
                    value={kycDecision}
                    onChange={(event) => setKycDecision(event.target.value as "verified" | "rejected")}
                  >
                    <option value="verified">verified</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <Input
                    placeholder={t({ en: "reason (required for reject)", es: "razon (obligatoria para rechazo)", pt: "motivo (obrigatorio para rejeicao)" })}
                    value={kycReason}
                    onChange={(event) => setKycReason(event.target.value)}
                  />
                </div>
                <Button
                  className="min-h-11"
                  onClick={() => void runAction("kyc", async () => {
                    await applyComplianceKycDecision({
                      walletPublicKey: detail.walletPublicKey,
                      decision: kycDecision,
                      reason: kycReason
                    });
                    await loadDetail(detail.walletPublicKey);
                    await loadQueue();
                  })}
                  disabled={isActionRunning}
                >
                  {isActionRunning && actionState === "kyc"
                    ? t({ en: "Applying...", es: "Aplicando...", pt: "Aplicando..." })
                    : t({ en: "Apply KYC decision", es: "Aplicar decision KYC", pt: "Aplicar decisao KYC" })}
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">AML decision</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
                    value={amlDecision}
                    onChange={(event) => setAmlDecision(event.target.value as "clear" | "flagged")}
                  >
                    <option value="clear">clear</option>
                    <option value="flagged">flagged</option>
                  </select>
                  <Input
                    placeholder={t({ en: "reason (required)", es: "razon (obligatoria)", pt: "motivo (obrigatorio)" })}
                    value={amlReason}
                    onChange={(event) => setAmlReason(event.target.value)}
                  />
                </div>
                <Button
                  className="min-h-11"
                  onClick={() => void runAction("aml", async () => {
                    await applyComplianceAmlDecision({
                      walletPublicKey: detail.walletPublicKey,
                      decision: amlDecision,
                      reason: amlReason
                    });
                    await loadDetail(detail.walletPublicKey);
                    await loadQueue();
                  })}
                  disabled={isActionRunning}
                >
                  {isActionRunning && actionState === "aml"
                    ? t({ en: "Applying...", es: "Aplicando...", pt: "Aplicando..." })
                    : t({ en: "Apply AML decision", es: "Aplicar decision AML", pt: "Aplicar decisao AML" })}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">
                  {detail.isSuspended ? "Unsuspend wallet" : "Suspend wallet"}
                </p>
                <Input
                  placeholder={t({ en: "optional reason", es: "razon opcional", pt: "motivo opcional" })}
                  value={suspensionReason}
                  onChange={(event) => setSuspensionReason(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-11"
                    variant="outline"
                    onClick={() => void runAction("suspend", async () => {
                      await suspendComplianceWallet({
                        walletPublicKey: detail.walletPublicKey,
                        reason: suspensionReason
                      });
                      await loadDetail(detail.walletPublicKey);
                      await loadQueue();
                    })}
                    disabled={isActionRunning || detail.isSuspended}
                  >
                    {t({ en: "Suspend", es: "Suspender", pt: "Suspender" })}
                  </Button>
                  <Button
                    className="min-h-11"
                    variant="ghost"
                    onClick={() => void runAction("unsuspend", async () => {
                      await unsuspendComplianceWallet({
                        walletPublicKey: detail.walletPublicKey,
                        reason: suspensionReason
                      });
                      await loadDetail(detail.walletPublicKey);
                      await loadQueue();
                    })}
                    disabled={isActionRunning || !detail.isSuspended}
                  >
                    {t({ en: "Unsuspend", es: "Reactivar", pt: "Reativar" })}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">Internal notes</p>
                <textarea
                  className="glass-control min-h-24 w-full rounded-xl px-3 py-2 text-sm text-white"
                  placeholder={t({ en: "Write note for audit trail", es: "Escribe nota para auditoria", pt: "Escreva nota para auditoria" })}
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-11"
                    onClick={() => void runAction("note", async () => {
                      await addComplianceCaseNoteClient({
                        walletPublicKey: detail.walletPublicKey,
                        noteText
                      });
                      setNoteText("");
                      await refreshNotes(detail.walletPublicKey);
                    })}
                    disabled={isActionRunning}
                  >
                    {t({ en: "Add note", es: "Agregar nota", pt: "Adicionar nota" })}
                  </Button>
                  <Button
                    className="min-h-11"
                    variant="ghost"
                    onClick={() => void refreshNotes(detail.walletPublicKey)}
                    disabled={isNotesLoading}
                  >
                    {isNotesLoading
                      ? t({ en: "Loading notes...", es: "Cargando notas...", pt: "Carregando notas..." })
                      : t({ en: "Reload notes", es: "Recargar notas", pt: "Recarregar notas" })}
                  </Button>
                </div>
                {notesError ? <p className="text-sm text-rose-200">{notesError}</p> : null}
                <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
                  {notes.length === 0 ? (
                    <p className="text-sm text-white/60">{t({ en: "No notes yet.", es: "Sin notas aun.", pt: "Sem notas ainda." })}</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white">
                        <p className="break-words">{note.noteText}</p>
                        <p className="mt-1 text-[11px] text-white/60">{`${note.actorId} · ${formatDate(note.createdAt)}`}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {actionError ? <p className="text-sm text-rose-200">{actionError}</p> : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">Recent audit events</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {detail.recentAuditEvents.length === 0 ? (
                    <p className="text-sm text-white/60">{t({ en: "No audit events.", es: "Sin eventos de auditoria.", pt: "Sem eventos de auditoria." })}</p>
                  ) : (
                    detail.recentAuditEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-white">
                        <p className="font-semibold">{event.eventName}</p>
                        <p className="text-white/70">{`${event.actorType}:${event.actorId} · ${formatDate(event.createdAt)}`}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">AML snapshot</p>
                <p className="text-sm text-white/80">{`riskScore: ${typeof detail.amlRiskScore === "number" ? detail.amlRiskScore : "n/a"}`}</p>
                <p className="text-sm text-white/80">{`provider: ${detail.amlProvider ?? "n/a"}`}</p>
                <p className="text-sm text-white/80">{`lastChecked: ${formatDate(detail.amlLastCheckedAt)}`}</p>
                <p className="text-sm text-white/80">{`flags: ${detail.amlFlags.map((flag) => flag.code).join(", ") || "none"}`}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
