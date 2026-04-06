import { PublicKey } from "@solana/web3.js";

export type CandyGuardPaymentMode = "SOL" | "USDC";

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const TEMP_USDC_PAYMENT_RECIPIENT = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export function resolveCandyGuardPaymentMode(): CandyGuardPaymentMode {
  // USDC-only policy: new Candy Machines must always be configured with tokenPayment(USDC).
  return "USDC";
}

export function resolveUsdcMintAddress(): string {
  const raw = process.env.USDC_MINT_ADDRESS?.trim();
  return raw || DEVNET_USDC_MINT;
}

export function resolveUsdcPaymentRecipient(): string {
  const raw = process.env.TEMP_USDC_PAYMENT_RECIPIENT?.trim();
  return raw || TEMP_USDC_PAYMENT_RECIPIENT;
}

export function deriveAssociatedTokenAddress(ownerAddress: string, mintAddress: string): string {
  const owner = new PublicKey(ownerAddress);
  const mint = new PublicKey(mintAddress);
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return ata.toBase58();
}
