import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

export type AdminCollectionTextSection = "summary" | "propertyInformation";

type AdminCollectionDetailErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionTextSectionSuccessResponse = {
  ok: true;
  data: {
    section: AdminCollectionTextSection;
    content: AdminCollectionContentRecord;
  };
};

type AdminCollectionTextSectionResponse =
  | AdminCollectionTextSectionSuccessResponse
  | AdminCollectionDetailErrorResponse;

export class AdminCollectionTextSectionMutationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AdminCollectionTextSectionMutationError";
    this.code = code;
  }
}

export function normalizeAdminCollectionTextSectionInput(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function isAdminCollectionTextSectionDirty(input: {
  persistedValue: string | null;
  draftValue: string;
}): boolean {
  return input.persistedValue !== normalizeAdminCollectionTextSectionInput(input.draftValue);
}

function buildTextSectionPayload(input: {
  section: AdminCollectionTextSection;
  value: string;
}): Record<string, string | null> {
  const normalizedValue = normalizeAdminCollectionTextSectionInput(input.value);

  if (input.section === "summary") {
    return {
      fractionalInvestmentSummary: normalizedValue
    };
  }

  return {
    propertyInformation: normalizedValue
  };
}

export async function updateAdminCollectionTextSection(input: {
  entryId: string;
  section: AdminCollectionTextSection;
  value: string;
}): Promise<AdminCollectionContentRecord> {
  const response = await fetch(`/api/admin/collections/${encodeURIComponent(input.entryId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      section: input.section,
      data: buildTextSectionPayload({
        section: input.section,
        value: input.value
      })
    })
  });

  const payload = (await response.json()) as AdminCollectionTextSectionResponse;
  if (!response.ok || "error" in payload) {
    const code = "error" in payload ? payload.error.code : "ADMIN_COLLECTION_PATCH_FAILED";
    const message = "error" in payload ? payload.error.message : "Could not update collection detail section.";
    throw new AdminCollectionTextSectionMutationError(code, message);
  }

  return payload.data.content;
}
