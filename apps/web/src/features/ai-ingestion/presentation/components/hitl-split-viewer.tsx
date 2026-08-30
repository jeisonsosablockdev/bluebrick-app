/**
 * ============================================================================
 * Layer 1: Presentation - Human-in-the-Loop (HITL) Split Viewer Component
 * ============================================================================
 * Purpose: Provides a dual-pane verification interface with sandboxed document
 * preview on the left and assisted field correction/approval on the right.
 * Invariants:
 *  - Sandboxed iframe preview preventing script execution and session theft.
 *  - Accessible form controls with clear visual validation indicators.
 *  - Direct invocation of RBAC-protected Server Actions.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

'use client';

import React, { useState } from 'react';
import {
  approveSyncRecordAction,
  rejectSyncRecordAction,
} from '../../application/actions/hitl-review-actions';

/**
 * Props for HitlSplitViewer component.
 */
export interface HitlSplitViewerProps {
  readonly fileId: string;
  readonly documentUrl: string;
  readonly fileName: string;
  readonly userRole: string;
  readonly initialClientData: {
    readonly name: string;
    readonly taxId?: string | null;
    readonly email?: string | null;
    readonly phone?: string | null;
    readonly contractAmount?: string | null;
  };
  readonly confidenceScore: number;
  readonly validationIssues?: readonly string[];
  readonly onActionComplete?: (status: 'APPROVED' | 'REJECTED') => void;
}

/**
 * Split-view HITL review panel.
 */
export function HitlSplitViewer({
  fileId,
  documentUrl,
  fileName,
  userRole,
  initialClientData,
  confidenceScore,
  validationIssues = [],
  onActionComplete,
}: HitlSplitViewerProps) {
  // Step 1: Initialize local form state for manual corrections
  const [formData, setFormData] = useState({
    name: initialClientData.name || '',
    taxId: initialClientData.taxId || '',
    email: initialClientData.email || '',
    phone: initialClientData.phone || '',
    contractAmount: initialClientData.contractAmount || '',
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Step 2: Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 3: Handle approval submission
  const handleApprove = async () => {
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await approveSyncRecordAction({
        fileId,
        userRole,
        correctedClient: {
          name: formData.name,
          taxId: formData.taxId || null,
          email: formData.email || null,
          phone: formData.phone || null,
          contractAmount: formData.contractAmount || null,
          status: 'ACTIVE',
          metadata: {},
        },
      });

      if (res.success) {
        setActionSuccess(res.message);
        onActionComplete?.('APPROVED');
      } else {
        setActionError(res.message);
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Ocurrió un error al procesar la aprobación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Handle rejection submission
  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setActionError('Por favor ingresa una razón de rechazo de al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await rejectSyncRecordAction({
        fileId,
        userRole,
        reason: rejectionReason,
      });

      if (res.success) {
        setActionSuccess(res.message);
        onActionComplete?.('REJECTED');
      } else {
        setActionError(res.message);
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Ocurrió un error al procesar el rechazo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[85vh] w-full flex-col gap-4 lg:flex-row">
      {/* Left Pane: Sandboxed Document Preview */}
      <section
        aria-label="Previsualización del documento"
        className="flex h-1/2 w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 lg:h-full lg:w-1/2"
      >
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/60">
          <span className="text-xs font-semibold text-zinc-300 truncate">{fileName}</span>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
            Vista Aislada
          </span>
        </header>

        <div className="relative flex-1 bg-zinc-900">
          <iframe
            src={documentUrl}
            title={`Documento ${fileName}`}
            sandbox="allow-same-origin"
            className="h-full w-full border-0"
          />
        </div>
      </section>

      {/* Right Pane: Assisted Review Form */}
      <section
        aria-label="Formulario de corrección y aprobación"
        className="flex h-1/2 w-full flex-col overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:h-full lg:w-1/2"
      >
        {/* Header with Confidence Score */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Revisión Asistida (HITL)</h2>
            <p className="text-xs text-zinc-400">Verifica los datos extraídos por IA antes de aprobar</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Confianza</span>
            <span
              className={`text-sm font-black ${
                confidenceScore >= 90
                  ? 'text-emerald-400'
                  : confidenceScore >= 70
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {confidenceScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Validation Issues Alert */}
        {validationIssues.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-300">
            <p className="font-semibold mb-1">Advertencias detectadas:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-400/90">
              {validationIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Alerts */}
        {actionError && (
          <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            {actionSuccess}
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre / Razón Social <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div>
            <label htmlFor="taxId" className="block text-xs font-semibold text-zinc-300 mb-1">
              NIT / Identificación Tributaria
            </label>
            <input
              id="taxId"
              name="taxId"
              type="text"
              value={formData.taxId}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="900123456-8"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-300 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-zinc-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contractAmount" className="block text-xs font-semibold text-zinc-300 mb-1">
              Valor del Contrato (COP)
            </label>
            <input
              id="contractAmount"
              name="contractAmount"
              type="text"
              value={formData.contractAmount}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="500000000.00"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando...' : 'Aprobar y Publicar'}
            </button>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Razón de rechazo..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-rose-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-900/60 disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
