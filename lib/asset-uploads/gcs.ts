import { createHmac } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

type HttpMethod = "PUT" | "HEAD";

const execFileAsync = promisify(execFile);

type SignedUrlInput = {
  method: HttpMethod;
  bucketName: string;
  objectKey: string;
  accessId: string;
  secret: string | null;
  expiresAtEpochSeconds: number;
  contentType?: string;
  contentMd5Base64?: string;
  storageBaseUrl: string;
};

export type GcsUploadConfig = {
  bucketName: string;
  cdnBaseUrl: string;
  signingAccessId: string;
  signingSecret: string | null;
  signingMode: "hmac" | "iam";
  signedUrlTtlSeconds: number;
  storageBaseUrl: string;
};

export type GcsObjectMetadata = {
  found: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  etag: string | null;
  md5Base64: string | null;
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

export function getGcsUploadConfig(): GcsUploadConfig {
  const signingAccessId = requireEnv("GCS_UPLOAD_SIGNING_ACCESS_ID");
  const signingSecret = optionalEnv("GCS_UPLOAD_SIGNING_SECRET");
  const signingMode = signingSecret ? "hmac" : "iam";

  if (signingMode === "iam" && !signingAccessId.includes("@")) {
    throw new Error(
      "GCS_UPLOAD_SIGNING_ACCESS_ID must be a service account email when GCS_UPLOAD_SIGNING_SECRET is not set."
    );
  }

  return {
    bucketName: requireEnv("GCS_UPLOAD_BUCKET"),
    cdnBaseUrl: normalizeBaseUrl(requireEnv("GCS_UPLOAD_CDN_BASE_URL")),
    signingAccessId,
    signingSecret,
    signingMode,
    signedUrlTtlSeconds: parseSignedUrlTtlSeconds(),
    storageBaseUrl: normalizeBaseUrl(process.env.GCS_STORAGE_BASE_URL?.trim() || "https://storage.googleapis.com")
  };
}

function encodeObjectPath(objectKey: string): string {
  return objectKey
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildStringToSign(input: SignedUrlInput): string {
  return [
    input.method,
    input.contentMd5Base64 ?? "",
    input.contentType ?? "",
    String(input.expiresAtEpochSeconds),
    `/${input.bucketName}/${input.objectKey}`
  ].join("\n");
}

function signStringToSign(secret: string, stringToSign: string): string {
  return createHmac("sha1", secret).update(stringToSign).digest("base64");
}

let cachedGcloudAccessToken: { value: string; expiresAtMs: number } | null = null;

async function getGcloudAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedGcloudAccessToken && now < cachedGcloudAccessToken.expiresAtMs) {
    return cachedGcloudAccessToken.value;
  }

  const { stdout } = await execFileAsync("gcloud", ["auth", "print-access-token"], {
    encoding: "utf8"
  });

  const token = stdout.trim();
  if (!token) {
    throw new Error("Could not obtain a GCP access token from gcloud auth.");
  }

  cachedGcloudAccessToken = {
    value: token,
    expiresAtMs: now + 50 * 60 * 1000
  };

  return token;
}

async function signStringToSignWithIam(accessId: string, stringToSign: string): Promise<string> {
  const accessToken = await getGcloudAccessToken();
  const payloadBase64 = Buffer.from(stringToSign, "utf8").toString("base64");

  const response = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(accessId)}:signBlob`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ payload: payloadBase64 }),
      cache: "no-store"
    }
  );

  const payload = await response
    .json()
    .catch(() => ({})) as { signedBlob?: unknown; error?: { message?: unknown } };

  if (!response.ok) {
    const reason =
      payload?.error && typeof payload.error.message === "string"
        ? payload.error.message
        : `IAM signBlob failed with status ${response.status}.`;
    throw new Error(reason);
  }

  if (typeof payload.signedBlob !== "string" || !payload.signedBlob.trim()) {
    throw new Error("IAM signBlob did not return a valid signedBlob.");
  }

  return payload.signedBlob.trim();
}

export async function buildGcsSignedUrl(input: SignedUrlInput): Promise<string> {
  const stringToSign = buildStringToSign(input);
  const signature = input.secret
    ? signStringToSign(input.secret, stringToSign)
    : await signStringToSignWithIam(input.accessId, stringToSign);
  const encodedPath = encodeObjectPath(input.objectKey);
  const encodedAccessId = encodeURIComponent(input.accessId);
  const encodedSignature = encodeURIComponent(signature);

  return `${input.storageBaseUrl}/${input.bucketName}/${encodedPath}` +
    `?GoogleAccessId=${encodedAccessId}&Expires=${input.expiresAtEpochSeconds}&Signature=${encodedSignature}`;
}

export type SignedPutUrl = {
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<"Content-Type" | "Content-Length" | "Content-MD5", string>;
};

type BuildSignedPutUrlInput = {
  config: GcsUploadConfig;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
};

export async function buildSignedPutUrl(input: BuildSignedPutUrlInput): Promise<SignedPutUrl> {
  const expiresAtEpochSeconds = Math.floor(Date.now() / 1000) + input.config.signedUrlTtlSeconds;
  const uploadUrl = await buildGcsSignedUrl({
    method: "PUT",
    bucketName: input.config.bucketName,
    objectKey: input.objectKey,
    accessId: input.config.signingAccessId,
    secret: input.config.signingSecret,
    expiresAtEpochSeconds,
    contentType: input.mimeType,
    contentMd5Base64: input.contentMd5Base64,
    storageBaseUrl: input.config.storageBaseUrl
  });

  return {
    uploadUrl,
    expiresAt: new Date(expiresAtEpochSeconds * 1000).toISOString(),
    requiredHeaders: {
      "Content-Type": input.mimeType,
      "Content-Length": String(input.sizeBytes),
      "Content-MD5": input.contentMd5Base64
    }
  };
}

function parseMd5FromXGoogHash(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const chunks = value.split(",").map((part) => part.trim());
  for (const chunk of chunks) {
    if (chunk.startsWith("md5=")) {
      return chunk.slice(4);
    }
  }

  return null;
}

function normalizeEtag(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, "");
}

export async function headGcsObject(config: GcsUploadConfig, objectKey: string): Promise<GcsObjectMetadata> {
  const expiresAtEpochSeconds = Math.floor(Date.now() / 1000) + 120;
  const signedHeadUrl = await buildGcsSignedUrl({
    method: "HEAD",
    bucketName: config.bucketName,
    objectKey,
    accessId: config.signingAccessId,
    secret: config.signingSecret,
    expiresAtEpochSeconds,
    storageBaseUrl: config.storageBaseUrl
  });

  const response = await fetch(signedHeadUrl, { method: "HEAD", cache: "no-store" });

  if (response.status === 404) {
    return {
      found: false,
      mimeType: null,
      sizeBytes: null,
      etag: null,
      md5Base64: null
    };
  }

  if (!response.ok) {
    throw new Error(`GCS HEAD request failed with status ${response.status}.`);
  }

  const sizeHeader = response.headers.get("content-length");
  const parsedSize = sizeHeader ? Number(sizeHeader) : NaN;

  return {
    found: true,
    mimeType: response.headers.get("content-type"),
    sizeBytes: Number.isFinite(parsedSize) ? Math.floor(parsedSize) : null,
    etag: normalizeEtag(response.headers.get("etag")),
    md5Base64: parseMd5FromXGoogHash(response.headers.get("x-goog-hash"))
  };
}

export function buildCdnUrl(config: GcsUploadConfig, objectKey: string): string {
  return `${config.cdnBaseUrl}/${encodeObjectPath(objectKey)}`;
}
