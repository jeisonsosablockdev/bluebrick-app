import { createSignerFromKeypair, type Signer, type Umi } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";

const THIRD_PARTY_SIGNER_ENV = "PURCHASE_THIRD_PARTY_SIGNER_SECRET_KEY";
const TEST_FALLBACK_SEED_BYTE = 7;

declare global {
  var __purchaseThirdPartySignerKeypair: Keypair | undefined;
}

function parseNumericArray(raw: string): Uint8Array {
  const values = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item));

  if (values.length === 0) {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} numeric format cannot be empty.`);
  }

  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} numeric format must contain integer bytes (0-255).`);
  }

  return Uint8Array.from(values);
}

function parseSecretKeyBytes(raw: string): Uint8Array {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} cannot be empty.`);
  }

  if (trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`${THIRD_PARTY_SIGNER_ENV} JSON format is invalid.`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(`${THIRD_PARTY_SIGNER_ENV} JSON format must be an array of bytes.`);
    }

    if (parsed.some((value) => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 255)) {
      throw new Error(`${THIRD_PARTY_SIGNER_ENV} JSON array must contain integer bytes (0-255).`);
    }

    return Uint8Array.from(parsed as number[]);
  }

  if (trimmed.includes(",")) {
    return parseNumericArray(trimmed);
  }

  const decoded = Buffer.from(trimmed, "base64");
  if (!decoded.length) {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} base64 format is invalid.`);
  }

  return Uint8Array.from(decoded);
}

function assertSecretKeyLength(secretKey: Uint8Array): void {
  if (secretKey.length !== 64) {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} must contain a 64-byte Ed25519 secret key.`);
  }
}

function getFallbackTestKeypair(): Keypair {
  const seed = new Uint8Array(32).fill(TEST_FALLBACK_SEED_BYTE);
  return Keypair.fromSeed(seed);
}

function createKeypairFromEnv(): Keypair {
  const raw = process.env[THIRD_PARTY_SIGNER_ENV]?.trim();

  if (!raw) {
    if (process.env.NODE_ENV === "test") {
      return getFallbackTestKeypair();
    }

    throw new Error(
      `${THIRD_PARTY_SIGNER_ENV} is required in non-test environments (base64 or JSON byte array).`
    );
  }

  const secretKey = parseSecretKeyBytes(raw);
  assertSecretKeyLength(secretKey);

  try {
    return Keypair.fromSecretKey(secretKey);
  } catch {
    throw new Error(`${THIRD_PARTY_SIGNER_ENV} could not be parsed into a valid keypair.`);
  }
}

export function getPurchaseThirdPartySignerKeypair(): Keypair {
  if (!global.__purchaseThirdPartySignerKeypair) {
    global.__purchaseThirdPartySignerKeypair = createKeypairFromEnv();
  }

  return global.__purchaseThirdPartySignerKeypair;
}

export function getPurchaseThirdPartySignerAddress(): string {
  return getPurchaseThirdPartySignerKeypair().publicKey.toBase58();
}

export function createPurchaseThirdPartySigner(umi: Umi): Signer {
  const keypair = getPurchaseThirdPartySignerKeypair();
  return createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
}
