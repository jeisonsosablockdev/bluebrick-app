"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Create Distribution Run Modal
 * Component: CreateDistributionModal
 *
 * Description:
 * Interactive modal dialog allowing administrators to configure and launch a new
 * distribution run draft by selecting a registered marketplace project and auto-filling
 * on-chain notarized dates and collection addresses.
 *
 * Invariants:
 * - Sober, emoji-free aesthetic aligned with /profile overview cards.
 * - Auto-binds on-chain Notary PDA dates and collection keys to prevent manual entry errors.
 * - Dispatches POST request to /api/admin/distributions/runs upon form submission.
 * =========================================================================================
 */

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminProjectSelector } from "@/features/admin/application/use-admin-project-selector";
import type { ProjectDistributionCandidate } from "@/features/admin/domain/project-distribution-view-model";
import { ProjectSelectorCard } from "@/features/admin/presentation/project-selector-card";

type CreateDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (runId: string) => void;
  initialProjects?: ProjectDistributionCandidate[];
};

export function CreateDistributionModal({
  isOpen,
  onClose,
  onSuccess,
  initialProjects
}: CreateDistributionModalProps): ReactElement | null {
  const { t } = useI18n();

  // Step 1: Initialize project selector application hook
  const hookResult = useAdminProjectSelector();
  const projects = initialProjects || hookResult.projects;
  const isLoading = initialProjects ? false : hookResult.isLoading;

  const [selectedProject, setSelectedProject] = useState<ProjectDistributionCandidate | null>(
    initialProjects && initialProjects.length > 0 ? initialProjects[0] : null
  );

  const [collectionAddress, setCollectionAddress] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [periodKey, setPeriodKey] = useState("");
  const [periodStartAt, setPeriodStartAt] = useState("");
  const [periodEndAt, setPeriodEndAt] = useState("");
  const [totalAmountUsdc, setTotalAmountUsdc] = useState("10000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Synchronize initial project from hook when not passed via props
  useEffect(() => {
    if (!initialProjects && hookResult.selectedProject && !selectedProject) {
      setSelectedProject(hookResult.selectedProject);
    }
  }, [hookResult.selectedProject, initialProjects, selectedProject]);

  // Step 3: Automatically bind form state whenever selected project changes
  useEffect(() => {
    if (selectedProject) {
      setCollectionAddress(selectedProject.collectionAddress);
      setPropertyId(selectedProject.id);
      setPeriodKey(selectedProject.periodKey);
      setPeriodStartAt(selectedProject.periodStartAt);
      setPeriodEndAt(selectedProject.periodEndAt);
    }
  }, [selectedProject]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Step 4: Convert USDC amount into minor units (6 decimals for SPL Token)
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
      {/* Modal Backdrop */}
      <button
        aria-label={t({ en: "Close dialog", es: "Cerrar diálogo", pt: "Fechar diálogo" })}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      {/* Modal Container Card */}
      <Card className="relative z-10 w-full max-w-xl space-y-5 rounded-2xl border border-white/15 bg-panel/95 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t({
                en: "Create Yield Distribution",
                es: "Crear Distribución de Rendimientos",
                pt: "Criar Distribuição de Rendimentos"
              })}
            </h2>
            <p className="text-xs text-neutral-400">
              {t({
                en: "Select marketplace project and compile notarized on-chain distribution run.",
                es: "Selecciona el proyecto y compila el lote de distribución notarizado on-chain.",
                pt: "Selecione o projeto e compile o lote de distribuição notarizado on-chain."
              })}
            </p>
          </div>
          <Button className="min-h-8 px-3 text-xs" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 5: Visual Project Selector with Thumbnail & Notary Badges */}
          <ProjectSelectorCard
            projects={projects}
            selectedProject={selectedProject}
            isLoading={isLoading}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
            }}
          />

          {/* Amount & Period Key Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
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
                className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                {t({ en: "Period Key", es: "Clave del Período", pt: "Chave do Período" })}
              </label>
              <input
                required
                type="text"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="2026-08"
                className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* On-Chain Dates Interval (Read-Only Auto-Populated Summary) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="font-medium text-neutral-400">
                {t({ en: "Notarized Period:", es: "Período Notarizado:", pt: "Período Notarizado:" })}
              </span>
              <span className="font-mono text-[11px] text-neutral-200">
                {periodStartAt.slice(0, 10)} ➔ {periodEndAt.slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              className="min-h-10 text-xs"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
            </Button>
            <Button
              type="submit"
              className="min-h-10 text-xs"
              variant="primary"
              disabled={isSubmitting || isLoading}
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
