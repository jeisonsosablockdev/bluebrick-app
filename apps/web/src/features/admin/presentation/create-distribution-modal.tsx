"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Create Distribution Run Modal
 * Component: CreateDistributionModal
 * Description: Interactive modal dialog allowing administrators to configure and launch
 *              a new distribution run snapshot with collection selection and period dates.
 * =========================================================================================
 */

import type { ReactElement } from "react";
import { useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CreateDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (runId: string) => void;
};

export function CreateDistributionModal({
  isOpen,
  onClose,
  onSuccess
}: CreateDistributionModalProps): ReactElement | null {
  const { t } = useI18n();

  const [collectionAddress, setCollectionAddress] = useState("9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz");
  const [propertyId, setPropertyId] = useState("PROP-BELLA-VISTA-102");
  const [periodKey, setPeriodKey] = useState("2026-08");
  const [periodStartAt, setPeriodStartAt] = useState("2026-08-01T00:00:00.000Z");
  const [periodEndAt, setPeriodEndAt] = useState("2026-08-31T23:59:59.000Z");
  const [totalAmountUsdc, setTotalAmountUsdc] = useState("10000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const totalAmountMinor = (Number(totalAmountUsdc) * 1_000_000).toString();

      const response = await fetch("/api/admin/distributions/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodKey,
          collectionAddress,
          propertyId,
          periodStartAt,
          periodEndAt,
          totalAmountMinor,
          policyVersion: "v1"
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Failed to create distribution run.");
      }

      onSuccess(payload.data.run.id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label={t({ en: "Close dialog", es: "Cerrar diálogo", pt: "Fechar diálogo" })}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      {/* Modal Card */}
      <Card className="relative z-10 w-full max-w-xl space-y-5 rounded-3xl border border-white/15 bg-panel/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t({ en: "Create New Yield Distribution", es: "Crear Nueva Distribución de Rendimientos", pt: "Criar Nova Distribuicao" })}
            </h2>
            <p className="text-xs text-white/60">
              {t({
                en: "Compute snapshot weights, compile tree, and initialize run draft.",
                es: "Calcula pesos de snapshot, compila árbol Merkle e inicializa borrador.",
                pt: "Calcula pesos de snapshot, compila arvore e inicializa rascunho."
              })}
            </p>
          </div>
          <Button className="min-h-9 px-3 text-xs" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
                {t({ en: "Period Key", es: "Clave del Período", pt: "Chave do Periodo" })}
              </label>
              <input
                required
                type="text"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="2026-08"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
                {t({ en: "Total Amount (USDC)", es: "Monto Total (USDC)", pt: "Montante Total (USDC)" })}
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={totalAmountUsdc}
                onChange={(e) => setTotalAmountUsdc(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
              {t({ en: "Collection Address", es: "Dirección de la Colección", pt: "Endereco da Colecao" })}
            </label>
            <input
              required
              type="text"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
              {t({ en: "Property ID", es: "Identificador de Propiedad", pt: "ID da Propriedade" })}
            </label>
            <input
              required
              type="text"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="PROP-BELLA-VISTA-102"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
                {t({ en: "Start Date", es: "Fecha Inicio", pt: "Data Inicio" })}
              </label>
              <input
                required
                type="text"
                value={periodStartAt}
                onChange={(e) => setPeriodStartAt(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
                {t({ en: "End Date", es: "Fecha Fin", pt: "Data Fim" })}
              </label>
              <input
                required
                type="text"
                value={periodEndAt}
                onChange={(e) => setPeriodEndAt(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              className="min-h-11"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
            </Button>
            <Button
              type="submit"
              className="min-h-11"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t({ en: "Computing Snapshot...", es: "Calculando Snapshot...", pt: "Calculando..." })
                : t({ en: "Create Distribution Draft", es: "Crear Borrador de Distribución", pt: "Criar Rascunho" })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
