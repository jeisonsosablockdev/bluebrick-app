/**
 * @file apps/web/src/lib/utils.ts
 * @description Layer 4: Infrastructure & Shared Utilities.
 * Common helper functions for class name concatenation and Solana address formatting.
 */

/**
 * Merges conditional class names into a single clean string.
 *
 * @param inputs - List of class names, booleans, undefined, or null values.
 * @returns Combined class names string.
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  // Step 1: Filter out falsy values and join with a single whitespace
  return inputs.filter(Boolean).join(" ");
}

/**
 * Truncates a Solana public key address for compact UI presentation.
 *
 * @param address - Base58 Solana public key string or null/undefined.
 * @param chars - Number of characters to retain at the start and end (default: 4).
 * @returns Truncated address string (e.g., "7xKX...gAsU") or original/empty string.
 */
export function formatAddress(address: string | null | undefined, chars: number = 4): string {
  // Step 1: Validate address existence and minimum length
  if (!address) return "";
  if (address.length <= chars * 2) return address;

  // Step 2: Slice head and tail segments around ellipsis
  const prefix = address.slice(0, chars);
  const suffix = address.slice(-chars);
  return `${prefix}...${suffix}`;
}
