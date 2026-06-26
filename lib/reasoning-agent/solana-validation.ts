import { ReasoningResult } from "./types";

export interface SolanaValidationResult {
  valid: boolean;
  proofs: Array<{
    type: "account_exists" | "account_owner" | "account_data" | "transaction_confirmed";
    address: string;
    expected: any;
    actual: any;
    passed: boolean;
  }>;
  errors: string[];
  warnings: string[];
}

export interface ValidationConfig {
  rpcUrl: string;
  commitment: "processed" | "confirmed" | "finalized";
  timeoutMs: number;
}

const DEFAULT_CONFIG: ValidationConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  commitment: "confirmed",
  timeoutMs: 30000,
};

export async function validateReasoningOutput(
  result: ReasoningResult,
  task: string,
  domain: string,
  config: ValidationConfig = DEFAULT_CONFIG
): Promise<SolanaValidationResult> {
  if (domain !== "solana") {
    return {
      valid: true,
      proofs: [],
      errors: [],
      warnings: [`Domain '${domain}' not validated by Solana MCP`],
    };
  }

  const proofs: SolanaValidationResult["proofs"] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const answer = result.answer;
  const addresses = extractAddresses(answer);

  for (const address of addresses) {
    try {
      const accountInfo = await fetchAccountInfo(address, config);
      
      if (!accountInfo) {
        proofs.push({
          type: "account_exists",
          address,
          expected: "exists",
          actual: "not found",
          passed: false,
        });
        errors.push(`Account ${address} not found on devnet`);
        continue;
      }

      proofs.push({
        type: "account_exists",
        address,
        expected: "exists",
        actual: "found",
        passed: true,
      });

      if (answer.includes("program") || answer.includes("Program")) {
        const expectedOwner = extractExpectedProgramOwner(answer, address);
        if (expectedOwner) {
          proofs.push({
            type: "account_owner",
            address,
            expected: expectedOwner,
            actual: accountInfo.owner,
            passed: accountInfo.owner === expectedOwner,
          });
          if (accountInfo.owner !== expectedOwner) {
            errors.push(`Account ${address} owned by ${accountInfo.owner}, expected ${expectedOwner}`);
          }
        }
      }

      if (answer.includes("data") || answer.includes("Data")) {
        const dataValidation = validateAccountData(answer, address, accountInfo.data);
        proofs.push(...dataValidation.proofs);
        errors.push(...dataValidation.errors);
      }

    } catch (e) {
      errors.push(`Failed to validate ${address}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const transactionSigs = extractTransactionSignatures(answer);
  for (const sig of transactionSigs) {
    try {
      const confirmed = await confirmTransaction(sig, config);
      proofs.push({
        type: "transaction_confirmed",
        address: sig,
        expected: "confirmed",
        actual: confirmed ? "confirmed" : "not confirmed",
        passed: !!confirmed,
      });
      if (!confirmed) {
        errors.push(`Transaction ${sig} not confirmed`);
      }
    } catch (e) {
      errors.push(`Failed to confirm transaction ${sig}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    valid: errors.length === 0,
    proofs,
    errors,
    warnings,
  };
}

function extractAddresses(text: string): string[] {
  const addressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(addressRegex) || [];
  return [...new Set(matches)];
}

function extractTransactionSignatures(text: string): string[] {
  const sigRegex = /[1-9A-HJ-NP-Za-km-z]{87,88}/g;
  const matches = text.match(sigRegex) || [];
  return [...new Set(matches)];
}

function extractExpectedProgramOwner(text: string, address: string): string | null {
  const programIds = [
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d", // Metaplex Core
    "CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhfjAnVQjJq9", // Candy Machine v3
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token
  ];

  for (const programId of programIds) {
    if (text.includes(programId)) {
      return programId;
    }
  }
  return null;
}

async function fetchAccountInfo(address: string, config: ValidationConfig): Promise<{ owner: string; data: Buffer } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [address, { encoding: "base64", commitment: config.commitment }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    
    if (data.result?.value) {
      return {
        owner: data.result.value.owner,
        data: Buffer.from(data.result.value.data[0], "base64"),
      };
    }
    return null;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("RPC timeout");
    }
    throw e;
  }
}

function validateAccountData(answer: string, address: string, data: Buffer): { proofs: SolanaValidationResult["proofs"]; errors: string[] } {
  const proofs: SolanaValidationResult["proofs"] = [];
  const errors: string[] = [];

  if (answer.includes("rent") || answer.includes("Rent")) {
    const minRent = 890880; // ~0.00089 SOL for 165 bytes
    if (data.length > 0) {
      proofs.push({
        type: "account_data",
        address,
        expected: `size >= ${minRent} lamports exempt`,
        actual: `${data.length} bytes`,
        passed: data.length >= 165,
      });
    }
  }

  return { proofs, errors };
}

async function confirmTransaction(signature: string, config: ValidationConfig): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[signature], { searchTransactionHistory: true }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    const status = data.result?.value?.[0];
    
    return status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized";
  } catch {
    clearTimeout(timeout);
    return false;
  }
}