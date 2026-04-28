import { NextRequest, NextResponse } from "next/server";

import { normalizeAdminCollectionLocationForm } from "@/lib/admin/admin-collection-location-form";
import { getRequestRole } from "@/lib/auth-session";
import { type ListingStatus } from "@/lib/property-service";
import { createMarketplacePropertyEntryPersistent } from "@/lib/property-marketplace-server";

type MarketplaceEntryRequest = {
  entryId?: unknown;
  title?: unknown;
  city?: unknown;
  country?: unknown;
  stateProvince?: unknown;
  address?: unknown;
  geoLat?: unknown;
  geoLng?: unknown;
  imageUrl?: unknown;
  shortDescription?: unknown;
  highlights?: unknown;
  investmentNotes?: unknown;
  supplyTotal?: unknown;
  nftPriceUsd?: unknown;
  annualRoiPct?: unknown;
  documents?: unknown;
  collectionAddress?: unknown;
  candyMachineAddress?: unknown;
  snapshotId?: unknown;
};

type MarketplaceDocumentInput = {
  label: string;
  url: string;
};

function readRequiredText(raw: unknown, fieldName: string): string {
  if (typeof raw !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const value = raw.trim();
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }

  return value;
}

function readNonNegativeNumber(raw: unknown, fieldName: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }

  return parsed;
}

function readPositiveInteger(raw: unknown, fieldName: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function parseHighlights(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function parseDocuments(raw: unknown): MarketplaceDocumentInput[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is { label?: unknown; url?: unknown } => Boolean(item) && typeof item === "object")
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      url: typeof item.url === "string" ? item.url.trim() : ""
    }))
    .filter((item) => item.label.length > 0 && item.url.length > 0)
    .slice(0, 12);
}

function buildExplorerUrl(collectionAddress: string): string {
  const encodedAddress = encodeURIComponent(collectionAddress);
  return `https://explorer.solana.com/address/${encodedAddress}?cluster=devnet`;
}

function normalizePayload(rawBody: unknown): {
  entryId: string;
  title: string;
  city: string;
  country: string;
  stateProvince: string | null;
  address: string;
  geoLat: number | null;
  geoLng: number | null;
  imageUrl: string;
  shortDescription: string;
  highlights: string[];
  investmentNotes: string;
  supplyTotal: number;
  nftPriceUsd: number;
  annualRoiPct: number;
  documents: MarketplaceDocumentInput[];
  collectionAddress: string;
  candyMachineAddress: string;
  snapshotId: string | null;
} {
  if (!rawBody || typeof rawBody !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = rawBody as MarketplaceEntryRequest;
  const entryId = readRequiredText(body.entryId, "entryId");
  const title = readRequiredText(body.title, "title");
  const locationForm = normalizeAdminCollectionLocationForm({
    country: body.country,
    stateProvince: body.stateProvince,
    city: body.city,
    address: body.address,
    geoLat: body.geoLat,
    geoLng: body.geoLng
  });
  const imageUrl = readRequiredText(body.imageUrl, "imageUrl");
  const shortDescription = readRequiredText(body.shortDescription, "shortDescription");
  const collectionAddress = readRequiredText(body.collectionAddress, "collectionAddress");
  const candyMachineAddress = readRequiredText(body.candyMachineAddress, "candyMachineAddress");

  const supplyTotal = readPositiveInteger(body.supplyTotal, "supplyTotal");
  const nftPriceUsd = readNonNegativeNumber(body.nftPriceUsd, "nftPriceUsd");
  const annualRoiPct = readNonNegativeNumber(body.annualRoiPct, "annualRoiPct");

  const highlights = parseHighlights(body.highlights);
  const documents = parseDocuments(body.documents);
  const investmentNotes = typeof body.investmentNotes === "string" && body.investmentNotes.trim()
    ? body.investmentNotes.trim()
    : "Marketplace entry created from admin console deploy workflow.";

  const snapshotId = typeof body.snapshotId === "string" && body.snapshotId.trim()
    ? body.snapshotId.trim()
    : null;

  return {
    entryId,
    title,
    city: locationForm.city,
    country: locationForm.country,
    stateProvince: locationForm.stateProvince,
    address: locationForm.address,
    geoLat: locationForm.geoLat,
    geoLng: locationForm.geoLng,
    imageUrl,
    shortDescription,
    highlights,
    investmentNotes,
    supplyTotal,
    nftPriceUsd,
    annualRoiPct,
    documents,
    collectionAddress,
    candyMachineAddress,
    snapshotId
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);
  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Admin role is required."
        }
      },
      { status: 403 }
    );
  }

  let payload: ReturnType<typeof normalizePayload>;
  try {
    const body = await request.json().catch(() => null);
    payload = normalizePayload(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request payload.";
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MARKETPLACE_ENTRY",
          message
        }
      },
      { status: 400 }
    );
  }

  try {
    const listingStatus: ListingStatus = "funding";
    const highlights = payload.highlights.length > 0
      ? payload.highlights
      : [
          `Collection ${payload.collectionAddress.slice(0, 8)}... linked`,
          "Created from admin deploy handoff",
          "Pending first mint confirmation"
        ];

    const documents = payload.documents;
    if (payload.snapshotId) {
      documents.unshift({
        label: "Mint snapshot",
        url: `snapshot:${payload.snapshotId}`
      });
    }

    const created = await createMarketplacePropertyEntryPersistent({
      id: payload.entryId,
      title: payload.title,
      city: payload.city,
      country: payload.country,
      stateProvince: payload.stateProvince,
      listingStatus,
      image: payload.imageUrl,
      shortDescription: payload.shortDescription,
      detailedLocation: payload.address,
      geoLat: payload.geoLat,
      geoLng: payload.geoLng,
      highlights,
      investmentNotes: payload.investmentNotes,
      supplyTotal: payload.supplyTotal,
      mintedOrSold: 0,
      nftPriceUsd: payload.nftPriceUsd,
      annualRoiPct: payload.annualRoiPct,
      availabilityLabel: "Funding abierto",
      documents,
      collectionAddress: payload.collectionAddress,
      assetMintAddress: payload.candyMachineAddress,
      explorerUrl: buildExplorerUrl(payload.collectionAddress),
      lastOnchainUpdate: null,
      syncStatus: "unavailable",
      createdBy: requestRole.pubkey
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        title: created.title,
        listingStatus: created.listingStatus,
        marketplaceUrl: `/marketplace/${created.id}`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create marketplace entry.";
    const status = message.includes("already exists") ? 409 : 500;

    return NextResponse.json(
      {
        error: {
          code: status === 409 ? "MARKETPLACE_ENTRY_CONFLICT" : "MARKETPLACE_ENTRY_CREATE_FAILED",
          message
        }
      },
      { status }
    );
  }
}
