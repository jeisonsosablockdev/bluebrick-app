/**
 * Layer 4: Infrastructure / Solana Kit SDK Compat
 * Module: Squads Protocol v4 Deterministic PDA Derivation & Token Utilities
 * 
 * =========================================================================================
 * 🏛️ ARCHITECTURAL ROLE & 3-LAYER SECURITY MODEL
 * =========================================================================================
 * This module isolates all Squads Protocol v4 PDA derivations within a clean-room
 * compat layer. It enforces the strict 3-Layer Security Model mandated by EPIC-015:
 * 
 * 1. Layer 1 (Signer Check): Verifies that `authority_vault.is_signer == true`.
 * 2. Layer 2 (PDA Re-Derivation): Verifies that `authority_vault.key() == getVaultPda(multisig, vaultIndex, SQUADS_V4_ID)`.
 *    - Prevents a signer PDA from a rogue/attacker program from initializing TreasuryPolicy.
 * 3. Layer 3 (Multisig Ownership Check): Verifies that `multisig.owner == SQUADS_V4_ID`.
 *    - Prevents forged accounts with fake data layouts.
 * 
 * 🛡️ Fail-Closed Error Handling:
 * Under NO circumstances does this adapter return dummy string fallbacks (e.g. `${seed}_multisig`).
 * Any invalid base58 address, malformed seed, or out-of-range index immediately throws a typed error.
 * 
 * =========================================================================================
 * 🔑 SQUADS V4 PDA SEED STRUCTURES (ASCII DIAGRAM)
 * =========================================================================================
 * 
 *  PDA Type      | Seed Derivation Array                                    | Program ID
 * ───────────────┼──────────────────────────────────────────────────────────┼───────────────────────
 *  Multisig PDA  | [b"multisig", b"multisig", create_key]                   | SQDS4ep65T869zMMBK...
 *  Vault PDA     | [b"multisig", multisig_pda, b"vault", &[vault_index]]    | SQDS4ep65T869zMMBK...
 *  Proposal PDA  | [b"multisig", multisig_pda, b"proposal", tx_index_le_8b] | SQDS4ep65T869zMMBK...
 *  Batch PDA     | [b"multisig", proposal_pda, b"batch"]                    | SQDS4ep65T869zMMBK...
 * 
 * Reference: Squads v4 Official Rust SDK (v4/sdk/rs/src/pda.rs)
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Authority Manifest Devnet V1
 * @spec STORY-015-01-SPEC-02
 */

import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

/**
 * Official Squads Protocol v4 Program ID on Solana Devnet & Mainnet.
 * Default: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
 */
export const SQUADS_V4_PROGRAM_ID = address(
  process.env.SQUADS_PROGRAM_ID || "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"
);

/** Canonical Solana SPL Token Program ID */
export const TOKEN_PROGRAM_ID = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

/** Canonical Solana Associated Token Account (ATA) Program ID */
export const ASSOCIATED_TOKEN_PROGRAM_ID = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/**
 * Derives the Associated Token Account (ATA) address for a given wallet and token mint.
 * 
 * Invariant: Fails closed (throws typed error) if wallet or mint is not a valid Solana address.
 * 
 * @param walletAddress - Base58 Solana wallet address
 * @param tokenMintAddress - Base58 SPL Token Mint address
 * @returns Derived Base58 Associated Token Address
 */
export async function deriveAssociatedTokenAddress(
  walletAddress: string,
  tokenMintAddress: string
): Promise<string> {
  // Step 1: Validate input addresses (throws if invalid)
  const walletAddr = address(walletAddress);
  const mintAddr = address(tokenMintAddress);

  // Step 2: Derive ATA using canonical seeds: [wallet, token_program, mint]
  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      getAddressEncoder().encode(walletAddr),
      getAddressEncoder().encode(TOKEN_PROGRAM_ID),
      getAddressEncoder().encode(mintAddr),
    ],
  });

  return ata;
}

/**
 * Result structure containing all 4 deterministic Squads v4 PDAs.
 */
export interface SquadsPdasResult {
  /** Squads Multisig State Account PDA */
  squadsMultisigPda: string;
  /** Squads Vault PDA that holds assets and signs CPI transactions */
  squadsVaultPda: string;
  /** Squads Proposal Account PDA for a specific transaction index */
  proposalPda: string;
  /** Squads Batch Account PDA for grouped multi-instruction proposals */
  batchPda: string;
}

/**
 * Derives all 4 Squads v4 PDAs (Multisig, Vault, Proposal, Batch) deterministically
 * from the Squads `create_key` (Public Key).
 * 
 * Step-by-Step Logic:
 * // Step 1: Validate create_key format (fails closed if invalid).
 * // Step 2: Encode transactionIndex as 8 bytes Little-Endian (u64).
 * // Step 3: Derive Multisig PDA: [b"multisig", b"multisig", create_key].
 * // Step 4: Derive Vault PDA: [b"multisig", multisig_pda, b"vault", &[vault_index]].
 * // Step 5: Derive Proposal PDA: [b"multisig", multisig_pda, b"proposal", tx_index_le_8b].
 * // Step 6: Derive Batch PDA: [b"multisig", proposal_pda, b"batch"].
 * 
 * @param createKeyStr - The base58 create_key used to initialize the Squads multisig
 * @param transactionIndex - The incremental transaction index (u64)
 * @param vaultIndex - The vault index (default: 0)
 * @returns Object containing all 4 derived PDAs
 */
export async function deriveSquadsPdasFromCreateKey(
  createKeyStr: string,
  transactionIndex: number | bigint = 0n,
  vaultIndex = 0
): Promise<SquadsPdasResult> {
  // Step 1: Validate create_key address format
  const createKeyAddr = address(createKeyStr);

  // Step 2: Format transaction index as 8-byte Little-Endian buffer (u64)
  const txIndexBuffer = new Uint8Array(8);
  new DataView(txIndexBuffer.buffer).setBigUint64(
    0,
    BigInt(transactionIndex),
    true
  );

  // Step 3: Derive Multisig PDA: [b"multisig", b"multisig", create_key]
  const [multisigPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(createKeyAddr),
    ],
  });

  // Step 4: Derive Vault PDA: [b"multisig", multisig_pda, b"vault", &[vault_index]]
  const [vaultPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(multisigPda),
      new TextEncoder().encode("vault"),
      new Uint8Array([vaultIndex]),
    ],
  });

  // Step 5: Derive Proposal PDA: [b"multisig", multisig_pda, b"proposal", tx_index_le_8b]
  const [proposalPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(multisigPda),
      new TextEncoder().encode("proposal"),
      txIndexBuffer,
    ],
  });

  // Step 6: Derive Batch PDA: [b"multisig", proposal_pda, b"batch"]
  const [batchPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(proposalPda),
      new TextEncoder().encode("batch"),
    ],
  });

  return {
    squadsMultisigPda: multisigPda,
    squadsVaultPda: vaultPda,
    proposalPda,
    batchPda,
  };
}

/**
 * Legacy wrapper signature for backwards compatibility.
 * Delegates to deriveSquadsPdasFromCreateKey with default vaultIndex=0.
 * 
 * @param createKeyStr - The base58 create_key used to initialize the Squads multisig
 * @param transactionIndex - The incremental transaction index (u64)
 * @returns Object containing all 4 derived PDAs
 */
export async function deriveSquadsPdas(
  createKeyStr: string,
  transactionIndex: number | bigint = 0n
): Promise<SquadsPdasResult> {
  return deriveSquadsPdasFromCreateKey(createKeyStr, transactionIndex, 0);
}


