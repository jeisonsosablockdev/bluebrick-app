import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

export const SQUADS_V4_PROGRAM_ID = address(
  process.env.SQUADS_PROGRAM_ID || "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"
);

export const TOKEN_PROGRAM_ID = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/**
 * Derives Associated Token Address (ATA) for a wallet and mint using SPL Token rules.
 * Fails closed if addresses are invalid.
 */
export async function deriveAssociatedTokenAddress(
  walletAddress: string,
  tokenMintAddress: string
): Promise<string> {
  const walletAddr = address(walletAddress);
  const mintAddr = address(tokenMintAddress);
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

export interface SquadsPdasResult {
  squadsMultisigPda: string;
  squadsVaultPda: string;
  proposalPda: string;
  batchPda: string;
}

/**
 * Derives Squads v4 PDAs (Multisig, Vault, Proposal, Batch) deterministically
 * from the Squads create_key (Pubkey).
 * 
 * Seeds reference: Squads v4 SDK (v4/sdk/rs/src/pda.rs)
 * - Multisig: [b"multisig", b"multisig", create_key]
 * - Vault:    [b"multisig", multisig_pda, b"vault", &[vault_index]]
 * - Proposal: [b"multisig", multisig_pda, b"proposal", transaction_index_le_8b]
 * - Batch:    [b"multisig", proposal_pda, b"batch"]
 * 
 * Fails closed (throws typed error) if createKey is not a valid Solana address.
 */
export async function deriveSquadsPdasFromCreateKey(
  createKeyStr: string,
  transactionIndex: number | bigint = 0n,
  vaultIndex = 0
): Promise<SquadsPdasResult> {
  const createKeyAddr = address(createKeyStr);
  const txIndexBuffer = new Uint8Array(8);
  new DataView(txIndexBuffer.buffer).setBigUint64(
    0,
    BigInt(transactionIndex),
    true
  );

  const [multisigPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(createKeyAddr),
    ],
  });

  const [vaultPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(multisigPda),
      new TextEncoder().encode("vault"),
      new Uint8Array([vaultIndex]),
    ],
  });

  const [proposalPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      new TextEncoder().encode("multisig"),
      getAddressEncoder().encode(multisigPda),
      new TextEncoder().encode("proposal"),
      txIndexBuffer,
    ],
  });

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
 * Delegates to deriveSquadsPdasFromCreateKey.
 */
export async function deriveSquadsPdas(
  createKeyStr: string,
  transactionIndex: number | bigint = 0n
): Promise<SquadsPdasResult> {
  return deriveSquadsPdasFromCreateKey(createKeyStr, transactionIndex, 0);
}

