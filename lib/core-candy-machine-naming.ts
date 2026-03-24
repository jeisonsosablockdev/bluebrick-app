const MAX_COLLECTION_NAME_BYTES = 32;
const MAX_CONFIG_LINE_TOTAL_NAME_BYTES = 32;
const NAME_SEPARATOR = " #";
const FALLBACK_COLLECTION_NAME = "Collection";
const FALLBACK_ASSET_PREFIX = "Asset";

function normalizeNameSource(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 _-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function utf8ByteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

export function truncateUtf8ByBytes(value: string, maxBytes: number): string {
  if (maxBytes <= 0) {
    return "";
  }

  let output = "";
  for (const char of value) {
    const candidate = `${output}${char}`;
    if (utf8ByteLength(candidate) > maxBytes) {
      break;
    }

    output = candidate;
  }

  return output;
}

function ensureNonEmptyWithinBytes(input: {
  source: string;
  fallback: string;
  maxBytes: number;
}): string {
  const sourceCandidate = normalizeNameSource(input.source);
  const fallbackCandidate = normalizeNameSource(input.fallback) || "A";
  const normalized = sourceCandidate || fallbackCandidate;
  const truncated = truncateUtf8ByBytes(normalized, input.maxBytes).trim();

  if (truncated) {
    return truncated;
  }

  const fallbackTruncated = truncateUtf8ByBytes(fallbackCandidate, input.maxBytes).trim();
  if (fallbackTruncated) {
    return fallbackTruncated;
  }

  return "A";
}

function parsePositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export type DeriveCoreCandyMachineNamesInput = {
  collectionSource: string;
  assetPrefixSource: string;
  quantity: number;
  startSerial?: number;
};

export type DerivedCoreCandyMachineNames = {
  collectionName: string;
  assetNamePrefix: string;
  nameLength: number;
  serialWidth: number;
  maxSerial: number;
};

export function deriveCoreCandyMachineNames(
  input: DeriveCoreCandyMachineNamesInput
): DerivedCoreCandyMachineNames {
  const quantity = parsePositiveInt(input.quantity, 1);
  const startSerial = parsePositiveInt(input.startSerial ?? 1, 1);
  const maxSerial = startSerial + quantity - 1;
  const serialWidth = String(maxSerial).length;
  const nameLength = Math.max(1, serialWidth);
  const reservedBytes = utf8ByteLength(NAME_SEPARATOR) + nameLength;
  const maxAssetPrefixBytes = MAX_CONFIG_LINE_TOTAL_NAME_BYTES - reservedBytes;

  if (maxAssetPrefixBytes < 1) {
    throw new Error("Cannot derive a valid assetNamePrefix for current serial range.");
  }

  const collectionName = ensureNonEmptyWithinBytes({
    source: input.collectionSource,
    fallback: FALLBACK_COLLECTION_NAME,
    maxBytes: MAX_COLLECTION_NAME_BYTES
  });

  const assetNamePrefix = ensureNonEmptyWithinBytes({
    source: input.assetPrefixSource || input.collectionSource,
    fallback: FALLBACK_ASSET_PREFIX,
    maxBytes: maxAssetPrefixBytes
  });

  return {
    collectionName,
    assetNamePrefix,
    nameLength,
    serialWidth,
    maxSerial
  };
}

export function buildConfigLinePrefixName(assetNamePrefix: string): string {
  return `${assetNamePrefix}${NAME_SEPARATOR}`;
}

export const CORE_CANDY_MACHINE_LIMITS = {
  maxCollectionNameBytes: MAX_COLLECTION_NAME_BYTES,
  maxConfigLineTotalNameBytes: MAX_CONFIG_LINE_TOTAL_NAME_BYTES,
  maxConfigLineUriBytes: 200
} as const;
