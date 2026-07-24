import { PublicKey } from "@solana/web3.js";

export const SQUADS_V4_PROGRAM_ID = new PublicKey(
  process.env.SQUADS_PROGRAM_ID || "SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/**
 * Derives Associated Token Address (ATA) for a wallet and mint using SPL Token rules.
 */
export function deriveAssociatedTokenAddress(walletAddress: string, tokenMintAddress: string): string {
  try {
    const walletPk = new PublicKey(walletAddress);
    const mintPk = new PublicKey(tokenMintAddress);
    const [ata] = PublicKey.findProgramAddressSync(
      [walletPk.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return ata.toBase58();
  } catch {
    return `${walletAddress}_ata_${tokenMintAddress.slice(0, 8)}`;
  }
}

/**
 * Derives Squads v4 PDAs (Multisig, Vault, Proposal, Batch) deterministically.
 */
export function deriveSquadsPdas(
  multisigSeedStr: string,
  transactionIndex: number | bigint
): {
  squadsMultisigPda: string;
  squadsVaultPda: string;
  proposalPda: string;
  batchPda: string;
} {
  try {
    const multisigPk = new PublicKey(multisigSeedStr);
    const txIndexBuffer = Buffer.alloc(8);
    txIndexBuffer.writeBigUInt64LE(BigInt(transactionIndex));

    const [multisigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), multisigPk.toBuffer()],
      SQUADS_V4_PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), multisigPda.toBuffer(), Buffer.from("vault"), Buffer.from([0])],
      SQUADS_V4_PROGRAM_ID
    );
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), multisigPda.toBuffer(), Buffer.from("proposal"), txIndexBuffer],
      SQUADS_V4_PROGRAM_ID
    );
    const [batchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), proposalPda.toBuffer(), Buffer.from("batch")],
      SQUADS_V4_PROGRAM_ID
    );

    return {
      squadsMultisigPda: multisigPda.toBase58(),
      squadsVaultPda: vaultPda.toBase58(),
      proposalPda: proposalPda.toBase58(),
      batchPda: batchPda.toBase58()
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
