import { randomUUID } from "node:crypto";

import { ASSET_UPLOAD_CATEGORIES, type AssetUploadCategory, type FinalizeUploadRequest, type SignedUrlRequest } from "@/lib/asset-uploads/types";

type ParseResult<T, E extends string> = { ok: true; value: T } | { ok: false; code: E; message: string };

type CategoryPolicy = {
  maxSizeBytes: number;
  allowedMimeTypes: ReadonlySet<string>;
  allowedExtensions: ReadonlySet<string>;
};

const FIVE_MB = 5 * 1024 * 1024;
const TEN_MB = 10 * 1024 * 1024;
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIME_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
  "application/pdf": ["pdf"],
  "text/csv": ["csv"],
  "application/vnd.ms-excel": ["xls", "csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"]
};

const IMAGE_MIME_TYPES = new Set<string>(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const IMAGE_EXTENSIONS = new Set<string>(["jpg", "jpeg", "png", "webp", "avif"]);
const DOCUMENT_MIME_TYPES = new Set<string>([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
const DOCUMENT_EXTENSIONS = new Set<string>(["pdf", "csv", "xls", "xlsx"]);

const CATEGORY_POLICY: Record<AssetUploadCategory, CategoryPolicy> = {
  galleryImage: {
    maxSizeBytes: FIVE_MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS
  },
  propertyImage: {
    maxSizeBytes: FIVE_MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS
  },
  brochureFile: {
    maxSizeBytes: TEN_MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    allowedExtensions: DOCUMENT_EXTENSIONS
  },
  legalDoc: {
    maxSizeBytes: TEN_MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    allowedExtensions: DOCUMENT_EXTENSIONS
  },
  financialDoc: {
    maxSizeBytes: TEN_MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    allowedExtensions: DOCUMENT_EXTENSIONS
  }
};

export function generateUploadId(): string {
  return randomUUID();
}

export function isUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value.trim());
}

export function isAssetUploadCategory(value: string): value is AssetUploadCategory {
  return (ASSET_UPLOAD_CATEGORIES as readonly string[]).includes(value);
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }

  if (value <= 0) {
    return null;
  }

  return value;
}

function normalizeMimeType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parseBodyAsRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function parseUuidField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return isUuidV4(normalized) ? normalized : null;
}

export function isValidContentMd5Base64(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  try {
    const decoded = Buffer.from(normalized, "base64");
    if (decoded.length !== 16) {
      return false;
    }
    return decoded.toString("base64") === normalized;
  } catch {
    return false;
  }
}

type SanitizedFileName = {
  originalFileName: string;
  sanitizedFileName: string;
  extension: string;
};

function normalizeExtension(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
}

export function sanitizeFileName(fileName: string): SanitizedFileName {
  const input = fileName.trim();
  const pathSegment = input.split(/[\\/]/).pop() ?? "";
  const normalized = pathSegment.normalize("NFKD");

  const dotIndex = normalized.lastIndexOf(".");
  const rawName = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
  const rawExtension = dotIndex > 0 ? normalized.slice(dotIndex + 1) : "";

  const sanitizedBase = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const extension = normalizeExtension(rawExtension);
  const safeBase = sanitizedBase || "file";
  const safeFileName = extension ? `${safeBase}.${extension}` : safeBase;

  return {
    originalFileName: input,
    sanitizedFileName: safeFileName,
    extension
  };
}

function extensionAllowedByMime(extension: string, mimeType: string): boolean {
  if (!extension) {
    return true;
  }

  const allowed = MIME_EXTENSIONS[mimeType];
  if (!allowed) {
    return false;
  }

  return allowed.includes(extension);
}

export function getCategoryPolicy(category: AssetUploadCategory): CategoryPolicy {
  return CATEGORY_POLICY[category];
}

function parseCategory(value: unknown): AssetUploadCategory | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return isAssetUploadCategory(normalized) ? normalized : null;
}

export function parseSignedUrlRequest(
  body: unknown
): ParseResult<SignedUrlRequest, "INVALID_UPLOAD_REQUEST" | "FILE_TOO_LARGE" | "MIME_NOT_ALLOWED"> {
  const record = parseBodyAsRecord(body);
  if (!record) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "Request body must be a JSON object."
    };
  }

  const category = parseCategory(record.category);
  if (!category) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "category is required and must be a supported upload category."
    };
  }

  const fileNameRaw = typeof record.fileName === "string" ? record.fileName.trim() : "";
  if (!fileNameRaw || fileNameRaw.length > 160) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "fileName is required and must be between 1 and 160 characters."
    };
  }

  const mimeType = normalizeMimeType(record.mimeType);
  if (!mimeType) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "mimeType is required."
    };
  }

  const sizeBytes = parsePositiveInteger(record.sizeBytes);
  if (!sizeBytes) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "sizeBytes must be a positive integer."
    };
  }

  if (!isValidContentMd5Base64(record.contentMd5Base64)) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "contentMd5Base64 is required and must be a valid Base64-encoded MD5 hash."
    };
  }

  const draftId = parseUuidField(record.draftId);
  if (!draftId) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "draftId is required and must be a UUIDv4."
    };
  }

  const policy = getCategoryPolicy(category);

  if (!policy.allowedMimeTypes.has(mimeType)) {
    return {
      ok: false,
      code: "MIME_NOT_ALLOWED",
      message: `mimeType ${mimeType} is not allowed for category ${category}.`
    };
  }

  if (sizeBytes > policy.maxSizeBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `sizeBytes exceeds maxSizeBytes (${policy.maxSizeBytes}) for category ${category}.`
    };
  }

  const fileNameParts = sanitizeFileName(fileNameRaw);
  if (fileNameParts.extension) {
    if (!policy.allowedExtensions.has(fileNameParts.extension)) {
      return {
        ok: false,
        code: "MIME_NOT_ALLOWED",
        message: `Extension .${fileNameParts.extension} is not allowed for category ${category}.`
      };
    }

    if (!extensionAllowedByMime(fileNameParts.extension, mimeType)) {
      return {
        ok: false,
        code: "MIME_NOT_ALLOWED",
        message: `Extension .${fileNameParts.extension} does not match mimeType ${mimeType}.`
      };
    }
  }

  return {
    ok: true,
    value: {
      category,
      fileName: fileNameRaw,
      mimeType,
      sizeBytes,
      contentMd5Base64: record.contentMd5Base64.trim(),
      draftId
    }
  };
}

export function parseFinalizeUploadRequest(
  body: unknown
): ParseResult<FinalizeUploadRequest, "INVALID_UPLOAD_REQUEST"> {
  const record = parseBodyAsRecord(body);
  if (!record) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "Request body must be a JSON object."
    };
  }

  const draftId = parseUuidField(record.draftId);
  if (!draftId) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "draftId is required and must be a UUIDv4."
    };
  }

  const sizeBytes = parsePositiveInteger(record.sizeBytes);
  if (!sizeBytes) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "sizeBytes must be a positive integer."
    };
  }

  const mimeType = normalizeMimeType(record.mimeType);
  if (!mimeType) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "mimeType is required."
    };
  }

  if (!isValidContentMd5Base64(record.contentMd5Base64)) {
    return {
      ok: false,
      code: "INVALID_UPLOAD_REQUEST",
      message: "contentMd5Base64 is required and must be a valid Base64-encoded MD5 hash."
    };
  }

  let etag: string | null = null;
  if (record.etag !== undefined && record.etag !== null) {
    if (typeof record.etag !== "string" || !record.etag.trim()) {
      return {
        ok: false,
        code: "INVALID_UPLOAD_REQUEST",
        message: "etag must be a non-empty string when provided."
      };
    }
    etag = record.etag.trim().replace(/^"+|"+$/g, "");
  }

  let previousCdnUrl: string | null = null;
  if (record.previousCdnUrl !== undefined && record.previousCdnUrl !== null) {
    if (typeof record.previousCdnUrl !== "string" || !record.previousCdnUrl.trim()) {
      return {
        ok: false,
        code: "INVALID_UPLOAD_REQUEST",
        message: "previousCdnUrl must be a non-empty string when provided."
      };
    }

    previousCdnUrl = record.previousCdnUrl.trim();
  }

  return {
    ok: true,
    value: {
      draftId,
      etag,
      sizeBytes,
      mimeType,
      contentMd5Base64: record.contentMd5Base64.trim(),
      previousCdnUrl
    }
  };
}

function defaultExtensionForMimeType(mimeType: string): string {
  const candidates = MIME_EXTENSIONS[mimeType];
  return candidates?.[0] ?? "bin";
}

type BuildObjectKeyInput = {
  category: AssetUploadCategory;
  draftId: string;
  fileName: string;
  contentMd5Base64: string;
  mimeType: string;
  now?: Date;
  nonce?: string;
};

export function buildVersionedObjectKey(input: BuildObjectKeyInput): string {
  const sanitized = sanitizeFileName(input.fileName);
  const timestamp = (input.now ?? new Date()).toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const nonce = (input.nonce ?? randomUUID().split("-")[0]).toLowerCase();
  const md5Token = input.contentMd5Base64.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 12) || "nomd5";
  const extension = sanitized.extension || defaultExtensionForMimeType(input.mimeType);
  const base = sanitized.sanitizedFileName.replace(/\.[a-z0-9]{1,10}$/i, "");

  return `admin-assets/${input.category}/${input.draftId}/${timestamp}-${nonce}-${base}-${md5Token}.${extension}`;
}
