import { createCollectionV2, createV2, mplCore } from "@metaplex-foundation/mpl-core";
import { createNoopSigner, generateSigner, publicKey, signerIdentity, type TransactionBuilder, type Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Connection, VersionedTransaction } from "@solana/web3.js";

import { getSolanaRpcUrl } from "@/lib/solana";

const MAX_TOTAL_ITEMS = 25;
const MAX_SUBMIT_TRANSACTIONS = 30;
const MAX_NAME_LENGTH = 64;
const MAX_URI_LENGTH = 300;
const MINT_NETWORK = "devnet" as const;
const ALLOWED_URI_PROTOCOLS = new Set(["https:", "ipfs:"]);

type PreparedTransactionKind = "collection" | "asset";

export type PrepareMetaplexCoreBatchInput = {
  payerPublicKey: string;
  collectionName: string;
  collectionUri: string;
  assetNamePrefix: string;
  assetUri: string;
  totalItems: number;
  startSerial?: number;
};

type ValidatedPrepareInput = {
  payerPublicKey: string;
  collectionName: string;
  collectionUri: string;
  assetNamePrefix: string;
  assetUri: string;
  totalItems: number;
  startSerial: number;
};

export type PreparedMetaplexCoreTransaction = {
  kind: PreparedTransactionKind;
  label: string;
  serial: number | null;
  expectedAddress: string;
  transactionBase64: string;
};

export type PreparedMetaplexCoreBatch = {
  network: typeof MINT_NETWORK;
  payerPublicKey: string;
  collectionAddress: string;
  preparedAt: string;
  transactions: PreparedMetaplexCoreTransaction[];
};

export type SubmitSignedTransactionInput = {
  kind: PreparedTransactionKind;
  serial: number | null;
  expectedAddress: string;
  transactionBase64: string;
};

export type SubmitSignedTransactionsInput = {
  signedTransactions: SubmitSignedTransactionInput[];
};

export type SubmittedMetaplexCoreTransaction = {
  kind: PreparedTransactionKind;
  serial: number | null;
  expectedAddress: string;
  signature: string;
};

export class MetaplexCoreAdminInputError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MetaplexCoreAdminInputError";
    this.status = status;
  }
}

export function isMetaplexCoreAdminInputError(error: unknown): error is MetaplexCoreAdminInputError {
  return error instanceof MetaplexCoreAdminInputError;
}

function assertNonEmptyString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new MetaplexCoreAdminInputError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new MetaplexCoreAdminInputError(`${fieldName} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw new MetaplexCoreAdminInputError(`${fieldName} exceeds max length (${maxLength}).`);
  }

  return trimmed;
}

function assertUri(value: unknown, fieldName: string): string {
  const uri = assertNonEmptyString(value, fieldName, MAX_URI_LENGTH);
  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    throw new MetaplexCoreAdminInputError(`${fieldName} must be a valid URI.`);
  }

  if (!ALLOWED_URI_PROTOCOLS.has(parsed.protocol)) {
    throw new MetaplexCoreAdminInputError(`${fieldName} must use https:// or ipfs://.`);
  }

  return uri;
}

function assertPositiveInteger(value: unknown, fieldName: string, maxValue: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new MetaplexCoreAdminInputError(`${fieldName} must be an integer.`);
  }

  if (value < 1) {
    throw new MetaplexCoreAdminInputError(`${fieldName} must be greater than zero.`);
  }

  if (value > maxValue) {
    throw new MetaplexCoreAdminInputError(`${fieldName} exceeds max value (${maxValue}).`);
  }

  return value;
}

function validatePrepareInput(input: PrepareMetaplexCoreBatchInput): ValidatedPrepareInput {
  const payerPublicKey = assertNonEmptyString(input.payerPublicKey, "payerPublicKey", 60);
  const collectionName = assertNonEmptyString(input.collectionName, "collectionName", MAX_NAME_LENGTH);
  const collectionUri = assertUri(input.collectionUri, "collectionUri");
  const assetNamePrefix = assertNonEmptyString(input.assetNamePrefix, "assetNamePrefix", MAX_NAME_LENGTH - 6);
  const assetUri = assertUri(input.assetUri, "assetUri");
  const totalItems = assertPositiveInteger(input.totalItems, "totalItems", MAX_TOTAL_ITEMS);
  const startSerial = input.startSerial === undefined ? 1 : assertPositiveInteger(input.startSerial, "startSerial", 1_000_000);

  return {
    payerPublicKey,
    collectionName,
    collectionUri,
    assetNamePrefix,
    assetUri,
    totalItems,
    startSerial
  };
}

function validateSubmitInput(input: SubmitSignedTransactionsInput): SubmitSignedTransactionInput[] {
  if (!input || !Array.isArray(input.signedTransactions)) {
    throw new MetaplexCoreAdminInputError("signedTransactions must be an array.");
  }

  if (!input.signedTransactions.length) {
    throw new MetaplexCoreAdminInputError("signedTransactions cannot be empty.");
  }

  if (input.signedTransactions.length > MAX_SUBMIT_TRANSACTIONS) {
    throw new MetaplexCoreAdminInputError(`signedTransactions exceeds max value (${MAX_SUBMIT_TRANSACTIONS}).`);
  }

  return input.signedTransactions.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new MetaplexCoreAdminInputError(`signedTransactions[${index}] must be an object.`);
    }

    const kind = item.kind;
    const serial = item.serial;
    const expectedAddress = assertNonEmptyString(item.expectedAddress, `signedTransactions[${index}].expectedAddress`, 60);
    const transactionBase64 = assertNonEmptyString(item.transactionBase64, `signedTransactions[${index}].transactionBase64`, 50_000);

    if (kind !== "collection" && kind !== "asset") {
      throw new MetaplexCoreAdminInputError(`signedTransactions[${index}].kind must be "collection" or "asset".`);
    }

    if (serial !== null && (typeof serial !== "number" || !Number.isInteger(serial) || serial < 1)) {
      throw new MetaplexCoreAdminInputError(`signedTransactions[${index}].serial must be a positive integer or null.`);
    }

    return {
      kind,
      serial,
      expectedAddress,
      transactionBase64
    };
  });
}

function createServerUmi(payerPublicKey: string): Umi {
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());
  const payerSigner = createNoopSigner(publicKey(payerPublicKey));

  umi.use(signerIdentity(payerSigner, true));
  return umi;
}

function serializeSignedBuilderTransaction(transactionBuilder: TransactionBuilder, umi: Umi): Promise<string> {
  return transactionBuilder.buildAndSign(umi).then((transaction) => {
    const web3Transaction = toWeb3JsTransaction(transaction);
    return Buffer.from(web3Transaction.serialize()).toString("base64");
  });
}

async function createPreparedTransaction(params: {
  umi: Umi;
  builder: TransactionBuilder;
  kind: PreparedTransactionKind;
  serial: number | null;
  label: string;
  expectedAddress: string;
}): Promise<PreparedMetaplexCoreTransaction> {
  const transactionBase64 = await serializeSignedBuilderTransaction(params.builder, params.umi);

  return {
    kind: params.kind,
    serial: params.serial,
    label: params.label,
    expectedAddress: params.expectedAddress,
    transactionBase64
  };
}

export async function prepareMetaplexCoreBatch(rawInput: PrepareMetaplexCoreBatchInput): Promise<PreparedMetaplexCoreBatch> {
  const input = validatePrepareInput(rawInput);
  const umi = createServerUmi(input.payerPublicKey);
  const payerSigner = createNoopSigner(publicKey(input.payerPublicKey));
  const collectionSigner = generateSigner(umi);
  const transactions: PreparedMetaplexCoreTransaction[] = [];

  const createCollectionBuilder = createCollectionV2(umi, {
    collection: collectionSigner,
    updateAuthority: payerSigner.publicKey,
    payer: payerSigner,
    name: input.collectionName,
    uri: input.collectionUri
  });

  transactions.push(
    await createPreparedTransaction({
      umi,
      builder: createCollectionBuilder,
      kind: "collection",
      serial: null,
      label: "Create collection",
      expectedAddress: collectionSigner.publicKey
    })
  );

  for (let index = 0; index < input.totalItems; index += 1) {
    const serial = input.startSerial + index;
    const assetName = `${input.assetNamePrefix} #${serial}`;

    if (assetName.length > MAX_NAME_LENGTH) {
      throw new MetaplexCoreAdminInputError(`Asset name exceeds max length (${MAX_NAME_LENGTH}): ${assetName}`);
    }

    const assetSigner = generateSigner(umi);
    const createAssetBuilder = createV2(umi, {
      asset: assetSigner,
      collection: collectionSigner.publicKey,
      authority: payerSigner,
      payer: payerSigner,
      owner: payerSigner.publicKey,
      name: assetName,
      uri: input.assetUri
    });

    transactions.push(
      await createPreparedTransaction({
        umi,
        builder: createAssetBuilder,
        kind: "asset",
        serial,
        label: `Mint asset #${serial}`,
        expectedAddress: assetSigner.publicKey
      })
    );
  }

  return {
    network: MINT_NETWORK,
    payerPublicKey: input.payerPublicKey,
    collectionAddress: collectionSigner.publicKey,
    preparedAt: new Date().toISOString(),
    transactions
  };
}

function parseSignedTransaction(transactionBase64: string): VersionedTransaction {
  let rawTransaction: Buffer;

  try {
    rawTransaction = Buffer.from(transactionBase64, "base64");
  } catch {
    throw new MetaplexCoreAdminInputError("transactionBase64 is not valid base64.");
  }

  if (!rawTransaction.length) {
    throw new MetaplexCoreAdminInputError("transactionBase64 cannot be empty.");
  }

  try {
    return VersionedTransaction.deserialize(rawTransaction);
  } catch {
    throw new MetaplexCoreAdminInputError("Signed transaction payload is invalid.");
  }
}

export async function submitMetaplexCoreTransactions(rawInput: SubmitSignedTransactionsInput): Promise<SubmittedMetaplexCoreTransaction[]> {
  const signedTransactions = validateSubmitInput(rawInput);
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const results: SubmittedMetaplexCoreTransaction[] = [];

  for (const item of signedTransactions) {
    const transaction = parseSignedTransaction(item.transactionBase64);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    });
    const confirmation = await connection.confirmTransaction(signature, "confirmed");

    if (confirmation.value.err) {
      throw new Error(
        `Transaction failed for ${item.kind}${item.serial === null ? "" : ` #${item.serial}`}: ${JSON.stringify(confirmation.value.err)}`
      );
    }

    results.push({
      kind: item.kind,
      serial: item.serial,
      expectedAddress: item.expectedAddress,
      signature
    });
  }

  return results;
}
