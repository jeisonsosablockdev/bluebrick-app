import { address, getAddressEncoder, getProgramDerivedAddress } from "@solana/kit";

export type CandyGuardPaymentMode = "SOL" | "USDC";

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const TEMP_USDC_PAYMENT_RECIPIENT = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = address("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

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

export async function deriveAssociatedTokenAddress(ownerAddress: string, mintAddress: string): Promise<string> {
  const encoder = getAddressEncoder();
  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      encoder.encode(address(ownerAddress)),
      encoder.encode(TOKEN_PROGRAM_ID),
      encoder.encode(address(mintAddress))
    ]
  });

  return ata;
}
