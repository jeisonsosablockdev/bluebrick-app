import {
  addComplianceNoteForAdmin,
  getComplianceCaseDetailForAdmin,
  listComplianceCasesForAdmin,
  listComplianceNotesForAdmin,
  setAmlDecisionByAdmin,
  setKycDecisionByAdmin,
  setSuspensionByAdmin,
  type AddComplianceNoteInput,
  type AdminCaseMutationResult,
  type ComplianceCaseDetailForAdmin,
  type ComplianceNoteRecord,
  type ListComplianceCasesResult,
  type SetAmlDecisionByAdminInput,
  type SetKycDecisionByAdminInput,
  type SetSuspensionByAdminInput,
  ProfileRepositoryError
} from "@/lib/compliance/profile-repository";
import type { ComplianceStatus } from "@/lib/compliance/compliance-status-projector";

const WALLET_PUBLIC_KEY_REGEX = /^[A-Za-z0-9]{32,64}$/;
const ALLOWED_CASE_STATUSES: ComplianceStatus[] = [
  "pending_kyc",
  "pending_aml",
  "pending_review",
  "fully_verified",
  "restricted_aml",
  "suspended"
];

export class ComplianceCaseServiceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type QueueInput = {
  status?: string | null;
  cursor?: string | null;
  limit?: number;
};

function toOptionalString(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeWalletPublicKey(value: string): string {
  const normalized = value.trim();
  if (!WALLET_PUBLIC_KEY_REGEX.test(normalized)) {
    throw new ComplianceCaseServiceError(
      "INVALID_WALLET_PUBLIC_KEY",
      "walletPublicKey must be a valid wallet id.",
      400
    );
  }

  return normalized;
}

function normalizeAdminActorId(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new ComplianceCaseServiceError("INVALID_ADMIN_ACTOR", "Admin actor id is required.", 400);
  }

  return normalized;
}

function normalizeStatus(value: string | null | undefined): ComplianceStatus | undefined {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  if (!ALLOWED_CASE_STATUSES.includes(normalized as ComplianceStatus)) {
    throw new ComplianceCaseServiceError(
      "INVALID_STATUS_FILTER",
      `status must be one of: ${ALLOWED_CASE_STATUSES.join(", ")}.`,
      400
    );
  }

  return normalized as ComplianceStatus;
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    return 20;
  }

  return Math.min(Number(value), 100);
}

function normalizeRequiredReason(value: string | null | undefined, errorCode: string, message: string): string {
  const normalized = toOptionalString(value);
  if (!normalized) {
    throw new ComplianceCaseServiceError(errorCode, message, 400);
  }

  if (normalized.length > 500) {
    throw new ComplianceCaseServiceError(errorCode, "reason cannot exceed 500 characters.", 400);
  }

  return normalized;
}

function normalizeOptionalReason(value: string | null | undefined): string | undefined {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 500);
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof ComplianceCaseServiceError) {
    throw error;
  }

  if (error instanceof ProfileRepositoryError) {
    if (error.code === "INVALID_CURSOR") {
      throw new ComplianceCaseServiceError("INVALID_CURSOR", error.message, 400);
    }

    if (error.code === "CASE_NOT_FOUND") {
      throw new ComplianceCaseServiceError("CASE_NOT_FOUND", error.message, 404);
    }

    if (error.code === "REASON_REQUIRED") {
      throw new ComplianceCaseServiceError("REASON_REQUIRED", error.message, 400);
    }

    if (error.code === "INVALID_NOTE") {
      throw new ComplianceCaseServiceError("INVALID_NOTE", error.message, 400);
    }
  }

  const message = error instanceof Error ? error.message : "Unexpected compliance service error.";
  throw new ComplianceCaseServiceError("COMPLIANCE_SERVICE_FAILED", message, 500);
}

export async function getComplianceCasesQueue(input: QueueInput): Promise<ListComplianceCasesResult> {
  try {
    return await listComplianceCasesForAdmin({
      status: normalizeStatus(input.status),
      cursor: toOptionalString(input.cursor),
      limit: normalizeLimit(input.limit)
    });
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function getComplianceCaseByWallet(walletPublicKey: string): Promise<ComplianceCaseDetailForAdmin> {
  try {
    const normalizedWalletPublicKey = normalizeWalletPublicKey(walletPublicKey);
    const detail = await getComplianceCaseDetailForAdmin(normalizedWalletPublicKey);
    if (!detail) {
      throw new ComplianceCaseServiceError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.", 404);
    }

    return detail;
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function applyKycDecisionForComplianceCase(input: {
  walletPublicKey: string;
  adminActorId: string;
  decision: "verified" | "rejected";
  reason?: string | null;
}): Promise<AdminCaseMutationResult> {
  try {
    const normalizedWalletPublicKey = normalizeWalletPublicKey(input.walletPublicKey);
    const normalizedAdminActorId = normalizeAdminActorId(input.adminActorId);

    const payload: SetKycDecisionByAdminInput = {
      walletPublicKey: normalizedWalletPublicKey,
      adminActorId: normalizedAdminActorId,
      decision: input.decision,
      reason: input.decision === "rejected"
        ? normalizeRequiredReason(input.reason, "REASON_REQUIRED", "reason is required for rejected KYC decisions.")
        : undefined
    };

    return await setKycDecisionByAdmin(payload);
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function applyAmlDecisionForComplianceCase(input: {
  walletPublicKey: string;
  adminActorId: string;
  decision: "clear" | "flagged";
  reason: string;
}): Promise<AdminCaseMutationResult> {
  try {
    const normalizedWalletPublicKey = normalizeWalletPublicKey(input.walletPublicKey);
    const normalizedAdminActorId = normalizeAdminActorId(input.adminActorId);
    const payload: SetAmlDecisionByAdminInput = {
      walletPublicKey: normalizedWalletPublicKey,
      adminActorId: normalizedAdminActorId,
      decision: input.decision,
      reason: normalizeRequiredReason(input.reason, "REASON_REQUIRED", "reason is required for AML admin decisions.")
    };

    return await setAmlDecisionByAdmin(payload);
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function suspendComplianceCase(input: {
  walletPublicKey: string;
  adminActorId: string;
  reason?: string | null;
}): Promise<AdminCaseMutationResult> {
  try {
    const payload: SetSuspensionByAdminInput = {
      walletPublicKey: normalizeWalletPublicKey(input.walletPublicKey),
      adminActorId: normalizeAdminActorId(input.adminActorId),
      suspended: true,
      reason: normalizeOptionalReason(input.reason)
    };

    return await setSuspensionByAdmin(payload);
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function unsuspendComplianceCase(input: {
  walletPublicKey: string;
  adminActorId: string;
  reason?: string | null;
}): Promise<AdminCaseMutationResult> {
  try {
    const payload: SetSuspensionByAdminInput = {
      walletPublicKey: normalizeWalletPublicKey(input.walletPublicKey),
      adminActorId: normalizeAdminActorId(input.adminActorId),
      suspended: false,
      reason: normalizeOptionalReason(input.reason)
    };

    return await setSuspensionByAdmin(payload);
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function addComplianceCaseNote(input: {
  walletPublicKey: string;
  adminActorId: string;
  noteText: string;
}): Promise<ComplianceNoteRecord> {
  const noteText = toOptionalString(input.noteText);
  if (!noteText) {
    throw new ComplianceCaseServiceError("INVALID_NOTE", "noteText is required.", 400);
  }

  if (noteText.length > 2000) {
    throw new ComplianceCaseServiceError("INVALID_NOTE", "noteText cannot exceed 2000 characters.", 400);
  }

  try {
    const payload: AddComplianceNoteInput = {
      walletPublicKey: normalizeWalletPublicKey(input.walletPublicKey),
      actorId: normalizeAdminActorId(input.adminActorId),
      noteText
    };

    return await addComplianceNoteForAdmin(payload);
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function getComplianceCaseNotes(input: {
  walletPublicKey: string;
  limit?: number;
}): Promise<ComplianceNoteRecord[]> {
  try {
    const normalizedWalletPublicKey = normalizeWalletPublicKey(input.walletPublicKey);
    const detail = await getComplianceCaseDetailForAdmin(normalizedWalletPublicKey);
    if (!detail) {
      throw new ComplianceCaseServiceError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.", 404);
    }

    return await listComplianceNotesForAdmin(normalizedWalletPublicKey, normalizeLimit(input.limit));
  } catch (error) {
    mapRepositoryError(error);
  }
}

export function assertFinancialAccessByComplianceStatus(complianceStatus: ComplianceStatus): void {
  if (complianceStatus === "suspended" || complianceStatus === "restricted_aml") {
    throw new ComplianceCaseServiceError(
      "COMPLIANCE_RESTRICTED",
      "This wallet is restricted by compliance policy.",
      403,
      { complianceStatus }
    );
  }
}
