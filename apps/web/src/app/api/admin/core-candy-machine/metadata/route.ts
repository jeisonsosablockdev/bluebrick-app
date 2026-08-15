import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { deriveCoreCandyMachineNames } from "@/lib/core-candy-machine-naming";
import { createCoreMetadataRecord } from "@/lib/core-candy-machine-metadata-store";
import {
  createCoreCandyMachinePinataMetadataUris,
  isPinataConfigured,
  isPinataFileServiceError,
  resolveImageForPinata
} from "@/lib/infrastructure/pinata-file-service";

type MetadataBody = {
  collectionName?: unknown;
  assetNamePrefix?: unknown;
  internalCode?: unknown;
  symbol?: unknown;
  description?: unknown;
  image?: unknown;
  quantity?: unknown;
  startSerial?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    return fallback;
  }

  return numeric;
}

function sanitizeFileToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function buildTechnicalImageFileName(input: {
  internalCode: string;
  assetNamePrefix: string;
  imageUri: string;
}): string {
  const hint = sanitizeFileToken(input.internalCode || input.assetNamePrefix) || "asset";
  const digest = createHash("sha256").update(input.imageUri).digest("hex").slice(0, 10);
  return `cm-image-${hint}-${digest}`;
}

function imageMimeTypeFromUri(imageUri: string): string {
  const lower = imageUri.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  if (lower.endsWith(".gif")) {
    return "image/gif";
  }

  if (lower.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (lower.endsWith(".avif")) {
    return "image/avif";
  }

  return "image/jpeg";
}

function pinataErrorResponse(error: {
  code: string;
  message: string;
  status: number;
  providerStatus: number | null;
  providerCode: string | null;
  providerMessage: string | null;
}): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        providerStatus: error.providerStatus,
        providerCode: error.providerCode,
        providerMessage: error.providerMessage
      }
    },
    { status: error.status }
  );
}

function buildMetadataPayloads(input: {
  collectionName: string;
  assetNamePrefix: string;
  symbol: string;
  description: string;
  imageUri: string;
  imageContentType: string;
}): { collectionMetadata: Record<string, unknown>; assetMetadata: Record<string, unknown> } {
  const { collectionName, assetNamePrefix, symbol, description, imageUri, imageContentType } = input;

  return {
    collectionMetadata: {
      name: collectionName,
      symbol,
      description,
      image: imageUri,
      properties: {
        category: "image",
        files: [{ uri: imageUri, type: imageContentType }]
      }
    },
    assetMetadata: {
      name: `${assetNamePrefix} #$ID+1$`,
      symbol,
      description,
      image: imageUri,
      attributes: [],
      properties: {
        category: "image",
        files: [{ uri: imageUri, type: imageContentType }]
      }
    }
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as MetadataBody | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quantity = parsePositiveInteger(body.quantity, 1);
  const startSerial = parsePositiveInteger(body.startSerial, 1);
  const derivedNames = deriveCoreCandyMachineNames({
    collectionSource: asTrimmedString(body.collectionName) || "Collection",
    assetPrefixSource: asTrimmedString(body.assetNamePrefix) || "Asset",
    quantity,
    startSerial
  });
  const collectionName = derivedNames.collectionName;
  const assetNamePrefix = derivedNames.assetNamePrefix;
  const internalCode = asTrimmedString(body.internalCode);
  const symbol = asTrimmedString(body.symbol) || "NFT";
  const description = asTrimmedString(body.description) || "Core Candy Machine metadata";
  const image = asTrimmedString(body.image);

  if (!image) {
    return NextResponse.json({ error: "image is required to generate metadata URI." }, { status: 400 });
  }

  if (isPinataConfigured()) {
    try {
      const resolvedImage = await resolveImageForPinata({
        imageUri: image,
        name: buildTechnicalImageFileName({
          internalCode,
          assetNamePrefix,
          imageUri: image
        }),
        keyValues: {
          app: "brids",
          scope: "core-candy-machine",
          kind: "image",
          ...(internalCode ? { internalCode } : {})
        }
      });

      const metadataPayloads = buildMetadataPayloads({
        collectionName,
        assetNamePrefix,
        symbol,
        description,
        imageUri: resolvedImage.imageUri,
        imageContentType: resolvedImage.contentType
      });

      const pinned = await createCoreCandyMachinePinataMetadataUris({
        collectionName,
        assetNamePrefix,
        collectionMetadata: metadataPayloads.collectionMetadata,
        assetMetadata: metadataPayloads.assetMetadata
      });

      return NextResponse.json({
        provider: "pinata",
        resolvedCollectionName: collectionName,
        resolvedAssetNamePrefix: assetNamePrefix,
        collectionUri: pinned.collectionUri,
        assetUri: pinned.assetUri,
        collectionGatewayUrl: pinned.collectionGatewayUrl,
        assetGatewayUrl: pinned.assetGatewayUrl,
        imageUri: resolvedImage.imageUri,
        imageGatewayUrl: resolvedImage.imageGatewayUrl
      });
    } catch (error) {
      if (isPinataFileServiceError(error)) {
        return pinataErrorResponse(error);
      }

      const message = error instanceof Error ? error.message : "Could not generate Pinata metadata URIs.";
      return NextResponse.json({
        error: {
          code: "PINATA_METADATA_GENERATION_FAILED",
          message
        }
      }, { status: 502 });
    }
  }

  const localMetadata = buildMetadataPayloads({
    collectionName,
    assetNamePrefix,
    symbol,
    description,
    imageUri: image,
    imageContentType: imageMimeTypeFromUri(image)
  });

  const collectionRecord = createCoreMetadataRecord({
    kind: "collection",
    payload: localMetadata.collectionMetadata
  });

  const assetRecord = createCoreMetadataRecord({
    kind: "asset",
    payload: localMetadata.assetMetadata
  });

  const base = request.nextUrl.origin;

  return NextResponse.json({
    provider: "local",
    resolvedCollectionName: collectionName,
    resolvedAssetNamePrefix: assetNamePrefix,
    collectionUri: `${base}/api/admin/core-candy-machine/metadata/${collectionRecord.id}.json`,
    assetUri: `${base}/api/admin/core-candy-machine/metadata/${assetRecord.id}.json`
  });
}
