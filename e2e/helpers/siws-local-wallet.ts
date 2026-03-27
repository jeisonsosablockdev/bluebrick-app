import fs from "node:fs";
import path from "node:path";

import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import type { Page } from "@playwright/test";

export type WalletRole = "admin" | "user";

type WalletAvailability = {
  role: WalletRole;
  keypairPath: string;
  exists: boolean;
  reason?: string;
};

type AuthMeResponse = {
  authenticated: boolean;
  pubkey: string | null;
  role?: "admin" | "user";
};

type LoadedWallet = {
  role: WalletRole;
  keypairPath: string;
  keypair: Keypair;
  publicKey: string;
};

const DEFAULT_STATEMENT = "Sign this message to authenticate with the app.";

function defaultKeypairPath(role: WalletRole): string {
  if (role === "admin") {
    return process.env.E2E_ADMIN_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "", "my-solana-wallet.json");
  }

  return process.env.E2E_USER_KEYPAIR_PATH ?? path.join(process.cwd(), ".keys", "purchase-third-party-signer.json");
}

export function getWalletAvailability(role: WalletRole): WalletAvailability {
  const keypairPath = defaultKeypairPath(role);
  const exists = fs.existsSync(keypairPath);

  if (!exists) {
    return {
      role,
      keypairPath,
      exists,
      reason: `Missing keypair file for ${role} wallet: ${keypairPath}`
    };
  }

  return {
    role,
    keypairPath,
    exists
  };
}

function loadWallet(role: WalletRole): LoadedWallet {
  const availability = getWalletAvailability(role);

  if (!availability.exists) {
    throw new Error(availability.reason ?? `Missing keypair for role: ${role}`);
  }

  const raw = JSON.parse(fs.readFileSync(availability.keypairPath, "utf8")) as unknown;

  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`Invalid keypair file format at ${availability.keypairPath}`);
  }

  const secretKey = Uint8Array.from(raw);
  const keypair = Keypair.fromSecretKey(secretKey);

  return {
    role,
    keypairPath: availability.keypairPath,
    keypair,
    publicKey: keypair.publicKey.toBase58()
  };
}

function buildSiwsMessage(input: {
  domain: string;
  publicKey: string;
  nonce: string;
  issuedAt: string;
  statement: string;
}): string {
  return [
    "Sign-In With Solana",
    `Domain: ${input.domain}`,
    `Address: ${input.publicKey}`,
    `Statement: ${input.statement}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`
  ].join("\n");
}

async function parseJsonSafe(responseText: string): Promise<unknown> {
  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

export async function authenticateWithWalletRole(
  page: Page,
  role: WalletRole,
  statement: string = DEFAULT_STATEMENT
): Promise<AuthMeResponse> {
  const wallet = loadWallet(role);

  await page.goto("/");
  const domain = new URL(page.url()).host;

  const nonceResponse = await page.context().request.get("/api/auth/nonce");
  const noncePayload = (await nonceResponse.json()) as { nonce?: string };

  if (!nonceResponse.ok() || !noncePayload.nonce) {
    throw new Error(`Failed to get nonce for ${role} wallet auth.`);
  }

  const message = buildSiwsMessage({
    domain,
    publicKey: wallet.publicKey,
    nonce: noncePayload.nonce,
    issuedAt: new Date().toISOString(),
    statement
  });

  const signature = nacl.sign.detached(new TextEncoder().encode(message), wallet.keypair.secretKey);

  const verifyResponse = await page.context().request.post("/api/auth/verify", {
    data: {
      message,
      signature: Buffer.from(signature).toString("base64"),
      publicKey: wallet.publicKey
    }
  });

  if (!verifyResponse.ok()) {
    const responseText = await verifyResponse.text();
    const payload = await parseJsonSafe(responseText);
    const serializedPayload = payload ? JSON.stringify(payload) : responseText;
    throw new Error(`SIWS verify failed for ${role} wallet (${wallet.publicKey}): ${serializedPayload}`);
  }

  const meResponse = await page.context().request.get("/api/auth/me");
  if (!meResponse.ok()) {
    throw new Error(`Could not read auth session after SIWS verify for ${role} wallet.`);
  }

  return (await meResponse.json()) as AuthMeResponse;
}
