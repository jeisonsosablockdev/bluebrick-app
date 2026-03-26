import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { DasClient, isDasClientError } from "@/lib/das-client";

type AvatarNftItem = {
  assetId: string;
  name: string;
  symbol: string | null;
  imageUrl: string;
};

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;
const MAX_SCAN_PAGES = 3;
const IPFS_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Wallet authentication is required."
      }
    },
    { status: 401 }
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeImageUri(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const candidate = value.trim();

  if (!candidate) {
    return null;
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  if (/^ipfs:\/\//i.test(candidate)) {
    const ipfsPath = candidate.replace(/^ipfs:\/\//i, "").replace(/^\/+/, "");
    return ipfsPath ? `${IPFS_GATEWAY_BASE_URL}/${ipfsPath}` : null;
  }

  return null;
}

function inferImageFromFiles(content: Record<string, unknown>): string | null {
  const files = Array.isArray(content.files) ? content.files : [];

  for (const rawFile of files) {
    const file = asRecord(rawFile);
    const uri = normalizeImageUri(asString(file.uri));
    const mime = asString(file.mime)?.toLowerCase() ?? "";

    if (!uri) {
      continue;
    }

    if (mime.startsWith("image/")) {
      return uri;
    }

    if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(uri)) {
      return uri;
    }
  }

  return null;
}

function inferAssetImageUrl(asset: Record<string, unknown>): string | null {
  const content = asRecord(asset.content);
  const links = asRecord(content.links);
  const metadata = asRecord(content.metadata);

  return (
    normalizeImageUri(asString(links.image))
    || inferImageFromFiles(content)
    || normalizeImageUri(asString(metadata.image))
  );
}

function parseLimit(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("limit");
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

function normalizeAvatarAsset(rawAsset: unknown): AvatarNftItem | null {
  const asset = asRecord(rawAsset);
  const interfaceName = asString(asset.interface)?.toLowerCase() ?? "";

  if (interfaceName.includes("fungible")) {
    return null;
  }

  const assetId = asString(asset.id);
  if (!assetId) {
    return null;
  }

  const imageUrl = inferAssetImageUrl(asset);
  if (!imageUrl) {
    return null;
  }

  const content = asRecord(asset.content);
  const metadata = asRecord(content.metadata);
  const name = asString(metadata.name) ?? `NFT ${assetId.slice(0, 6)}...`;

  return {
    assetId,
    name,
    symbol: asString(metadata.symbol),
    imageUrl
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  const requestedLimit = parseLimit(request);
  const perPageLimit = Math.min(200, Math.max(50, requestedLimit * 3));

  try {
    const dasClient = new DasClient();
    const avatarItems: AvatarNftItem[] = [];
    const seenAssetIds = new Set<string>();

    let page = 1;
    while (page <= MAX_SCAN_PAGES && avatarItems.length < requestedLimit) {
      const pageResult = await dasClient.getAssetsByOwner(walletPublicKey, {
        page,
        limit: perPageLimit
      });

      for (const rawAsset of pageResult.items) {
        const parsed = normalizeAvatarAsset(rawAsset);
        if (!parsed || seenAssetIds.has(parsed.assetId)) {
          continue;
        }

        seenAssetIds.add(parsed.assetId);
        avatarItems.push(parsed);

        if (avatarItems.length >= requestedLimit) {
          break;
        }
      }

      if (pageResult.items.length < perPageLimit) {
        break;
      }

      page += 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        walletPublicKey,
        items: avatarItems.slice(0, requestedLimit)
      }
    });
  } catch (error) {
    if (isDasClientError(error)) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message
          }
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "NFT_AVATAR_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Could not fetch wallet NFT avatars."
        }
      },
      { status: 500 }
    );
  }
}
