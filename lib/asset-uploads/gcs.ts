import { del, head } from "@vercel/blob";

export type GcsUploadConfig = {
  bucketName: string;
  cdnBaseUrl: string | null;
  signedUrlTtlSeconds: number;
  blobReadWriteToken: string;
};

export type GcsObjectMetadata = {
  found: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  etag: string | null;
  md5Base64: string | null;
  url: string | null;
};

export type DeleteGcsObjectResult = {
  deleted: boolean;
  notFound: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseSignedUrlTtlSeconds(): number {
  const rawValue = process.env.GCS_SIGNED_URL_TTL_SECONDS?.trim();
  if (!rawValue) {
    return 900;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error("GCS_SIGNED_URL_TTL_SECONDS must be a number.");
  }

  const normalized = Math.floor(parsed);
  if (normalized < 60 || normalized > 3600) {
    throw new Error("GCS_SIGNED_URL_TTL_SECONDS must be between 60 and 3600.");
  }

  return normalized;
}

function encodeObjectPath(objectKey: string): string {
  return objectKey
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getGcsUploadConfig(): GcsUploadConfig {
  const blobReadWriteToken = requireEnv("BLOB_READ_WRITE_TOKEN");
  const explicitCdnBaseUrl = optionalEnv("BLOB_CDN_BASE_URL") || optionalEnv("GCS_UPLOAD_CDN_BASE_URL");
  const explicitBucket = optionalEnv("BLOB_STORE_ID") || optionalEnv("GCS_UPLOAD_BUCKET");

  return {
    bucketName: explicitBucket || "vercel-blob",
    cdnBaseUrl: explicitCdnBaseUrl ? normalizeBaseUrl(explicitCdnBaseUrl) : null,
    signedUrlTtlSeconds: parseSignedUrlTtlSeconds(),
    blobReadWriteToken
  };
}

export function buildUploadContractExpiresAt(config: GcsUploadConfig): string {
  const expiresAtEpochSeconds = Math.floor(Date.now() / 1000) + config.signedUrlTtlSeconds;
  return new Date(expiresAtEpochSeconds * 1000).toISOString();
}

export async function headGcsObject(config: GcsUploadConfig, objectKey: string): Promise<GcsObjectMetadata> {
  try {
    const metadata = await head(objectKey, {
      token: config.blobReadWriteToken
    });

    return {
      found: true,
      mimeType: metadata.contentType || null,
      sizeBytes: Number.isFinite(metadata.size) ? Math.floor(metadata.size) : null,
      etag: metadata.etag || null,
      md5Base64: null,
      url: metadata.url || null
    };
  } catch (error) {
    if (error instanceof Error && error.name === "BlobNotFoundError") {
      return {
        found: false,
        mimeType: null,
        sizeBytes: null,
        etag: null,
        md5Base64: null,
        url: null
      };
    }
    throw error;
  }
}

export async function deleteGcsObjectIfPresent(
  config: GcsUploadConfig,
  objectKey: string
): Promise<DeleteGcsObjectResult> {
  const metadata = await headGcsObject(config, objectKey);

  if (!metadata.found || !metadata.url) {
    return {
      deleted: false,
      notFound: true
    };
  }

  await del(metadata.url, {
    token: config.blobReadWriteToken
  });

  return {
    deleted: true,
    notFound: false
  };
}

export function buildCdnUrl(config: GcsUploadConfig, objectKey: string): string {
  if (!config.cdnBaseUrl) {
    throw new Error(
      "Could not build CDN URL from config. Use head metadata URL or set BLOB_CDN_BASE_URL."
    );
  }
  return `${config.cdnBaseUrl}/${encodeObjectPath(objectKey)}`;
}
