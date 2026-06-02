import { Connection, PublicKey, VersionedTransaction, type Commitment, type Finality } from "@solana/web3.js";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";

// TODO(EPIC-005): remove this adapter once stake flows fully migrate off legacy web3 interop.
export type LegacyVersionedTransaction = VersionedTransaction;

export function normalizeLegacyPublicKey(raw: string): string {
  return new PublicKey(raw).toBase58();
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
