/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Solana Project Config PDA Reader
 * Description: Reads and decodes on-chain ProjectConfigState accounts from Solana RPC.
 * Security Invariants:
 * - Uses @solana/kit for deterministic PDA derivation and account deserialization.
 * - Strict length verification (134 bytes).
 * - Read-only RPC calls; fails closed on missing/corrupted accounts.
 * =========================================================================================
 */

import { address, getAddressDecoder, getAddressEncoder, getProgramDerivedAddress } from "@solana/kit";

export const PROJECT_CONFIG_NOTARY_PROGRAM_ID = address(
  process.env.PROJECT_CONFIG_NOTARY_PROGRAM_ID || "HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE"
);

export const PROJECT_CONFIG_ACCOUNT_SIZE = 134;

export interface ProjectConfigPdaState {
  authorityVault: string;
  multisig: string;
  vaultIndex: number;
  collectionAddress: string;
  startAtUnixSeconds: bigint;
  endAtUnixSeconds: bigint;
  version: number;
  updatedAtUnixSeconds: bigint;
  bump: number;
}

/**
 * Derives canonical ProjectConfig PDA address for a given collection.
 * What: Calculates deterministic PDA address [b"project_config", collection_address].
 * How: Encodes collection address and derives PDA against Notary Program ID.
 */
export async function deriveProjectConfigPda(
  collectionAddress: string,
  programId = PROJECT_CONFIG_NOTARY_PROGRAM_ID
): Promise<{ pdaAddress: string; bump: number }> {
  const [pdaAddress, bump] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [
      new TextEncoder().encode("project_config"),
      getAddressEncoder().encode(address(collectionAddress))
    ]
  });

  return { pdaAddress: pdaAddress.toString(), bump };
}

/**
 * Decodes raw binary buffer of a ProjectConfigState account.
 * What: Deserializes 134-byte account layout into typed ProjectConfigPdaState.
 * How: Reads 8-byte discriminator, 32-byte pubkeys, u8 vault index, i64 timestamps, and u32 version.
 */
export function decodeProjectConfigAccountData(buffer: Uint8Array): ProjectConfigPdaState {
  if (buffer.length < PROJECT_CONFIG_ACCOUNT_SIZE) {
    throw new Error(
      `ERR_INVALID_ACCOUNT_SIZE: Expected at least ${PROJECT_CONFIG_ACCOUNT_SIZE} bytes for ProjectConfigState, got ${buffer.length}`
    );
  }

  const addressDecoder = getAddressDecoder();
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Offset 8: authority_vault (32 bytes)
  const authorityVaultBytes = buffer.subarray(8, 40);
  const authorityVault = addressDecoder.decode(authorityVaultBytes);

  // Offset 40: multisig (32 bytes)
  const multisigBytes = buffer.subarray(40, 72);
  const multisig = addressDecoder.decode(multisigBytes);

  // Offset 72: vault_index (1 byte)
  const vaultIndex = view.getUint8(72);

  // Offset 73: collection_address (32 bytes)
  const collectionBytes = buffer.subarray(73, 105);
  const collectionAddress = addressDecoder.decode(collectionBytes);

  // Offset 105: start_at (i64, 8 bytes little endian)
  const startAtUnixSeconds = view.getBigInt64(105, true);

  // Offset 113: end_at (i64, 8 bytes little endian)
  const endAtUnixSeconds = view.getBigInt64(113, true);

  // Offset 121: version (u32, 4 bytes little endian)
  const version = view.getUint32(121, true);

  // Offset 125: updated_at (i64, 8 bytes little endian)
  const updatedAtUnixSeconds = view.getBigInt64(125, true);

  // Offset 133: bump (u8, 1 byte)
  const bump = view.getUint8(133);

  return {
    authorityVault: authorityVault.toString(),
    multisig: multisig.toString(),
    vaultIndex,
    collectionAddress: collectionAddress.toString(),
    startAtUnixSeconds,
    endAtUnixSeconds,
    version,
    updatedAtUnixSeconds,
    bump
  };
}

/**
 * Fetches and decodes ProjectConfig PDA from Solana RPC.
 * What: Queries RPC for account info and decodes on-chain state.
 * How: Derives PDA, makes getAccountInfo JSON-RPC call, and deserializes buffer.
 */
export async function fetchProjectConfigPDAOnChain(
  collectionAddress: string,
  rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
): Promise<ProjectConfigPdaState | null> {
  const { pdaAddress } = await deriveProjectConfigPda(collectionAddress);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "fetch-project-config-pda",
        method: "getAccountInfo",
        params: [pdaAddress, { encoding: "base64" }]
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: { value?: { data?: [string, string] } | null };
    };

    const base64Data = payload.result?.value?.data?.[0];
    if (!base64Data) {
      return null;
    }

    const binaryData = Buffer.from(base64Data, "base64");
    return decodeProjectConfigAccountData(new Uint8Array(binaryData));
  } catch {
    return null;
  }
}
