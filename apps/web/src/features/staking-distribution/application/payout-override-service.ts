/**
 * =========================================================================================
 * Layer 2: Application Layer — Payout Override Orchestration Service
 * Module: payout-override-service.ts
 * Description: Orchestrates the two-step payout wallet override workflow, enforces Solana address
 *              validations, case number normalizations, optimistic locking, and supersession rules.
 * =========================================================================================
 */

import {
  createPayoutOverrideRecord,
  findApprovedOverrideForWallet,
  getPayoutOverrideById,
  listPendingPayoutOverrides,
  updatePayoutOverrideStatus,
  type PayoutOverrideRow
} from "@/features/staking-distribution/infrastructure/payout-override-repository";
import {
  isValidSolanaAddress,
  normalizeCaseNumber
} from "@/tests/lib/payout-override-governance.test";

export class PayoutOverrideServiceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(`${code}: ${message}`);
    this.name = "PayoutOverrideServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type RequestPayoutOverrideInput = {
  originalWallet: string;
  requestedWallet: string;
  caseNumber: string;
  reason: string;
  requestedBy: string;
};

export type ApprovePayoutOverrideInput = {
  overrideId: string;
  expectedVersion: number;
  approvedBy: string;
  approvalTxSignature: string;
  isRunSealed?: boolean;
};

/**
 * ¿QUÉ HACE?: Registra una nueva solicitud de reasignación de wallet de pago en estado PENDING.
 * ¿CÓMO LO HACE?:
 *  - Valida y normaliza el número de expediente (`case_number` en mayúsculas).
 *  - Valida que ambas direcciones (`originalWallet` y `requestedWallet`) sean claves públicas base58 de Solana válidas.
 *  - Comprueba que la nueva wallet sea distinta a la original.
 *  - Genera un ID único `OVR-...` y persiste el registro en PostgreSQL mediante la capa de infraestructura.
 */
export async function requestPayoutOverride(
  input: RequestPayoutOverrideInput
): Promise<PayoutOverrideRow> {
  // Step 1: Validar y normalizar número de caso / expediente
  let normalizedCase: string;
  try {
    normalizedCase = normalizeCaseNumber(input.caseNumber);
  } catch {
    throw new PayoutOverrideServiceError(
      "ERR_CASE_NUMBER_REQUIRED",
      "case_number is required and cannot be empty.",
      400
    );
  }

  // Step 2: Validar formato Base58 de Solana para la wallet original
  if (!isValidSolanaAddress(input.originalWallet)) {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_SOLANA_ADDRESS",
      "originalWallet is not a valid Solana public key address.",
      400
    );
  }

  // Step 3: Validar formato Base58 de Solana para la wallet solicitada
  if (!isValidSolanaAddress(input.requestedWallet)) {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_SOLANA_ADDRESS",
      "requestedWallet is not a valid Solana public key address.",
      400
    );
  }

  // Step 4: Garantizar que la nueva wallet no sea idéntica a la original
  if (input.originalWallet.trim() === input.requestedWallet.trim()) {
    throw new PayoutOverrideServiceError(
      "ERR_SAME_WALLET_OVERRIDE",
      "requestedWallet cannot be identical to originalWallet.",
      400
    );
  }

  // Step 5: Asegurar motivo legal / justificación de cumplimiento
  if (!input.reason || input.reason.trim() === "") {
    throw new PayoutOverrideServiceError(
      "ERR_REASON_REQUIRED",
      "Compliance reason / justification is required.",
      400
    );
  }

  // Step 6: Persistir en base de datos PostgreSQL en estado PENDING
  const id = `OVR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return createPayoutOverrideRecord({
    id,
    originalWallet: input.originalWallet.trim(),
    requestedWallet: input.requestedWallet.trim(),
    effectiveWallet: input.originalWallet.trim(), // Permanece en la original hasta ser APPROVED
    caseNumber: normalizedCase,
    reason: input.reason.trim(),
    requestedBy: input.requestedBy.trim()
  });
}

/**
 * ¿QUÉ HACE?: Aprueba una solicitud de override pendiente vinculando la firma de la transacción on-chain.
 * ¿CÓMO LO HACE?:
 *  - Aplica el Contrato de Supersesión: rechaza si el lote de distribución ya fue sellado (`isRunSealed = true`).
 *  - Exige la firma de prueba on-chain (`approvalTxSignature`).
 *  - Ejecuta una actualización atómica en PostgreSQL con control optimista de versiones (`expectedVersion`).
 *  - Si otra sesión modificó el registro simultáneamente, lanza `ERR_CONCURRENT_MODIFICATION`.
 */
export async function approvePayoutOverrideWithMultisig(
  input: ApprovePayoutOverrideInput
): Promise<PayoutOverrideRow> {
  // Step 1: Aplicar invariante de inmutabilidad post-sellado
  if (input.isRunSealed) {
    throw new PayoutOverrideServiceError(
      "ERR_SEALED_RUN_IMMUTABLE",
      "Cannot approve override for an already sealed distribution run.",
      409
    );
  }

  // Step 2: Validar firma de prueba de ejecución on-chain
  if (!input.approvalTxSignature || input.approvalTxSignature.trim() === "") {
    throw new PayoutOverrideServiceError(
      "ERR_EXECUTION_PROOF_REQUIRED",
      "On-chain approval transaction signature proof is required.",
      400
    );
  }

  // Step 3: Recuperar registro actual
  const existing = await getPayoutOverrideById(input.overrideId);
  if (!existing) {
    throw new PayoutOverrideServiceError(
      "ERR_OVERRIDE_NOT_FOUND",
      `Payout override ${input.overrideId} not found.`,
      404
    );
  }

  // Step 4: Validar transición de estado (solo PENDING puede transicionar a APPROVED)
  if (existing.status !== "PENDING") {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_STATE_TRANSITION",
      `Cannot approve payout override in status ${existing.status}.`,
      409
    );
  }

  // Step 5: Ejecutar actualización atómica con bloqueo optimista
  const updated = await updatePayoutOverrideStatus({
    id: input.overrideId,
    status: "APPROVED",
    expectedVersion: input.expectedVersion,
    effectiveWallet: existing.requested_wallet,
    approvedBy: input.approvedBy,
    approvalTxSignature: input.approvalTxSignature
  });

  if (!updated) {
    throw new PayoutOverrideServiceError(
      "ERR_CONCURRENT_MODIFICATION",
      "Conflict: The override was concurrently modified by another administrator.",
      409
    );
  }

  return updated;
}

/**
 * ¿QUÉ HACE?: Lista todos los overrides en estado PENDING para la cola de resolución de compliance.
 * ¿CÓMO LO HACE?: Delega la consulta ordenada por fecha a `listPendingPayoutOverrides()`.
 */
export async function listPendingOverridesForCompliance(): Promise<PayoutOverrideRow[]> {
  return listPendingPayoutOverrides();
}

/**
 * ¿QUÉ HACE?: Resuelve la dirección de destino final para el pago de rendimientos de un titular.
 * ¿CÓMO LO HACE?: Busca si existe un override en estado `APPROVED` para la wallet. Si existe, retorna `effective_wallet`; si no, retorna la wallet titular original.
 */
export async function resolveActivePayoutWallet(holderWallet: string): Promise<string> {
  const approved = await findApprovedOverrideForWallet(holderWallet);
  return approved ? approved.effective_wallet : holderWallet;
}
