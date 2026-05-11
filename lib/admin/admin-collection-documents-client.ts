import type {
  CollectionBootstrapDocumentItem,
  CollectionBootstrapDocumentTag
} from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

type AdminCollectionDetailErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionDocumentsSuccessResponse = {
  ok: true;
  data: {
    section: "documents";
    content: AdminCollectionContentRecord;
  };
};

type AdminCollectionDocumentsResponse =
  | AdminCollectionDocumentsSuccessResponse
  | AdminCollectionDetailErrorResponse;

export type AdminCollectionDocumentDraft = {
  id: string;
  tag: CollectionBootstrapDocumentTag;
  title: string;
  label: string;
  description: string;
  url: string;
  displayOrder: number;
  mimeType: string | null;
  fileName: string | null;
  fileRefId: string | null;
  source: "upload" | "snapshot" | "marketplace";
};

export class AdminCollectionDocumentsMutationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AdminCollectionDocumentsMutationError";
    this.code = code;
  }
}

export function createEmptyAdminCollectionDocumentDraft(input: {
  index: number;
}): AdminCollectionDocumentDraft {
  return {
    id: `document-draft-${input.index}`,
    tag: "other",
    title: "",
    label: "",
    description: "",
    url: "",
    displayOrder: input.index + 1,
    mimeType: null,
    fileName: null,
    fileRefId: null,
    source: "marketplace"
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string): string {
  return value.trim();
}

export function normalizeAdminCollectionDocumentDrafts(
  drafts: AdminCollectionDocumentDraft[]
): CollectionBootstrapDocumentItem[] {
  return drafts.map((draft, index) => ({
    id: normalizeRequiredText(draft.id),
    tag: draft.tag,
    title: normalizeRequiredText(draft.title),
    label: normalizeRequiredText(draft.label),
    description: draft.description.trim(),
    url: normalizeRequiredText(draft.url),
    displayOrder: index + 1,
    mimeType: normalizeOptionalText(draft.mimeType),
    fileName: normalizeOptionalText(draft.fileName),
    fileRefId: normalizeOptionalText(draft.fileRefId),
    source: draft.source
  }));
}

export function isAdminCollectionDocumentsDirty(input: {
  persistedDocuments: CollectionBootstrapDocumentItem[];
  draftDocuments: AdminCollectionDocumentDraft[];
}): boolean {
  return JSON.stringify(input.persistedDocuments) !== JSON.stringify(
    normalizeAdminCollectionDocumentDrafts(input.draftDocuments)
  );
}

function validateNormalizedDocuments(documents: CollectionBootstrapDocumentItem[]): void {
  for (const [index, document] of documents.entries()) {
    if (!document.id) {
      throw new AdminCollectionDocumentsMutationError(
        "INVALID_COLLECTION_PAYLOAD",
        `Document ${index + 1} is missing its id.`
      );
    }

    if (!document.label) {
      throw new AdminCollectionDocumentsMutationError(
        "INVALID_COLLECTION_PAYLOAD",
        `Document ${index + 1} is missing its label.`
      );
    }

    if (!document.title) {
      throw new AdminCollectionDocumentsMutationError(
        "INVALID_COLLECTION_PAYLOAD",
        `Document ${index + 1} is missing its title.`
      );
    }

    if (!document.url) {
      throw new AdminCollectionDocumentsMutationError(
        "INVALID_COLLECTION_PAYLOAD",
        `Document ${index + 1} is missing its URL.`
      );
    }

    try {
      new URL(document.url);
    } catch {
      throw new AdminCollectionDocumentsMutationError(
        "INVALID_COLLECTION_PAYLOAD",
        `Document ${index + 1} must use a valid URL.`
      );
    }
  }
}

export async function updateAdminCollectionDocuments(input: {
  entryId: string;
  documents: AdminCollectionDocumentDraft[];
}): Promise<AdminCollectionContentRecord> {
  const normalizedDocuments = normalizeAdminCollectionDocumentDrafts(input.documents);
  validateNormalizedDocuments(normalizedDocuments);

  const response = await fetch(`/api/admin/collections/${encodeURIComponent(input.entryId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      section: "documents",
      data: {
        documents: normalizedDocuments
      }
    })
  });

  const payload = (await response.json()) as AdminCollectionDocumentsResponse;
  if (!response.ok || "error" in payload) {
    const code = "error" in payload ? payload.error.code : "ADMIN_COLLECTION_PATCH_FAILED";
    const message = "error" in payload ? payload.error.message : "Could not update collection documents.";
    throw new AdminCollectionDocumentsMutationError(code, message);
  }

  return payload.data.content;
}
