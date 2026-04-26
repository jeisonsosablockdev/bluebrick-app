import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

type AdminCollectionDetailErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionSummarySuccessResponse = {
  ok: true;
  data: {
    section: "summary";
    content: AdminCollectionContentRecord;
  };
};

type AdminCollectionSummaryResponse =
  | AdminCollectionSummarySuccessResponse
  | AdminCollectionDetailErrorResponse;

export class AdminCollectionSummaryMutationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AdminCollectionSummaryMutationError";
    this.code = code;
  }
}

export function normalizeAdminCollectionSummaryInput(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function isAdminCollectionSummaryDirty(input: {
  persistedValue: string | null;
  draftValue: string;
}): boolean {
  return input.persistedValue !== normalizeAdminCollectionSummaryInput(input.draftValue);
}

export async function updateAdminCollectionSummary(input: {
  entryId: string;
  summary: string;
}): Promise<AdminCollectionContentRecord> {
  const response = await fetch(`/api/admin/collections/${encodeURIComponent(input.entryId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      section: "summary",
      data: {
        fractionalInvestmentSummary: normalizeAdminCollectionSummaryInput(input.summary)
      }
    })
  });

  const payload = (await response.json()) as AdminCollectionSummaryResponse;
  if (!response.ok || "error" in payload) {
    const code = "error" in payload ? payload.error.code : "ADMIN_COLLECTION_PATCH_FAILED";
    const message = "error" in payload ? payload.error.message : "Could not update collection summary.";
    throw new AdminCollectionSummaryMutationError(code, message);
  }

  return payload.data.content;
}
