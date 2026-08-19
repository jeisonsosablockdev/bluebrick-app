import type {
  AdminCaseMutationResult,
  ComplianceCaseDetailForAdmin,
  ComplianceNoteRecord,
  ListComplianceCasesResult
} from "@/features/profile/infrastructure/profile-repository";
import type { ComplianceStatus } from "@/features/profile/domain/compliance-status-projector";

type JsonSuccess<T> = {
  ok: true;
  data: T;
};

type JsonError = {
  error?: {
    code?: string;
    message?: string;
  };
};

function toSearchParams(input: Record<string, string | number | null | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === null || typeof value === "undefined") {
      continue;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      continue;
    }

    params.set(key, normalized);
  }

  return params;
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
    signal
  });

  const payload = (await response.json().catch(() => null)) as JsonSuccess<T> | JsonError | null;
  if (!response.ok || !payload || !("ok" in payload) || payload.ok !== true) {
    const message = payload && "error" in payload && payload.error?.message
      ? payload.error.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: typeof body === "undefined" ? undefined : JSON.stringify(body)
  });

  const payload = (await response.json().catch(() => null)) as JsonSuccess<T> | JsonError | null;
  if (!response.ok || !payload || !("ok" in payload) || payload.ok !== true) {
    const message = payload && "error" in payload && payload.error?.message
      ? payload.error.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchComplianceCasesQueue(input?: {
  status?: ComplianceStatus | null;
  cursor?: string | null;
  limit?: number | null;
  signal?: AbortSignal;
}): Promise<ListComplianceCasesResult> {
  const params = toSearchParams({
    status: input?.status ?? null,
    cursor: input?.cursor ?? null,
    limit: input?.limit ?? null
  });
  const query = params.toString();
  return requestJson<ListComplianceCasesResult>(
    `/api/admin/compliance/cases${query ? `?${query}` : ""}`,
    input?.signal
  );
}

export async function fetchComplianceCaseDetail(
  walletPublicKey: string,
  signal?: AbortSignal
): Promise<ComplianceCaseDetailForAdmin> {
  return requestJson<ComplianceCaseDetailForAdmin>(
    `/api/admin/compliance/cases/${encodeURIComponent(walletPublicKey)}`,
    signal
  );
}

export async function applyComplianceKycDecision(input: {
  walletPublicKey: string;
  decision: "verified" | "rejected";
  reason?: string;
}): Promise<AdminCaseMutationResult> {
  return postJson<AdminCaseMutationResult>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/kyc-decision`,
    {
      decision: input.decision,
      reason: input.reason
    }
  );
}

export async function applyComplianceAmlDecision(input: {
  walletPublicKey: string;
  decision: "clear" | "flagged";
  reason: string;
}): Promise<AdminCaseMutationResult> {
  return postJson<AdminCaseMutationResult>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/aml-decision`,
    {
      decision: input.decision,
      reason: input.reason
    }
  );
}

export async function suspendComplianceWallet(input: {
  walletPublicKey: string;
  reason?: string;
}): Promise<AdminCaseMutationResult> {
  return postJson<AdminCaseMutationResult>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/suspend`,
    { reason: input.reason }
  );
}

export async function unsuspendComplianceWallet(input: {
  walletPublicKey: string;
  reason?: string;
}): Promise<AdminCaseMutationResult> {
  return postJson<AdminCaseMutationResult>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/unsuspend`,
    { reason: input.reason }
  );
}

export async function fetchComplianceCaseNotes(input: {
  walletPublicKey: string;
  limit?: number | null;
  signal?: AbortSignal;
}): Promise<ComplianceNoteRecord[]> {
  const params = toSearchParams({ limit: input.limit ?? null });
  const query = params.toString();

  const payload = await requestJson<{ notes: ComplianceNoteRecord[] }>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/notes${query ? `?${query}` : ""}`,
    input.signal
  );

  return payload.notes;
}

export async function addComplianceCaseNoteClient(input: {
  walletPublicKey: string;
  noteText: string;
}): Promise<ComplianceNoteRecord> {
  return postJson<ComplianceNoteRecord>(
    `/api/admin/compliance/cases/${encodeURIComponent(input.walletPublicKey)}/notes`,
    { noteText: input.noteText }
  );
}
