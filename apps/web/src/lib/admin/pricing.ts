export const USDC_DECIMALS = 6;
export const USDC_ATOMIC_MULTIPLIER = 10 ** USDC_DECIMALS;

export function parsePositiveDecimalInput(raw: string): number | null {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function formatPriceInput(value: number, maxFractionDigits = 8): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return value
    .toFixed(maxFractionDigits)
    .replace(/\.?0+$/, "");
}

export function convertUsdToSol(usdAmount: number, solUsdRate: number): number {
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
    throw new Error("usdAmount must be greater than zero.");
  }

  if (!Number.isFinite(solUsdRate) || solUsdRate <= 0) {
    throw new Error("solUsdRate must be greater than zero.");
  }

  return usdAmount / solUsdRate;
}

export function convertSolToUsd(solAmount: number, solUsdRate: number): number {
  if (!Number.isFinite(solAmount) || solAmount <= 0) {
    throw new Error("solAmount must be greater than zero.");
  }

  if (!Number.isFinite(solUsdRate) || solUsdRate <= 0) {
    throw new Error("solUsdRate must be greater than zero.");
  }

  return solAmount * solUsdRate;
}

export function usdToUsdcAtomic(usdAmount: number): number {
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
    throw new Error("usdAmount must be greater than zero.");
  }

  return Math.round(usdAmount * USDC_ATOMIC_MULTIPLIER);
}
