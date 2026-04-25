import { z } from "zod";

import type {
  CollectionBootstrapDocumentItem,
  CollectionBootstrapGoogleMapsPlace,
  CollectionBootstrapImageItem
} from "@/lib/admin/collection-bootstrap-mapper";

export type AdminCollectionPatchSection =
  | "summary"
  | "propertyInformation"
  | "gallery"
  | "documents"
  | "googleMapsPlace";

export type AdminCollectionPatchPayloadErrorCode =
  | "INVALID_COLLECTION_PAYLOAD"
  | "IMMUTABLE_COVER_FIELD";

export type AdminCollectionPatchUpdate = {
  section: AdminCollectionPatchSection;
  fractionalInvestmentSummary?: string | null;
  propertyInformation?: string | null;
  galleryImages?: CollectionBootstrapImageItem[];
  propertyImages?: CollectionBootstrapImageItem[];
  documents?: CollectionBootstrapDocumentItem[];
  googleMapsPlace?: CollectionBootstrapGoogleMapsPlace | null;
};

export class AdminCollectionPatchPayloadError extends Error {
  readonly code: AdminCollectionPatchPayloadErrorCode;
  readonly status: number;

  constructor(code: AdminCollectionPatchPayloadErrorCode, message: string) {
    super(message);
    this.name = "AdminCollectionPatchPayloadError";
    this.code = code;
    this.status = 400;
  }
}

export function isAdminCollectionPatchPayloadError(
  error: unknown
): error is AdminCollectionPatchPayloadError {
  return error instanceof AdminCollectionPatchPayloadError;
}

const imageSourceSchema = z.enum(["upload", "snapshot", "marketplace"]);

const editableImageSchema = z.object({
  id: z.string().trim().min(1),
  url: z.string().trim().url(),
  title: z.string().trim().min(1),
  alt: z.string().trim().min(1),
  displayOrder: z.number().int().positive(),
  mimeType: z.string().trim().min(1).nullable(),
  fileName: z.string().trim().min(1).nullable(),
  fileRefId: z.string().trim().min(1).nullable(),
  source: imageSourceSchema
}).strict();

const documentTagSchema = z.enum([
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
]);

const editableDocumentSchema = z.object({
  id: z.string().trim().min(1),
  tag: documentTagSchema,
  title: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string(),
  url: z.string().trim().url(),
  displayOrder: z.number().int().positive(),
  mimeType: z.string().trim().min(1).nullable(),
  fileName: z.string().trim().min(1).nullable(),
  fileRefId: z.string().trim().min(1).nullable(),
  source: imageSourceSchema
}).strict();

const googleMapsPlaceSchema = z.object({
  placeLabel: z.string().trim().min(1),
  formattedAddress: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  googleMapsUrl: z.string().trim().url(),
  placeId: z.string().trim().min(1)
}).strict();

const nullableTextSchema = z.string().trim().min(1).nullable();

const summaryPayloadSchema = z.object({
  section: z.literal("summary"),
  data: z.object({
    fractionalInvestmentSummary: nullableTextSchema
  }).strict()
}).strict();

const propertyInformationPayloadSchema = z.object({
  section: z.literal("propertyInformation"),
  data: z.object({
    propertyInformation: nullableTextSchema
  }).strict()
}).strict();

const galleryPayloadSchema = z.object({
  section: z.literal("gallery"),
  data: z.object({
    galleryImages: z.array(editableImageSchema),
    propertyImages: z.array(editableImageSchema).optional()
  }).strict()
}).strict();

const documentsPayloadSchema = z.object({
  section: z.literal("documents"),
  data: z.object({
    documents: z.array(editableDocumentSchema)
  }).strict()
}).strict();

const googleMapsPlacePayloadSchema = z.object({
  section: z.literal("googleMapsPlace"),
  data: z.object({
    googleMapsPlace: googleMapsPlaceSchema.nullable()
  }).strict()
}).strict();

const collectionPatchPayloadSchema = z.discriminatedUnion("section", [
  summaryPayloadSchema,
  propertyInformationPayloadSchema,
  galleryPayloadSchema,
  documentsPayloadSchema,
  googleMapsPlacePayloadSchema
]);

const IMMUTABLE_COVER_FIELDS = new Set([
  "cover",
  "coverImage",
  "coverImageUrl",
  "image",
  "imageUrl",
  "image_url"
]);

function containsImmutableCoverField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsImmutableCoverField(item));
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (IMMUTABLE_COVER_FIELDS.has(key)) {
      return true;
    }

    if (containsImmutableCoverField(nestedValue)) {
      return true;
    }
  }

  return false;
}

function toValidationMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return "Collection PATCH payload is invalid.";
  }

  const path = firstIssue.path.length > 0 ? firstIssue.path.join(".") : "payload";
  return `Collection PATCH payload is invalid at ${path}: ${firstIssue.message}`;
}

export function parseAdminCollectionPatchPayload(payload: unknown): AdminCollectionPatchUpdate {
  if (containsImmutableCoverField(payload)) {
    throw new AdminCollectionPatchPayloadError(
      "IMMUTABLE_COVER_FIELD",
      "Collection cover fields are immutable from the admin collection editor."
    );
  }

  const result = collectionPatchPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new AdminCollectionPatchPayloadError(
      "INVALID_COLLECTION_PAYLOAD",
      toValidationMessage(result.error)
    );
  }

  switch (result.data.section) {
    case "summary":
      return {
        section: result.data.section,
        fractionalInvestmentSummary: result.data.data.fractionalInvestmentSummary
      };
    case "propertyInformation":
      return {
        section: result.data.section,
        propertyInformation: result.data.data.propertyInformation
      };
    case "gallery":
      return {
        section: result.data.section,
        galleryImages: result.data.data.galleryImages,
        propertyImages: result.data.data.propertyImages
      };
    case "documents":
      return {
        section: result.data.section,
        documents: result.data.data.documents
      };
    case "googleMapsPlace":
      return {
        section: result.data.section,
        googleMapsPlace: result.data.data.googleMapsPlace
      };
  }
}
