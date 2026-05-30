import { createHash } from "node:crypto";

const PINATA_PIN_JSON_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PINATA_PIN_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const DEFAULT_PINATA_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

type PinataPinJsonInput = {
  name: string;
  json: Record<string, unknown>;
  keyValues?: Record<string, string>;
};

type PinataPinFileFromUrlInput = {
  sourceUrl: string;
  name: string;
  keyValues?: Record<string, string>;
};

type PinataPinJsonResponse = {
  IpfsHash?: unknown;
  error?: unknown;
  message?: unknown;
  code?: unknown;
  status?: unknown;
  reason?: unknown;
};

type PinataResponsePayload = {
  json: PinataPinJsonResponse | null;
  rawText: string;
};

type PinataApiErrorContext = {
  operation: "pin JSON metadata" | "pin source file";
  status: number;
  payload: PinataResponsePayload;
};

export type PinnedJsonResult = {
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
};

export type PinnedFileResult = PinnedJsonResult & {
  sourceUrl: string;
  fileName: string;
  contentType: string;
};

export type PinataResolvedImage = {
  imageUri: string;
  imageGatewayUrl: string | null;
  contentType: string;
};

export type CoreCandyMachinePinataMetadataInput = {
  collectionName: string;
  assetNamePrefix: string;
  collectionMetadata: Record<string, unknown>;
  assetMetadata: Record<string, unknown>;
};

export type CoreCandyMachinePinataMetadataOutput = {
  collectionUri: string;
  assetUri: string;
  collectionGatewayUrl: string;
  assetGatewayUrl: string;
};

export class PinataFileServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly providerStatus: number | null;
  readonly providerCode: string | null;
  readonly providerMessage: string | null;

  constructor(
    message: string,
    status = 500,
    code = "PINATA_SERVICE_ERROR",
    details?: {
      providerStatus?: number | null;
      providerCode?: string | null;
      providerMessage?: string | null;
    }
  ) {
    super(message);
    this.name = "PinataFileServiceError";
    this.status = status;
    this.code = code;
    this.providerStatus = details?.providerStatus ?? null;
    this.providerCode = details?.providerCode ?? null;
    this.providerMessage = details?.providerMessage ?? null;
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPinataJwt(): string {
  return asTrimmedString(process.env.PINATA_JWT);
}

function getPinataGatewayBaseUrl(): string {
  const candidate = asTrimmedString(process.env.PINATA_GATEWAY_BASE_URL) || DEFAULT_PINATA_GATEWAY_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

function toGatewayUrl(ipfsUri: string): string | null {
  const normalized = asTrimmedString(ipfsUri);
  if (!normalized.toLowerCase().startsWith("ipfs://")) {
    return null;
  }

  const ipfsPath = normalized.replace(/^ipfs:\/\//i, "").replace(/^\/+/, "");
  if (!ipfsPath) {
    return null;
  }

  return `${getPinataGatewayBaseUrl()}/${ipfsPath}`;
}

function requirePinataJwt(): string {
  const token = getPinataJwt();

  if (!token) {
    throw new PinataFileServiceError("PINATA_JWT is required to pin metadata.", 500, "PINATA_NOT_CONFIGURED");
  }

  return token;
}

function readNestedText(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = asTrimmedString(record[key]);
    if (direct) {
      return direct;
    }
  }

  return "";
}

function extractProviderMessage(payload: PinataPinJsonResponse | null): string {
  const directError = asTrimmedString(payload?.error);
  if (directError) {
    return directError;
  }

  const nestedError = readNestedText(payload?.error, ["message", "reason", "details", "error"]);
  if (nestedError) {
    return nestedError;
  }

  const directMessage = asTrimmedString(payload?.message);
  if (directMessage) {
    return directMessage;
  }

  const nestedMessage = readNestedText(payload?.message, ["message", "reason", "details", "error"]);
  if (nestedMessage) {
    return nestedMessage;
  }

  return asTrimmedString(payload?.reason);
}

function extractProviderCode(payload: PinataPinJsonResponse | null): string {
  return asTrimmedString(payload?.code)
    || asTrimmedString(payload?.status)
    || readNestedText(payload?.error, ["code", "status"])
    || readNestedText(payload?.message, ["code", "status"]);
}

function safeBodySnippet(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

function toPinataApiError(context: PinataApiErrorContext): PinataFileServiceError {
  const providerMessage = extractProviderMessage(context.payload.json);
  const providerCode = extractProviderCode(context.payload.json);
  const fallbackSnippet = safeBodySnippet(context.payload.rawText);
  const diagnostic = providerMessage || fallbackSnippet;
  const message = [
    `Pinata ${context.operation} request failed with status ${context.status}.`,
    diagnostic ? `Provider response: ${diagnostic}` : "Provider response was empty or unreadable.",
    providerCode ? `Provider code: ${providerCode}.` : ""
  ].filter(Boolean).join(" ");

  return new PinataFileServiceError(message, context.status || 502, "PINATA_REQUEST_FAILED", {
    providerStatus: context.status || null,
    providerCode: providerCode || null,
    providerMessage: providerMessage || fallbackSnippet || null
  });
}

async function readPinataResponsePayload(response: Response): Promise<PinataResponsePayload> {
  if (typeof response.text !== "function" && typeof response.json === "function") {
    const json = (await response.json().catch(() => null)) as PinataPinJsonResponse | null;
    return {
      json: json && typeof json === "object" && !Array.isArray(json) ? json : null,
      rawText: json ? JSON.stringify(json) : ""
    };
  }

  const rawText = await response.text().catch(() => "");
  if (!rawText.trim()) {
    return { json: null, rawText };
  }

  try {
    const parsed = JSON.parse(rawText) as PinataPinJsonResponse;
    return {
      json: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null,
      rawText
    };
  } catch {
    return { json: null, rawText };
  }
}

function assertCid(value: unknown): string {
  const cid = asTrimmedString(value);
  if (!cid) {
    throw new PinataFileServiceError("Pinata response did not include a valid CID.", 502, "PINATA_INVALID_RESPONSE");
  }

  return cid;
}

function resolveMimeTypeFromPath(pathname: string): string {
  const lower = pathname.toLowerCase();

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

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

function normalizeContentType(value: string): string {
  const normalized = asTrimmedString(value).toLowerCase();
  const [mimeType] = normalized.split(";");
  return mimeType ? mimeType.trim() : "";
}

function sanitizeFileName(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

function sanitizeNameToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function buildTechnicalObjectName(input: {
  kind: "collection-meta" | "asset-meta";
  seed: string;
}): string {
  const token = sanitizeNameToken(input.seed) || "item";
  const digest = createHash("sha256").update(input.seed).digest("hex").slice(0, 10);
  return `cm-${input.kind}-${token}-${digest}`;
}

function fileExtensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    case "image/avif":
      return ".avif";
    case "image/jpeg":
      return ".jpg";
    default:
      return "";
  }
}

function pathFromUrl(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).pathname;
  } catch {
    return "";
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isPinataConfigured(): boolean {
  return Boolean(getPinataJwt());
}

export async function pinJsonToPinata(input: PinataPinJsonInput): Promise<PinnedJsonResult> {
  const token = requirePinataJwt();
  const name = asTrimmedString(input.name);

  if (!name) {
    throw new PinataFileServiceError("Pinata metadata name is required.", 400, "PINATA_INVALID_INPUT");
  }

  const response = await fetch(PINATA_PIN_JSON_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pinataContent: input.json,
      pinataMetadata: {
        name,
        keyvalues: input.keyValues ?? {}
      }
    })
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "Network error while calling Pinata.";
    throw new PinataFileServiceError(message, 502, "PINATA_NETWORK_ERROR");
  });

  const payload = await readPinataResponsePayload(response);

  if (!response.ok) {
    throw toPinataApiError({
      operation: "pin JSON metadata",
      status: response.status || 502,
      payload
    });
  }

  const cid = assertCid(payload.json?.IpfsHash);
  const gatewayBaseUrl = getPinataGatewayBaseUrl();

  return {
    cid,
    ipfsUri: `ipfs://${cid}`,
    gatewayUrl: `${gatewayBaseUrl}/${cid}`
  };
}

export async function pinFileFromUrlToPinata(input: PinataPinFileFromUrlInput): Promise<PinnedFileResult> {
  const token = requirePinataJwt();
  const sourceUrl = asTrimmedString(input.sourceUrl);
  const name = asTrimmedString(input.name);

  if (!name) {
    throw new PinataFileServiceError("Pinata file name is required.", 400, "PINATA_INVALID_INPUT");
  }

  if (!isHttpUrl(sourceUrl)) {
    throw new PinataFileServiceError("Pinata source URL must use http or https.", 400, "PINATA_INVALID_INPUT");
  }

  const sourceResponse = await fetch(sourceUrl).catch((error) => {
    const message = error instanceof Error ? error.message : "Network error while downloading source file.";
    throw new PinataFileServiceError(message, 502, "PINATA_SOURCE_NETWORK_ERROR");
  });

  if (!sourceResponse.ok) {
    throw new PinataFileServiceError(
      `Could not download source file (${sourceResponse.status}).`,
      502,
      "PINATA_SOURCE_FETCH_FAILED"
    );
  }

  const headerContentType = normalizeContentType(sourceResponse.headers.get("content-type") ?? "");
  const pathMimeType = resolveMimeTypeFromPath(pathFromUrl(sourceUrl));
  const contentType = headerContentType && headerContentType !== "application/octet-stream"
    ? headerContentType
    : pathMimeType;
  const content = await sourceResponse.blob().catch((error) => {
    const message = error instanceof Error ? error.message : "Could not read downloaded source file.";
    throw new PinataFileServiceError(message, 502, "PINATA_SOURCE_READ_FAILED");
  });

  if (content.size <= 0) {
    throw new PinataFileServiceError("Downloaded source file is empty.", 400, "PINATA_SOURCE_EMPTY_FILE");
  }

  const extension = fileExtensionForContentType(contentType);
  const fileName = `${sanitizeFileName(name)}${extension}`;
  const formData = new FormData();
  formData.append("file", content, fileName);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name,
      keyvalues: input.keyValues ?? {}
    })
  );

  const response = await fetch(PINATA_PIN_FILE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "Network error while calling Pinata.";
    throw new PinataFileServiceError(message, 502, "PINATA_NETWORK_ERROR");
  });

  const payload = await readPinataResponsePayload(response);

  if (!response.ok) {
    throw toPinataApiError({
      operation: "pin source file",
      status: response.status || 502,
      payload
    });
  }

  const cid = assertCid(payload.json?.IpfsHash);
  const gatewayBaseUrl = getPinataGatewayBaseUrl();

  return {
    cid,
    ipfsUri: `ipfs://${cid}`,
    gatewayUrl: `${gatewayBaseUrl}/${cid}`,
    sourceUrl,
    fileName,
    contentType
  };
}

export async function resolveImageForPinata(input: {
  imageUri: string;
  name: string;
  keyValues?: Record<string, string>;
}): Promise<PinataResolvedImage> {
  const imageUri = asTrimmedString(input.imageUri);

  if (!imageUri) {
    throw new PinataFileServiceError("Image URI is required.", 400, "PINATA_INVALID_INPUT");
  }

  if (imageUri.toLowerCase().startsWith("ipfs://")) {
    const ipfsPath = imageUri.replace(/^ipfs:\/\//i, "").replace(/^\/+/, "");
    const path = ipfsPath.includes("/") ? ipfsPath.slice(ipfsPath.indexOf("/")) : "";
    const contentType = resolveMimeTypeFromPath(path);

    return {
      imageUri,
      imageGatewayUrl: toGatewayUrl(imageUri),
      contentType
    };
  }

  const pinnedFile = await pinFileFromUrlToPinata({
    sourceUrl: imageUri,
    name: input.name,
    keyValues: input.keyValues
  });

  return {
    imageUri: pinnedFile.ipfsUri,
    imageGatewayUrl: pinnedFile.gatewayUrl,
    contentType: pinnedFile.contentType
  };
}

export async function createCoreCandyMachinePinataMetadataUris(
  input: CoreCandyMachinePinataMetadataInput
): Promise<CoreCandyMachinePinataMetadataOutput> {
  const collectionName = asTrimmedString(input.collectionName) || "Collection";
  const assetNamePrefix = asTrimmedString(input.assetNamePrefix) || "Asset";
  const collectionObjectName = buildTechnicalObjectName({
    kind: "collection-meta",
    seed: `${collectionName}|collection`
  });
  const assetObjectName = buildTechnicalObjectName({
    kind: "asset-meta",
    seed: `${assetNamePrefix}|asset`
  });

  const [collectionPinned, assetPinned] = await Promise.all([
    pinJsonToPinata({
      name: collectionObjectName,
      json: input.collectionMetadata,
      keyValues: {
        app: "brids",
        scope: "core-candy-machine",
        kind: "collection"
      }
    }),
    pinJsonToPinata({
      name: assetObjectName,
      json: input.assetMetadata,
      keyValues: {
        app: "brids",
        scope: "core-candy-machine",
        kind: "asset"
      }
    })
  ]);

  return {
    collectionUri: collectionPinned.ipfsUri,
    assetUri: assetPinned.ipfsUri,
    collectionGatewayUrl: collectionPinned.gatewayUrl,
    assetGatewayUrl: assetPinned.gatewayUrl
  };
}

export function isPinataFileServiceError(error: unknown): error is PinataFileServiceError {
  return error instanceof PinataFileServiceError;
}
