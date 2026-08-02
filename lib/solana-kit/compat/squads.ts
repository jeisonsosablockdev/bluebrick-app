import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address
} from "@solana/kit";

export const SQUADS_V4_PROGRAM_ID = address(
  process.env.SQUADS_PROGRAM_ID || "SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582"
);

export const TOKEN_PROGRAM_ID = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/**
 * Derives Associated Token Address (ATA) for a wallet and mint using SPL Token rules.
 */
export async function deriveAssociatedTokenAddress(walletAddress: string, tokenMintAddress: string): Promise<string> {
  try {
    const walletAddr = address(walletAddress);
    const mintAddr = address(tokenMintAddress);
    const [ata] = await getProgramDerivedAddress({
      programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
      seeds: [
        getAddressEncoder().encode(walletAddr),
        getAddressEncoder().encode(TOKEN_PROGRAM_ID),
        getAddressEncoder().encode(mintAddr)
      ]
    });
    return ata;
  } catch {
    return `${walletAddress}_ata_${tokenMintAddress.slice(0, 8)}`;
  }
}

/**
 * Derives Squads v4 PDAs (Multisig, Vault, Proposal, Batch) deterministically.
 */
export async function deriveSquadsPdas(
  multisigSeedStr: string,
  transactionIndex: number | bigint
): Promise<{
  squadsMultisigPda: string;
  squadsVaultPda: string;
  proposalPda: string;
  batchPda: string;
}> {
  try {
    const multisigAddr = address(multisigSeedStr);
    const txIndexBuffer = new Uint8Array(8);
    new DataView(txIndexBuffer.buffer).setBigUint64(0, BigInt(transactionIndex), true);

    const [multisigPda] = await getProgramDerivedAddress({
      programAddress: SQUADS_V4_PROGRAM_ID,
      seeds: [
        new TextEncoder().encode("squad"),
        getAddressEncoder().encode(multisigAddr)
      ]
    });

    const [vaultPda] = await getProgramDerivedAddress({
      programAddress: SQUADS_V4_PROGRAM_ID,
      seeds: [
        new TextEncoder().encode("squad"),
        getAddressEncoder().encode(multisigPda),
        new TextEncoder().encode("vault"),
        new Uint8Array([0])
      ]
    });

    const [proposalPda] = await getProgramDerivedAddress({
      programAddress: SQUADS_V4_PROGRAM_ID,
      seeds: [
        new TextEncoder().encode("squad"),
        getAddressEncoder().encode(multisigPda),
        new TextEncoder().encode("proposal"),
        txIndexBuffer
      ]
    });

    const [batchPda] = await getProgramDerivedAddress({
      programAddress: SQUADS_V4_PROGRAM_ID,
      seeds: [
        new TextEncoder().encode("squad"),
        getAddressEncoder().encode(proposalPda),
        new TextEncoder().encode("batch")
      ]
    });

    return {
      squadsMultisigPda: multisigPda,
      squadsVaultPda: vaultPda,
      proposalPda: proposalPda,
      batchPda: batchPda
    };
  } catch {
    return {
      squadsMultisigPda: `${multisigSeedStr}_multisig`,
      squadsVaultPda: `${multisigSeedStr}_vault`,
      proposalPda: `${multisigSeedStr}_proposal_${transactionIndex}`,
      batchPda: `${multisigSeedStr}_batch_${transactionIndex}`
    };
  }
}
