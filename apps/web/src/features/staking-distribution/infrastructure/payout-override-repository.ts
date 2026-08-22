/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Database Repository
 * Module: payout-override-repository.ts
 * Description: PostgreSQL persistence layer for two-step payout wallet overrides with
 *              optimistic locking, status transitions, and audit trails.
 * =========================================================================================
 */

import "server-only";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export type PayoutOverrideStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type PayoutOverrideRow = {
  id: string;
  original_wallet: string;
  requested_wallet: string;
  effective_wallet: string;
  case_number: string;
  status: PayoutOverrideStatus;
  version: number;
  reason: string;
  requested_by: string;
  approved_by: string | null;
  approval_tx_signature: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePayoutOverrideDbInput = {
  id: string;
  originalWallet: string;
  requestedWallet: string;
  effectiveWallet: string;
  caseNumber: string;
  reason: string;
  requestedBy: string;
};

export type UpdatePayoutOverrideDbInput = {
  id: string;
  status: PayoutOverrideStatus;
  expectedVersion: number;
  effectiveWallet: string;
  approvedBy?: string;
  approvalTxSignature?: string;
};

/**
 * ¿QUÉ HACE?: Mapea una fila cruda de PostgreSQL a la estructura tipada `PayoutOverrideRow`.
 * ¿CÓMO LO HACE?: Parsea tipos (números, fechas ISO, nulos) de forma segura.
 */
function mapRow(row: Record<string, unknown>): PayoutOverrideRow {
  return {
    id: String(row.id),
    original_wallet: String(row.original_wallet),
    requested_wallet: String(row.requested_wallet),
    effective_wallet: String(row.effective_wallet),
    case_number: String(row.case_number),
    status: row.status as PayoutOverrideStatus,
    version: Number(row.version),
    reason: String(row.reason),
    requested_by: String(row.requested_by),
    approved_by: row.approved_by ? String(row.approved_by) : null,
    approval_tx_signature: row.approval_tx_signature ? String(row.approval_tx_signature) : null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

/**
 * ¿QUÉ HACE?: Inserta un nuevo registro de override en la tabla `distribution_payout_overrides` con estado inicial 'PENDING' y versión 1.
 * ¿CÓMO LO HACE?: Ejecuta un `INSERT ... RETURNING *` parametrizado dentro del pool de conexiones PostgreSQL.
 */
export async function createPayoutOverrideRecord(input: CreatePayoutOverrideDbInput): Promise<PayoutOverrideRow> {
  return withDbClient(async (client) => {
    const query = `
      INSERT INTO distribution_payout_overrides (
        id, original_wallet, requested_wallet, effective_wallet,
        case_number, status, version, reason, requested_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', 1, $6, $7, NOW(), NOW())
      RETURNING *;
    `;
    const values = [
      input.id,
      input.originalWallet,
      input.requestedWallet,
      input.effectiveWallet,
      input.caseNumber,
      input.reason,
      input.requestedBy
    ];

    const result = await client.query(query, values);
    return mapRow(result.rows[0]);
  });
}

/**
 * ¿QUÉ HACE?: Busca y retorna un registro de override individual a partir de su ID único (`OVR-...`).
 * ¿CÓMO LO HACE?: Ejecuta una consulta `SELECT * WHERE id = $1 LIMIT 1` y retorna `null` si no existe coincidencia.
 */
export async function getPayoutOverrideById(id: string): Promise<PayoutOverrideRow | null> {
  return withDbClient(async (client) => {
    const query = `SELECT * FROM distribution_payout_overrides WHERE id = $1 LIMIT 1;`;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  });
}

/**
 * ¿QUÉ HACE?: Obtiene todos los overrides pendientes de aprobación para la cola de cumplimiento.
 * ¿CÓMO LO HACE?: Ejecuta `SELECT * WHERE status = 'PENDING' ORDER BY created_at DESC` aprovechando el índice `idx_payout_overrides_status`.
 */
export async function listPendingPayoutOverrides(): Promise<PayoutOverrideRow[]> {
  return withDbClient(async (client) => {
    const query = `
      SELECT * FROM distribution_payout_overrides
      WHERE status = 'PENDING'
      ORDER BY created_at DESC;
    `;
    const result = await client.query(query);
    return result.rows.map(mapRow);
  });
}

/**
 * ¿QUÉ HACE?: Busca el override aprobado más reciente para una wallet original.
 * ¿CÓMO LO HACE?: Consulta `WHERE original_wallet = $1 AND status = 'APPROVED' ORDER BY updated_at DESC LIMIT 1` usando el índice compuesto `idx_payout_overrides_lookup`.
 */
export async function findApprovedOverrideForWallet(originalWallet: string): Promise<PayoutOverrideRow | null> {
  return withDbClient(async (client) => {
    const query = `
      SELECT * FROM distribution_payout_overrides
      WHERE original_wallet = $1 AND status = 'APPROVED'
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const result = await client.query(query, [originalWallet]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  });
}

/**
 * ¿QUÉ HACE?: Actualiza el estado de un override aplicando bloqueo optimista de concurrencia (`optimistic locking`).
 * ¿CÓMO LO HACE?:
 *  - Ejecuta un `UPDATE ... WHERE id = $5 AND version = $6 RETURNING *`.
 *  - Incrementa la versión automáticamente (`version = version + 1`).
 *  - Si ninguna fila coincide con la versión esperada (conflicto concurrente), la consulta retorna 0 filas y la función devuelve `null`.
 */
export async function updatePayoutOverrideStatus(
  input: UpdatePayoutOverrideDbInput
): Promise<PayoutOverrideRow | null> {
  return withDbClient(async (client) => {
    const query = `
      UPDATE distribution_payout_overrides
      SET
        status = $1,
        effective_wallet = $2,
        approved_by = $3,
        approval_tx_signature = $4,
        version = version + 1,
        updated_at = NOW()
      WHERE id = $5 AND version = $6
      RETURNING *;
    `;
    const values = [
      input.status,
      input.effectiveWallet,
      input.approvedBy ?? null,
      input.approvalTxSignature ?? null,
      input.id,
      input.expectedVersion
    ];

    const result = await client.query(query, values);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  });
}
