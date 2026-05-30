import "server-only";

import { withDbClient } from "@/lib/db/pool";
import {
  normalizeCollectionBootstrapDocumentsJson,
  normalizeCollectionBootstrapGoogleMapsPlaceJson,
  type CollectionBootstrapDocumentItem,
  type CollectionBootstrapGoogleMapsPlace,
  type CollectionBootstrapImageItem,
  type CollectionBootstrapPayload
} from "@/lib/admin/collection-bootstrap-mapper";
import {
  deriveAdminCanonicalLocationLabel,
  reconcileAdminCollectionGoogleMapsPlace
} from "@/lib/admin/admin-collection-location-sync";
import {
  getMarketplaceEntryLocationColumnSupport,
  type MarketplaceEntryLocationColumnSupport
} from "@/lib/admin/marketplace-entry-location-columns";

type MarketplaceEditableCollectionRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  state_province: string | null;
  postal_code: string | null;
  location_label: string;
  detailed_location: string;
  geo_lat: number | string | null;
  geo_lng: number | string | null;
  created_by: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  gallery_images_json: unknown;
  property_images_json: unknown;
  documents_json: unknown;
  fractional_investment_summary: string | null;
  property_information: string | null;
  google_maps_place_json: unknown;
  updated_by: string | null;
  updated_at: string | Date;
};

export type AdminCollectionContentRecord = {
  entryId: string;
  title: string;
  city: string;
  country: string;
  stateProvince: string | null;
  postalCode: string | null;
  locationLabel: string;
  detailedLocation: string;
  geoLat: number | null;
  geoLng: number | null;
  createdBy: string;
  coverImageUrl: string;
  collectionAddress: string;
  candyMachineAddress: string;
  galleryImages: CollectionBootstrapImageItem[];
  propertyImages: CollectionBootstrapImageItem[];
  documents: CollectionBootstrapDocumentItem[];
  fractionalInvestmentSummary: string | null;
  propertyInformation: string | null;
  googleMapsPlace: CollectionBootstrapGoogleMapsPlace | null;
  updatedBy: string | null;
  updatedAt: string;
};

export type UpdateAdminCollectionContentInput = {
  entryId: string;
  updatedBy: string;
  city?: string;
  country?: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  address?: string;
  geoLat?: number | null;
  geoLng?: number | null;
  galleryImages?: CollectionBootstrapImageItem[];
  propertyImages?: CollectionBootstrapImageItem[];
  documents?: CollectionBootstrapDocumentItem[];
  fractionalInvestmentSummary?: string | null;
  propertyInformation?: string | null;
  googleMapsPlace?: CollectionBootstrapGoogleMapsPlace | null;
};

export type ApplyCollectionBootstrapPayloadInput = {
  entryId: string;
  updatedBy: string;
  payload: CollectionBootstrapPayload;
};

type JsonUpdateAssignment = {
  assignment: string;
  value: unknown;
};

type ResolvedLocationUpdate = Pick<
  UpdateAdminCollectionContentInput,
  "city" | "country" | "stateProvince" | "postalCode" | "address" | "geoLat" | "geoLng" | "googleMapsPlace"
> & {
  locationLabel?: string;
};

function buildSelectCollectionContentColumns(
  support: MarketplaceEntryLocationColumnSupport
): string {
  return `
    SELECT
      id,
      title,
      city,
      country,
      ${support.stateProvince ? "state_province" : "NULL::text AS state_province"},
      ${support.postalCode ? "postal_code" : "NULL::text AS postal_code"},
      location_label,
      detailed_location,
      ${support.geoLat ? "geo_lat" : "NULL::double precision AS geo_lat"},
      ${support.geoLng ? "geo_lng" : "NULL::double precision AS geo_lng"},
      created_by,
      image_url,
      collection_address,
      asset_mint_address,
      gallery_images_json,
      property_images_json,
      documents_json,
      fractional_investment_summary,
      property_information,
      google_maps_place_json,
      updated_by,
      updated_at
    FROM marketplace_entries
  `;
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function toOptionalTrimmedText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

function toOptionalFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCollectionImageItems(
  value: unknown,
  kind: "gallery" | "property"
): CollectionBootstrapImageItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const titlePrefix = kind === "gallery" ? "Gallery image" : "Property image";
  const items: CollectionBootstrapImageItem[] = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) {
      continue;
    }

    const title = typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : `${titlePrefix} ${index + 1}`;
    const alt = typeof record.alt === "string" && record.alt.trim()
      ? record.alt.trim()
      : title;
    const id = typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : `${kind}-${index + 1}`;
    const displayOrder =
      typeof record.displayOrder === "number" && Number.isFinite(record.displayOrder)
        ? record.displayOrder
        : index + 1;
    const source =
      record.source === "upload" || record.source === "snapshot" || record.source === "marketplace"
        ? record.source
        : "marketplace";

    items.push({
      id,
      url,
      title,
      alt,
      displayOrder,
      mimeType: typeof record.mimeType === "string" ? record.mimeType.trim() || null : null,
      fileName: typeof record.fileName === "string" ? record.fileName.trim() || null : null,
      fileRefId: typeof record.fileRefId === "string" ? record.fileRefId.trim() || null : null,
      source
    });
  }

  return items.sort((left, right) => left.displayOrder - right.displayOrder);
}

function toAdminCollectionContentRecord(row: MarketplaceEditableCollectionRow): AdminCollectionContentRecord {
  return {
    entryId: row.id,
    title: row.title,
    city: row.city,
    country: row.country,
    stateProvince: toOptionalTrimmedText(row.state_province),
    postalCode: toOptionalTrimmedText(row.postal_code),
    locationLabel: row.location_label,
    detailedLocation: row.detailed_location,
    geoLat: toOptionalFiniteNumber(row.geo_lat),
    geoLng: toOptionalFiniteNumber(row.geo_lng),
    createdBy: row.created_by,
    coverImageUrl: row.image_url,
    collectionAddress: row.collection_address,
    candyMachineAddress: row.asset_mint_address,
    galleryImages: parseCollectionImageItems(row.gallery_images_json, "gallery"),
    propertyImages: parseCollectionImageItems(row.property_images_json, "property"),
    documents: normalizeCollectionBootstrapDocumentsJson(row.documents_json),
    fractionalInvestmentSummary: toOptionalTrimmedText(row.fractional_investment_summary),
    propertyInformation: toOptionalTrimmedText(row.property_information),
    googleMapsPlace: normalizeCollectionBootstrapGoogleMapsPlaceJson(row.google_maps_place_json),
    updatedBy: toOptionalTrimmedText(row.updated_by),
    updatedAt: toIsoString(row.updated_at)
  };
}

function buildJsonUpdateAssignments(
  input: UpdateAdminCollectionContentInput,
  support: MarketplaceEntryLocationColumnSupport
): JsonUpdateAssignment[] {
  const assignments: JsonUpdateAssignment[] = [];

  if (input.galleryImages !== undefined) {
    assignments.push({
      assignment: "gallery_images_json = $VALUE::jsonb",
      value: JSON.stringify(input.galleryImages)
    });
  }

  if (input.propertyImages !== undefined) {
    assignments.push({
      assignment: "property_images_json = $VALUE::jsonb",
      value: JSON.stringify(input.propertyImages)
    });
  }

  if (input.documents !== undefined) {
    assignments.push({
      assignment: "documents_json = $VALUE::jsonb",
      value: JSON.stringify(input.documents)
    });
  }

  if (input.fractionalInvestmentSummary !== undefined) {
    assignments.push({
      assignment: "fractional_investment_summary = $VALUE",
      value: toOptionalTrimmedText(input.fractionalInvestmentSummary)
    });
  }

  if (input.propertyInformation !== undefined) {
    assignments.push({
      assignment: "property_information = $VALUE",
      value: toOptionalTrimmedText(input.propertyInformation)
    });
  }

  if (input.googleMapsPlace !== undefined) {
    assignments.push({
      assignment: "google_maps_place_json = $VALUE::jsonb",
      value: input.googleMapsPlace === null ? null : JSON.stringify(input.googleMapsPlace)
    });
  }

  if (input.city !== undefined) {
    assignments.push({
      assignment: "city = $VALUE",
      value: toOptionalTrimmedText(input.city) ?? ""
    });
  }

  if (input.country !== undefined) {
    assignments.push({
      assignment: "country = $VALUE",
      value: toOptionalTrimmedText(input.country) ?? ""
    });
  }

  if (input.stateProvince !== undefined && support.stateProvince) {
    assignments.push({
      assignment: "state_province = $VALUE",
      value: toOptionalTrimmedText(input.stateProvince)
    });
  }

  if (input.postalCode !== undefined && support.postalCode) {
    assignments.push({
      assignment: "postal_code = $VALUE",
      value: toOptionalTrimmedText(input.postalCode)
    });
  }

  if (input.address !== undefined) {
    assignments.push({
      assignment: "detailed_location = $VALUE",
      value: toOptionalTrimmedText(input.address) ?? ""
    });
  }

  if ("locationLabel" in input && typeof (input as { locationLabel?: unknown }).locationLabel === "string") {
    assignments.push({
      assignment: "location_label = $VALUE",
      value: (input as { locationLabel: string }).locationLabel
    });
  }

  if (input.geoLat !== undefined && support.geoLat) {
    assignments.push({
      assignment: "geo_lat = $VALUE",
      value: input.geoLat
    });
  }

  if (input.geoLng !== undefined && support.geoLng) {
    assignments.push({
      assignment: "geo_lng = $VALUE",
      value: input.geoLng
    });
  }

  return assignments;
}

function hasCanonicalLocationFieldUpdate(input: UpdateAdminCollectionContentInput): boolean {
  return input.city !== undefined
    || input.country !== undefined
    || input.stateProvince !== undefined
    || input.postalCode !== undefined
    || input.address !== undefined
    || input.geoLat !== undefined
    || input.geoLng !== undefined;
}

async function resolveLocationUpdate(
  input: UpdateAdminCollectionContentInput
): Promise<ResolvedLocationUpdate | null> {
  const canonicalChanged = hasCanonicalLocationFieldUpdate(input);
  const mapsChanged = input.googleMapsPlace !== undefined;

  if (!canonicalChanged && !mapsChanged) {
    return null;
  }

  if (!canonicalChanged && mapsChanged) {
    return {
      googleMapsPlace: input.googleMapsPlace
    };
  }

  const current = await getAdminCollectionContentByEntryId(input.entryId);
  if (!current) {
    return null;
  }

  const nextLocation = {
    city: input.city ?? current.city,
    country: input.country ?? current.country,
    stateProvince: input.stateProvince !== undefined ? input.stateProvince : current.stateProvince,
    postalCode: input.postalCode !== undefined ? input.postalCode : current.postalCode,
    address: input.address ?? current.detailedLocation,
    geoLat: input.geoLat !== undefined ? input.geoLat : current.geoLat,
    geoLng: input.geoLng !== undefined ? input.geoLng : current.geoLng
  };

  const resolved: ResolvedLocationUpdate = {
    city: input.city,
    country: input.country,
    stateProvince: input.stateProvince,
    postalCode: input.postalCode,
    address: input.address,
    geoLat: input.geoLat,
    geoLng: input.geoLng
  };

  if (canonicalChanged) {
    resolved.locationLabel = deriveAdminCanonicalLocationLabel(nextLocation);
    const candidatePlace = input.googleMapsPlace !== undefined ? input.googleMapsPlace : current.googleMapsPlace;
    resolved.googleMapsPlace = reconcileAdminCollectionGoogleMapsPlace({
      location: nextLocation,
      googleMapsPlace: candidatePlace
    });
  }

  return resolved;
}

export async function listAdminCollectionContentsByEntryIds(entryIds: string[]): Promise<AdminCollectionContentRecord[]> {
  const normalizedEntryIds = unique(entryIds.map((entryId) => entryId.trim()));
  if (normalizedEntryIds.length === 0 || !isDatabaseConfigured()) {
    return [];
  }

  return withDbClient(async (client) => {
    const support = await getMarketplaceEntryLocationColumnSupport(client);
    const result = await client.query<MarketplaceEditableCollectionRow>(
      `${buildSelectCollectionContentColumns(support)}
       WHERE id = ANY($1::text[])`,
      [normalizedEntryIds]
    );

    const recordsById = new Map(result.rows.map((row) => [row.id, toAdminCollectionContentRecord(row)]));
    return normalizedEntryIds
      .map((entryId) => recordsById.get(entryId) ?? null)
      .filter((record): record is AdminCollectionContentRecord => record !== null);
  });
}

export async function getAdminCollectionContentByEntryId(entryId: string): Promise<AdminCollectionContentRecord | null> {
  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) {
    return null;
  }

  const records = await listAdminCollectionContentsByEntryIds([normalizedEntryId]);
  return records[0] ?? null;
}

export async function updateAdminCollectionContent(
  input: UpdateAdminCollectionContentInput
): Promise<AdminCollectionContentRecord | null> {
  const entryId = input.entryId.trim();
  const updatedBy = input.updatedBy.trim();

  if (!entryId) {
    return null;
  }

  if (!updatedBy) {
    throw new Error("updatedBy is required.");
  }

  if (!isDatabaseConfigured()) {
    return null;
  }

  const values: unknown[] = [entryId];
  return withDbClient(async (client) => {
    const support = await getMarketplaceEntryLocationColumnSupport(client);
    const resolvedLocationUpdate = await resolveLocationUpdate(input);
    const jsonAssignments = buildJsonUpdateAssignments({
      ...input,
      ...resolvedLocationUpdate
    } as UpdateAdminCollectionContentInput & { locationLabel?: string }, support);
    if (jsonAssignments.length === 0) {
      throw new Error("At least one editable collection field update is required.");
    }

    const assignments = jsonAssignments.map((assignment) => {
      values.push(assignment.value);
      return assignment.assignment.replace("$VALUE", `$${values.length}`);
    });

    values.push(updatedBy);
    const updatedByParam = `$${values.length}`;

    const result = await client.query<MarketplaceEditableCollectionRow>(
      `UPDATE marketplace_entries
       SET
         ${assignments.join(",\n         ")},
         updated_by = ${updatedByParam},
         updated_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         title,
         city,
         country,
         ${support.stateProvince ? "state_province," : "NULL::text AS state_province,"}
         ${support.postalCode ? "postal_code," : "NULL::text AS postal_code,"}
         location_label,
         detailed_location,
         ${support.geoLat ? "geo_lat," : "NULL::double precision AS geo_lat,"}
         ${support.geoLng ? "geo_lng," : "NULL::double precision AS geo_lng,"}
         created_by,
         image_url,
         collection_address,
         asset_mint_address,
         gallery_images_json,
         property_images_json,
         documents_json,
         fractional_investment_summary,
         property_information,
         google_maps_place_json,
         updated_by,
         updated_at`,
      values
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toAdminCollectionContentRecord(result.rows[0]);
  });
}

export async function applyCollectionBootstrapPayload(
  input: ApplyCollectionBootstrapPayloadInput
): Promise<AdminCollectionContentRecord | null> {
  return updateAdminCollectionContent({
    entryId: input.entryId,
    updatedBy: input.updatedBy,
    galleryImages: input.payload.galleryImagesJson,
    propertyImages: input.payload.propertyImagesJson,
    documents: input.payload.documentsJson,
    fractionalInvestmentSummary: input.payload.fractionalInvestmentSummary,
    propertyInformation: input.payload.propertyInformation,
    googleMapsPlace: input.payload.googleMapsPlaceJson,
    city: input.payload.city,
    country: input.payload.country,
    stateProvince: input.payload.stateProvince,
    postalCode: input.payload.postalCode,
    address: input.payload.address,
    geoLat: input.payload.geoLat,
    geoLng: input.payload.geoLng
  });
}
