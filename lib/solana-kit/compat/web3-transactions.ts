import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import {
  address,
  createSolanaRpc,
  signature as solanaSignature,
  type Base64EncodedWireTransaction,
  type Commitment,
  type Signature
} from "@solana/kit";
import { Connection, VersionedMessage, VersionedTransaction, type Finality } from "@solana/web3.js";

// TODO(EPIC-005): remove this adapter once stake flows fully migrate off legacy web3 interop.
export type LegacyVersionedTransaction = VersionedTransaction;
export type KitRpcConnection = ReturnType<typeof createSolanaRpc>;

export function normalizeLegacyPublicKey(raw: string): string {
  return address(raw);
}

export function convertUmiTransactionToLegacyVersionedTransaction(raw: unknown): VersionedTransaction {
  return toWeb3JsTransaction(raw as never);
}

export function deserializeLegacyVersionedTransaction(raw: Uint8Array): VersionedTransaction {
  return VersionedTransaction.deserialize(raw);
}

export function serializeLegacyVersionedTransaction(raw: VersionedTransaction): Uint8Array {
  return raw.serialize();
}

export function serializeLegacyVersionedMessage(raw: VersionedTransaction): Uint8Array {
  return raw.message.serialize();
}

type MessageLike = VersionedTransaction["message"];
const COMPUTE_BUDGET_PROGRAM_ID = "ComputeBudget111111111111111111111111111111";

function publicKeyListFingerprint(keys: Array<{ toBase58(): string }>): string[] {
  return keys.map((key) => key.toBase58());
}

function bytesFingerprint(raw: Uint8Array): string {
  return Buffer.from(raw).toString("base64");
}

function bytesHashFingerprint(raw: Uint8Array): string {
  let hash = 0x811c9dc5;

  for (const byte of raw) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function compiledInstructionsFingerprint(message: MessageLike) {
  return getPreparedActionInstructions(message).map((instruction) => ({
    programIdIndex: instruction.programIdIndex,
    accountKeyIndexes: [...instruction.accountKeyIndexes],
    data: bytesFingerprint(instruction.data)
  }));
}

function addressTableLookupsFingerprint(message: MessageLike) {
  if (!("addressTableLookups" in message)) {
    return [];
  }

  return message.addressTableLookups.map((lookup) => ({
    accountKey: lookup.accountKey.toBase58(),
    writableIndexes: [...lookup.writableIndexes],
    readonlyIndexes: [...lookup.readonlyIndexes]
  }));
}

function messageActionFingerprint(message: MessageLike) {
  return {
    version: message.version,
    header: message.header,
    staticAccountKeys: publicKeyListFingerprint(message.staticAccountKeys),
    compiledInstructions: compiledInstructionsFingerprint(message),
    addressTableLookups: addressTableLookupsFingerprint(message)
  };
}

function getStaticMessageAccountKey(message: MessageLike, index: number): string | null {
  return message.staticAccountKeys[index]?.toBase58() ?? null;
}

function isLeadingComputeBudgetInstruction(message: MessageLike, instruction: MessageLike["compiledInstructions"][number]): boolean {
  return getStaticMessageAccountKey(message, instruction.programIdIndex) === COMPUTE_BUDGET_PROGRAM_ID
    && instruction.accountKeyIndexes.length === 0;
}

function getPreparedActionInstructions(message: MessageLike): MessageLike["compiledInstructions"] {
  let firstActionInstructionIndex = 0;

  while (
    firstActionInstructionIndex < message.compiledInstructions.length
    && isLeadingComputeBudgetInstruction(message, message.compiledInstructions[firstActionInstructionIndex] as MessageLike["compiledInstructions"][number])
  ) {
    firstActionInstructionIndex += 1;
  }

  return message.compiledInstructions.slice(firstActionInstructionIndex);
}

function compiledInstructionsUseOnlyStaticKeys(message: MessageLike): boolean {
  return getPreparedActionInstructions(message).every((instruction) => {
    if (instruction.programIdIndex >= message.staticAccountKeys.length) {
      return false;
    }

    return instruction.accountKeyIndexes.every((accountIndex) => accountIndex < message.staticAccountKeys.length);
  });
}

function semanticInstructionsFingerprint(message: MessageLike) {
  return getPreparedActionInstructions(message).map((instruction) => ({
    programId: getStaticMessageAccountKey(message, instruction.programIdIndex),
    accounts: instruction.accountKeyIndexes.map((accountIndex) => ({
      pubkey: getStaticMessageAccountKey(message, accountIndex),
      signer: message.isAccountSigner(accountIndex),
      writable: message.isAccountWritable(accountIndex)
    })),
    data: bytesFingerprint(instruction.data)
  }));
}

function semanticInstructionsDiagnosticFingerprint(message: MessageLike) {
  return getPreparedActionInstructions(message).map((instruction) => ({
    programId: getStaticMessageAccountKey(message, instruction.programIdIndex),
    accounts: instruction.accountKeyIndexes.map((accountIndex) => ({
      pubkey: getStaticMessageAccountKey(message, accountIndex),
      signer: message.isAccountSigner(accountIndex),
      writable: message.isAccountWritable(accountIndex)
    })),
    dataHash: bytesHashFingerprint(instruction.data),
    dataLength: instruction.data.length
  }));
}

function messageSemanticActionFingerprint(message: MessageLike) {
  if (!compiledInstructionsUseOnlyStaticKeys(message)) {
    return null;
  }

  return {
    feePayer: getStaticMessageAccountKey(message, 0),
    instructions: semanticInstructionsFingerprint(message)
  };
}

function messageSemanticDiagnosticFingerprint(message: MessageLike) {
  if (!compiledInstructionsUseOnlyStaticKeys(message)) {
    return null;
  }

  return {
    feePayer: getStaticMessageAccountKey(message, 0),
    ignoredLeadingComputeBudgetInstructionCount: message.compiledInstructions.length - getPreparedActionInstructions(message).length,
    instructionCount: getPreparedActionInstructions(message).length,
    instructions: semanticInstructionsDiagnosticFingerprint(message)
  };
}

export type LegacyTransactionMessageMismatchReason =
  | "version"
  | "header"
  | "staticAccountKeys"
  | "compiledInstructions"
  | "addressTableLookups";

function valuesMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function getLegacyTransactionMessageMismatchReasons(
  transaction: VersionedTransaction,
  preparedMessageBytes: Uint8Array
): LegacyTransactionMessageMismatchReason[] {
  const preparedMessage = VersionedMessage.deserialize(preparedMessageBytes) as MessageLike;
  const signedSemanticFingerprint = messageSemanticActionFingerprint(transaction.message);
  const preparedSemanticFingerprint = messageSemanticActionFingerprint(preparedMessage);

  if (signedSemanticFingerprint && preparedSemanticFingerprint) {
    return valuesMatch(signedSemanticFingerprint, preparedSemanticFingerprint) ? [] : ["compiledInstructions"];
  }

  const signedFingerprint = messageActionFingerprint(transaction.message);
  const preparedFingerprint = messageActionFingerprint(preparedMessage);
  const reasons: LegacyTransactionMessageMismatchReason[] = [];

  if (!valuesMatch(signedFingerprint.version, preparedFingerprint.version)) {
    reasons.push("version");
  }

  if (!valuesMatch(signedFingerprint.header, preparedFingerprint.header)) {
    reasons.push("header");
  }

  if (!valuesMatch(signedFingerprint.staticAccountKeys, preparedFingerprint.staticAccountKeys)) {
    reasons.push("staticAccountKeys");
  }

  if (!valuesMatch(signedFingerprint.compiledInstructions, preparedFingerprint.compiledInstructions)) {
    reasons.push("compiledInstructions");
  }

  if (!valuesMatch(signedFingerprint.addressTableLookups, preparedFingerprint.addressTableLookups)) {
    reasons.push("addressTableLookups");
  }

  return reasons;
}

export function getLegacyTransactionMessageMismatchDiagnostics(
  transaction: VersionedTransaction,
  preparedMessageBytes: Uint8Array
) {
  const preparedMessage = VersionedMessage.deserialize(preparedMessageBytes) as MessageLike;

  return {
    signed: messageSemanticDiagnosticFingerprint(transaction.message) ?? messageActionFingerprint(transaction.message),
    prepared: messageSemanticDiagnosticFingerprint(preparedMessage) ?? messageActionFingerprint(preparedMessage)
  };
}

export function legacyTransactionMessageMatchesPreparedAction(
  transaction: VersionedTransaction,
  preparedMessageBytes: Uint8Array
): boolean {
  return getLegacyTransactionMessageMismatchReasons(transaction, preparedMessageBytes).length === 0;
}

export function getLegacyTransactionPayer(raw: VersionedTransaction): string | null {
  return raw.message.staticAccountKeys[0]?.toBase58() ?? null;
}

export function getLegacyTransactionRequiredSignerCount(raw: VersionedTransaction): number {
  return raw.message.header.numRequiredSignatures;
}

export function getLegacyTransactionStaticAccountKeys(raw: VersionedTransaction): string[] {
  return raw.message.staticAccountKeys.map((key) => key.toBase58());
}

export function getLegacyTransactionSignatureAt(raw: VersionedTransaction, index: number): Uint8Array | null {
  return raw.signatures[index] ?? null;
}

export function createLegacyConnection(url: string, commitment: Commitment = "confirmed"): Connection {
  return new Connection(url, commitment);
}

export function createKitRpcConnection(url: string): KitRpcConnection {
  return createSolanaRpc(url as Parameters<typeof createSolanaRpc>[0]);
}

function toBase64EncodedWireTransaction(raw: Uint8Array): Base64EncodedWireTransaction {
  return Buffer.from(raw).toString("base64") as Base64EncodedWireTransaction;
}

function toKitSignature(raw: string): Signature {
  return solanaSignature(raw);
}

export async function sendRawTransactionWithKitRpc(
  rpc: KitRpcConnection,
  serializedTransaction: Uint8Array,
  options?: {
    maxRetries?: number;
    skipPreflight?: boolean;
  }
): Promise<string> {
  const config: {
    encoding: "base64";
    maxRetries?: bigint;
    skipPreflight: boolean;
  } = {
    encoding: "base64",
    skipPreflight: options?.skipPreflight ?? false
  };

  if (typeof options?.maxRetries === "number") {
    config.maxRetries = BigInt(options.maxRetries);
  }

  return rpc.sendTransaction(toBase64EncodedWireTransaction(serializedTransaction), config).send();
}

export async function getSignatureStatusWithKitRpc(
  rpc: KitRpcConnection,
  rawSignature: string,
  options?: {
    searchTransactionHistory?: boolean;
  }
) {
  const response = await rpc.getSignatureStatuses([toKitSignature(rawSignature)], {
    searchTransactionHistory: options?.searchTransactionHistory ?? false
  }).send();

  return response.value[0] ?? null;
}

export async function getTransactionWithKitRpc(
  rpc: KitRpcConnection,
  rawSignature: string,
  commitment: Commitment = "confirmed"
) {
  return rpc.getTransaction(toKitSignature(rawSignature), {
    commitment,
    encoding: "json",
    maxSupportedTransactionVersion: 0
  }).send();
}

export async function sendLegacyVersionedTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
  options?: {
    maxRetries?: number;
    skipPreflight?: boolean;
  }
): Promise<string> {
  return connection.sendRawTransaction(transaction.serialize(), {
    maxRetries: options?.maxRetries,
    skipPreflight: options?.skipPreflight ?? false
  });
}

export async function sendAndConfirmLegacyVersionedTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
  commitment: Commitment = "confirmed"
): Promise<string> {
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    preflightCommitment: commitment,
    skipPreflight: false
  });
  await connection.confirmTransaction(signature, commitment);
  return signature;
}

export async function getLegacyTransactionBySignature(
  connection: Connection,
  signature: string,
  commitment: Finality = "confirmed"
) {
  return connection.getTransaction(signature, {
    commitment,
    maxSupportedTransactionVersion: 0
  });
}

export async function getLegacySignatureStatus(
  connection: Connection,
  signature: string
) {
  const response = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true
  });

  return response.value[0] ?? null;
}

export function getLegacyTransactionPayerFromResponse(transaction: {
  transaction: {
    message: {
      staticAccountKeys: Array<{ toBase58(): string }>;
    };
  };
}): string | null {
  return transaction.transaction.message.staticAccountKeys[0]?.toBase58() ?? null;
}
