import type { AssetUploadCategory, UploadedFileRefWithCategory } from "@/lib/asset-uploads/types";

export type CollectionBootstrapStatus = "ready" | "manual_review_required";
export type CollectionBootstrapReasonCode =
  | "upload_refs_invalid"
  | "gallery_images_invalid"
  | "property_images_invalid"
  | "brochure_file_invalid"
  | "legal_docs_invalid"
  | "financial_docs_invalid"
  | "gallery_upload_refs_unresolved"
  | "property_upload_refs_unresolved"
  | "brochure_upload_refs_unresolved"
  | "legal_upload_refs_unresolved"
  | "financial_upload_refs_unresolved"
  | "existing_documents_invalid"
  | "fractional_investment_summary_invalid"
  | "property_information_invalid"
  | "google_maps_place_invalid";

export type CollectionBootstrapImageItem = {
  id: string;
  url: string;
  title: string;
  alt: string;
  displayOrder: number;
  mimeType: string | null;
  fileName: string | null;
  fileRefId: string | null;
  source: "upload" | "snapshot" | "marketplace";
};

export type CollectionBootstrapDocumentTag =
  | "brochure"
  | "legal"
  | "financial"
  | "title-report"
  | "appraisal"
  | "lease"
  | "agreement"
  | "inspection"
  | "tax"
  | "insurance"
  | "permit"
  | "floor-plan"
  | "other";

export type CollectionBootstrapDocumentItem = {
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

export type CollectionBootstrapGoogleMapsPlace = {
  placeLabel: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  placeId: string;
};

export type CollectionBootstrapPayload = {
  galleryImagesJson: CollectionBootstrapImageItem[];
  propertyImagesJson: CollectionBootstrapImageItem[];
  documentsJson: CollectionBootstrapDocumentItem[];
  fractionalInvestmentSummary: string | null;
  propertyInformation: string | null;
  googleMapsPlaceJson: CollectionBootstrapGoogleMapsPlace | null;
};

export type CollectionBootstrapInput = {
  formSnapshot: Record<string, unknown>;
  uploadedFiles: UploadedFileRefWithCategory[];
  existingDocumentsJson?: unknown;
};

export type CollectionBootstrapResult = {
  status: CollectionBootstrapStatus;
  reasonCodes: CollectionBootstrapReasonCode[];
  warnings: string[];
  payload: CollectionBootstrapPayload;
};

type ImageFieldKey = "galleryImages" | "propertyImages";
type DocumentFieldKey = "brochureFile" | "legalDocs" | "financialDocs";
type UploadRefsShape = Partial<Record<ImageFieldKey | DocumentFieldKey, string[]>>;
type SnapshotDocumentSeed = {
  tag: CollectionBootstrapDocumentTag;
  label: string;
  urls: string[];
  refs: string[];
  category: AssetUploadCategory;
};

const DOCUMENT_TAG_VALUES: CollectionBootstrapDocumentTag[] = [
  "brochure",
  "legal",
  "financial",
  "title-report",
  "appraisal",
  "lease",
  "agreement",
  "inspection",
  "tax",
  "insurance",
  "permit",
  "floor-plan",
  "other"
];

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toOptionalTextField(
  value: unknown,
  reasonCode: CollectionBootstrapReasonCode,
  reasonCodes: Set<CollectionBootstrapReasonCode>
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = toTrimmedString(value);
  if (normalized) {
    return normalized;
  }

  reasonCodes.add(reasonCode);
  return null;
}

function parseStringList(
  value: unknown,
  reasonCode: CollectionBootstrapReasonCode,
  reasonCodes: Set<CollectionBootstrapReasonCode>
): string[] {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    return toTrimmedString(value) ? [value.trim()] : [];
  }

  if (!Array.isArray(value)) {
    reasonCodes.add(reasonCode);
    return [];
  }

  const normalized: string[] = [];
  for (const item of value) {
    const parsed = toTrimmedString(item);
    if (parsed === null) {
      reasonCodes.add(reasonCode);
      continue;
    }
    normalized.push(parsed);
  }

  return normalized;
}

function parseUploadRefs(
  value: unknown,
  reasonCodes: Set<CollectionBootstrapReasonCode>
): UploadRefsShape {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    reasonCodes.add("upload_refs_invalid");
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    galleryImages: parseStringList(record.galleryImages, "upload_refs_invalid", reasonCodes),
    propertyImages: parseStringList(record.propertyImages, "upload_refs_invalid", reasonCodes),
    brochureFile: parseStringList(record.brochureFile, "upload_refs_invalid", reasonCodes),
    legalDocs: parseStringList(record.legalDocs, "upload_refs_invalid", reasonCodes),
    financialDocs: parseStringList(record.financialDocs, "upload_refs_invalid", reasonCodes)
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeUrlKey(url: string): string {
  return url.trim();
}

function collectDedupKeys(fileRefId: string | null, url: string): string[] {
  const keys = [normalizeUrlKey(url)];
  if (fileRefId) {
    keys.unshift(fileRefId);
  }
  return keys;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFileNameFromPath(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const segment = parsed.pathname.split("/").pop()?.trim() ?? "";
    return segment.length > 0 ? decodeURIComponent(segment) : null;
  } catch {
    const segment = value.split("/").pop()?.trim() ?? "";
    return segment.length > 0 ? segment : null;
  }
}

function toUploadSortKey(uploadedAt: string, createdAt: string, fileRefId: string): string {
  return `${uploadedAt}|${createdAt}|${fileRefId}`;
}

function sortUploads(files: UploadedFileRefWithCategory[]): UploadedFileRefWithCategory[] {
  return [...files].sort((left, right) =>
    toUploadSortKey(left.uploadedAt, left.createdAt, left.fileRefId)
      .localeCompare(toUploadSortKey(right.uploadedAt, right.createdAt, right.fileRefId))
  );
}

function buildImageItem(input: {
  kind: "gallery" | "property";
  index: number;
  url: string;
  fileRefId: string | null;
  mimeType: string | null;
  fileName: string | null;
  source: "upload" | "snapshot" | "marketplace";
}): CollectionBootstrapImageItem {
  const ordinal = input.index + 1;
  const titlePrefix = input.kind === "gallery" ? "Gallery image" : "Property image";
  const slugSeed = input.fileRefId ?? input.fileName ?? input.url;

  return {
    id: `${input.kind}-${slugify(slugSeed) || ordinal}`,
    url: input.url,
    title: `${titlePrefix} ${ordinal}`,
    alt: `${titlePrefix} ${ordinal}`,
    displayOrder: ordinal,
    mimeType: input.mimeType,
    fileName: input.fileName,
    fileRefId: input.fileRefId,
    source: input.source
  };
}

function toDocumentTag(value: string | null): CollectionBootstrapDocumentTag {
  if (!value) {
    return "other";
  }

  const normalized = value.trim().toLowerCase();
  if ((DOCUMENT_TAG_VALUES as string[]).includes(normalized)) {
    return normalized as CollectionBootstrapDocumentTag;
  }

  if (normalized.includes("brochure") || normalized.includes("prospect") || normalized.includes("pitch")) {
    return "brochure";
  }
  if (normalized.includes("legal")) {
    return "legal";
  }
  if (normalized.includes("financial") || normalized.includes("finance")) {
    return "financial";
  }
  if (normalized.includes("title")) {
    return "title-report";
  }
  if (normalized.includes("appraisal")) {
    return "appraisal";
  }
  if (normalized.includes("lease")) {
    return "lease";
  }
  if (normalized.includes("agreement")) {
    return "agreement";
  }
  if (normalized.includes("inspection")) {
    return "inspection";
  }
  if (normalized.includes("tax")) {
    return "tax";
  }
  if (normalized.includes("insurance")) {
    return "insurance";
  }
  if (normalized.includes("permit")) {
    return "permit";
  }
  if (normalized.includes("floor") && normalized.includes("plan")) {
    return "floor-plan";
  }

  return "other";
}

function buildDocumentItem(input: {
  tag: CollectionBootstrapDocumentTag;
  title: string;
  label: string;
  url: string;
  index: number;
  fileRefId: string | null;
  mimeType: string | null;
  fileName: string | null;
  source: "upload" | "snapshot" | "marketplace";
  description?: string | null;
  idSeed?: string | null;
}): CollectionBootstrapDocumentItem {
  const slugSeed = input.idSeed ?? input.fileRefId ?? input.fileName ?? input.label ?? input.url;

  return {
    id: `document-${slugify(slugSeed) || input.index + 1}`,
    tag: input.tag,
    title: input.title,
    label: input.label,
    description: input.description?.trim() ?? "",
    url: input.url,
    displayOrder: input.index + 1,
    mimeType: input.mimeType,
    fileName: input.fileName,
    fileRefId: input.fileRefId,
    source: input.source
  };
}

function parseExistingDocumentsJson(
  value: unknown,
  reasonCodes: Set<CollectionBootstrapReasonCode>
): CollectionBootstrapDocumentItem[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    reasonCodes.add("existing_documents_invalid");
    return [];
  }

  const documents: CollectionBootstrapDocumentItem[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      reasonCodes.add("existing_documents_invalid");
      continue;
    }

    const record = item as Record<string, unknown>;
    const url = toTrimmedString(record.url);
    if (!url) {
      reasonCodes.add("existing_documents_invalid");
      continue;
    }

    const label = toTrimmedString(record.label) ?? toTrimmedString(record.title) ?? `Document ${index + 1}`;
    const title = toTrimmedString(record.title) ?? label;
    const tag = toDocumentTag(toTrimmedString(record.tag) ?? label);
    const fileRefId = toTrimmedString(record.fileRefId);
    const mimeType = toTrimmedString(record.mimeType);
    const fileName = toTrimmedString(record.fileName) ?? toFileNameFromPath(url);
    const description = toTrimmedString(record.description);
    const idSeed = toTrimmedString(record.id) ?? fileRefId ?? fileName ?? url;

    documents.push(
      buildDocumentItem({
        tag,
        title,
        label,
        url,
        index,
        fileRefId,
        mimeType,
        fileName,
        source: "marketplace",
        description,
        idSeed
      })
    );
  }

  return documents;
}

function resolveUploadsByRefs(input: {
  refs: string[];
  fallbackUrls: string[];
  uploadedFiles: UploadedFileRefWithCategory[];
  warnings: string[];
}): Array<
  | { type: "upload"; file: UploadedFileRefWithCategory }
  | { type: "snapshot"; url: string }
> {
  const uploadsByRef = new Map(input.uploadedFiles.map((item) => [item.fileRefId, item]));
  const resolved: Array<
    | { type: "upload"; file: UploadedFileRefWithCategory }
    | { type: "snapshot"; url: string }
  > = [];

  for (const [index, ref] of input.refs.entries()) {
    const upload = uploadsByRef.get(ref);
    if (upload) {
      resolved.push({ type: "upload", file: upload });
      continue;
    }

    const fallbackUrl = input.fallbackUrls[index];
    if (fallbackUrl) {
      input.warnings.push(`Fell back to snapshot URL for unresolved upload ref ${ref}.`);
      resolved.push({ type: "snapshot", url: fallbackUrl });
      continue;
    }

    resolved.push({ type: "snapshot", url: "" });
  }

  return resolved;
}

function mapImageGroup(input: {
  kind: "gallery" | "property";
  refs: string[];
  fallbackUrls: string[];
  uploadedFiles: UploadedFileRefWithCategory[];
  warnings: string[];
}): { items: CollectionBootstrapImageItem[]; unresolved: boolean } {
  const uniqueFallbackUrls = uniqueStrings(input.fallbackUrls);
  const files = sortUploads(input.uploadedFiles);
  const resolved =
    input.refs.length > 0
      ? resolveUploadsByRefs({
          refs: uniqueStrings(input.refs),
          fallbackUrls: uniqueFallbackUrls,
          uploadedFiles: files,
          warnings: input.warnings
        })
      : files.map((file) => ({ type: "upload" as const, file }));

  const items: CollectionBootstrapImageItem[] = [];
  const seenKeys = new Set<string>();
  let unresolved = false;

  for (const entry of resolved) {
    if (entry.type === "upload") {
      const keys = collectDedupKeys(entry.file.fileRefId, entry.file.cdnUrl);
      if (keys.some((key) => seenKeys.has(key))) {
        continue;
      }
      for (const key of keys) {
        seenKeys.add(key);
      }
      items.push(
        buildImageItem({
          kind: input.kind,
          index: items.length,
          url: entry.file.cdnUrl,
          fileRefId: entry.file.fileRefId,
          mimeType: entry.file.mimeType,
          fileName: toFileNameFromPath(entry.file.objectKey) ?? toFileNameFromPath(entry.file.cdnUrl),
          source: "upload"
        })
      );
      continue;
    }

    if (!entry.url) {
      unresolved = true;
      continue;
    }

    const key = normalizeUrlKey(entry.url);
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    items.push(
      buildImageItem({
        kind: input.kind,
        index: items.length,
        url: entry.url,
        fileRefId: null,
        mimeType: null,
        fileName: toFileNameFromPath(entry.url),
        source: "snapshot"
      })
    );
  }

  for (const fallbackUrl of uniqueFallbackUrls) {
    const key = normalizeUrlKey(fallbackUrl);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    items.push(
      buildImageItem({
        kind: input.kind,
        index: items.length,
        url: fallbackUrl,
        fileRefId: null,
        mimeType: null,
        fileName: toFileNameFromPath(fallbackUrl),
        source: "snapshot"
      })
    );
  }

  return { items, unresolved };
}

function documentLabelFor(tag: CollectionBootstrapDocumentTag, ordinal: number): string {
  if (tag === "brochure") {
    return "Brochure";
  }
  if (tag === "legal") {
    return `Legal document ${ordinal}`;
  }
  if (tag === "financial") {
    return `Financial document ${ordinal}`;
  }
  return `Document ${ordinal}`;
}

function mapSnapshotDocuments(
  input: SnapshotDocumentSeed[],
  uploadedFiles: UploadedFileRefWithCategory[],
  warnings: string[]
): { items: CollectionBootstrapDocumentItem[]; unresolvedReasonCodes: CollectionBootstrapReasonCode[] } {
  const filesByCategory = new Map<AssetUploadCategory, UploadedFileRefWithCategory[]>();
  for (const file of sortUploads(uploadedFiles)) {
    const collection = filesByCategory.get(file.category) ?? [];
    collection.push(file);
    filesByCategory.set(file.category, collection);
  }

  const unresolvedReasonCodes: CollectionBootstrapReasonCode[] = [];
  const items: CollectionBootstrapDocumentItem[] = [];
  const seenKeys = new Set<string>();
  const tagCounters = new Map<CollectionBootstrapDocumentTag, number>();

  const pushItem = (item: CollectionBootstrapDocumentItem): void => {
    const keys = collectDedupKeys(item.fileRefId, item.url);
    if (keys.some((key) => seenKeys.has(key))) {
      return;
    }
    for (const key of keys) {
      seenKeys.add(key);
    }
    items.push({
      ...item,
      displayOrder: items.length + 1
    });
  };

  for (const seed of input) {
    const refs = uniqueStrings(seed.refs);
    const fallbackUrls = uniqueStrings(seed.urls);
    const categoryUploads = filesByCategory.get(seed.category) ?? [];
    const resolved =
      refs.length > 0
        ? resolveUploadsByRefs({
            refs,
            fallbackUrls,
            uploadedFiles: categoryUploads,
            warnings
          })
        : categoryUploads.map((file) => ({ type: "upload" as const, file }));

    for (const entry of resolved) {
      const nextCount = (tagCounters.get(seed.tag) ?? 0) + 1;
      tagCounters.set(seed.tag, nextCount);
      const label = documentLabelFor(seed.tag, nextCount);

      if (entry.type === "upload") {
        pushItem(
          buildDocumentItem({
            tag: seed.tag,
            title: label,
            label,
            url: entry.file.cdnUrl,
            index: items.length,
            fileRefId: entry.file.fileRefId,
            mimeType: entry.file.mimeType,
            fileName: toFileNameFromPath(entry.file.objectKey) ?? toFileNameFromPath(entry.file.cdnUrl),
            source: "upload"
          })
        );
        continue;
      }

      if (!entry.url) {
        unresolvedReasonCodes.push(
          seed.tag === "brochure"
            ? "brochure_upload_refs_unresolved"
            : seed.tag === "legal"
              ? "legal_upload_refs_unresolved"
              : "financial_upload_refs_unresolved"
        );
        continue;
      }

      pushItem(
        buildDocumentItem({
          tag: seed.tag,
          title: label,
          label,
          url: entry.url,
          index: items.length,
          fileRefId: null,
          mimeType: null,
          fileName: toFileNameFromPath(entry.url),
          source: "snapshot"
        })
      );
    }

    for (const url of fallbackUrls) {
      const label = documentLabelFor(seed.tag, (tagCounters.get(seed.tag) ?? 0) + 1);
      pushItem(
        buildDocumentItem({
          tag: seed.tag,
          title: label,
          label,
          url,
          index: items.length,
          fileRefId: null,
          mimeType: null,
          fileName: toFileNameFromPath(url),
          source: "snapshot"
        })
      );
      tagCounters.set(seed.tag, (tagCounters.get(seed.tag) ?? 0) + 1);
    }
  }

  return {
    items,
    unresolvedReasonCodes
  };
}

function mergeDocuments(
  existing: CollectionBootstrapDocumentItem[],
  incoming: CollectionBootstrapDocumentItem[]
): CollectionBootstrapDocumentItem[] {
  const merged: CollectionBootstrapDocumentItem[] = [];
  const seenKeys = new Set<string>();

  for (const item of [...existing, ...incoming]) {
    const keys = collectDedupKeys(item.fileRefId, item.url);
    if (keys.some((key) => seenKeys.has(key))) {
      continue;
    }

    for (const key of keys) {
      seenKeys.add(key);
    }
    merged.push({
      ...item,
      displayOrder: merged.length + 1
    });
  }

  return merged;
}

function parseGoogleMapsPlace(
  formSnapshot: Record<string, unknown>,
  reasonCodes: Set<CollectionBootstrapReasonCode>
): CollectionBootstrapGoogleMapsPlace | null {
  const candidate = formSnapshot.googleMapsPlaceJson ?? formSnapshot.googleMapsPlace;
  if (candidate === undefined || candidate === null) {
    return null;
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    reasonCodes.add("google_maps_place_invalid");
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const placeLabel = toTrimmedString(record.placeLabel);
  const formattedAddress = toTrimmedString(record.formattedAddress);
  const googleMapsUrl = toTrimmedString(record.googleMapsUrl);
  const placeId = toTrimmedString(record.placeId);
  const lat = typeof record.lat === "number" && Number.isFinite(record.lat) ? record.lat : null;
  const lng = typeof record.lng === "number" && Number.isFinite(record.lng) ? record.lng : null;

  if (!placeLabel || !formattedAddress || !googleMapsUrl || !placeId || lat === null || lng === null) {
    reasonCodes.add("google_maps_place_invalid");
    return null;
  }

  return {
    placeLabel,
    formattedAddress,
    lat,
    lng,
    googleMapsUrl,
    placeId
  };
}

export function mapCollectionBootstrapFromSnapshot(input: CollectionBootstrapInput): CollectionBootstrapResult {
  const reasonCodes = new Set<CollectionBootstrapReasonCode>();
  const warnings: string[] = [];
  const uploadRefs = parseUploadRefs(input.formSnapshot.uploadRefs, reasonCodes);

  const galleryFallbackUrls = parseStringList(input.formSnapshot.galleryImages, "gallery_images_invalid", reasonCodes);
  const propertyFallbackUrls = parseStringList(input.formSnapshot.propertyImages, "property_images_invalid", reasonCodes);
  const brochureFallbackUrls = parseStringList(input.formSnapshot.brochureFile, "brochure_file_invalid", reasonCodes);
  const legalFallbackUrls = parseStringList(input.formSnapshot.legalDocs, "legal_docs_invalid", reasonCodes);
  const financialFallbackUrls = parseStringList(input.formSnapshot.financialDocs, "financial_docs_invalid", reasonCodes);

  const uploadedFiles = sortUploads(input.uploadedFiles);

  const galleryGroup = mapImageGroup({
    kind: "gallery",
    refs: uploadRefs.galleryImages ?? [],
    fallbackUrls: galleryFallbackUrls,
    uploadedFiles: uploadedFiles.filter((item) => item.category === "galleryImage"),
    warnings
  });
  if (galleryGroup.unresolved) {
    reasonCodes.add("gallery_upload_refs_unresolved");
  }

  const propertyGroup = mapImageGroup({
    kind: "property",
    refs: uploadRefs.propertyImages ?? [],
    fallbackUrls: propertyFallbackUrls,
    uploadedFiles: uploadedFiles.filter((item) => item.category === "propertyImage"),
    warnings
  });
  if (propertyGroup.unresolved) {
    reasonCodes.add("property_upload_refs_unresolved");
  }

  const snapshotDocuments = mapSnapshotDocuments(
    [
      {
        tag: "brochure",
        label: "Brochure",
        urls: brochureFallbackUrls,
        refs: uploadRefs.brochureFile ?? [],
        category: "brochureFile"
      },
      {
        tag: "legal",
        label: "Legal document",
        urls: legalFallbackUrls,
        refs: uploadRefs.legalDocs ?? [],
        category: "legalDoc"
      },
      {
        tag: "financial",
        label: "Financial document",
        urls: financialFallbackUrls,
        refs: uploadRefs.financialDocs ?? [],
        category: "financialDoc"
      }
    ],
    uploadedFiles,
    warnings
  );

  for (const code of snapshotDocuments.unresolvedReasonCodes) {
    reasonCodes.add(code);
  }

  const existingDocuments = parseExistingDocumentsJson(input.existingDocumentsJson, reasonCodes);
  const mergedDocuments = mergeDocuments(existingDocuments, snapshotDocuments.items);

  const payload: CollectionBootstrapPayload = {
    galleryImagesJson: galleryGroup.items,
    propertyImagesJson: propertyGroup.items,
    documentsJson: mergedDocuments,
    fractionalInvestmentSummary: toOptionalTextField(
      input.formSnapshot.investmentThesis,
      "fractional_investment_summary_invalid",
      reasonCodes
    ),
    propertyInformation: toOptionalTextField(
      input.formSnapshot.longDescription,
      "property_information_invalid",
      reasonCodes
    ),
    googleMapsPlaceJson: parseGoogleMapsPlace(input.formSnapshot, reasonCodes)
  };

  return {
    status: reasonCodes.size > 0 ? "manual_review_required" : "ready",
    reasonCodes: Array.from(reasonCodes),
    warnings,
    payload
  };
}
