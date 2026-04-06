import fs from "node:fs";
import path from "node:path";

import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

function defaultKeypairPath(role) {
  if (role === "admin") {
    return process.env.E2E_ADMIN_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "", "my-solana-wallet.json");
  }

  return process.env.E2E_USER_KEYPAIR_PATH ?? path.join(process.cwd(), ".keys", "purchase-third-party-signer.json");
}

export function tryLoadWalletProfile(role) {
  const keypairPath = defaultKeypairPath(role);

  if (!fs.existsSync(keypairPath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(keypairPath, "utf8"));

  if (!Array.isArray(parsed) || parsed.length < 64) {
    throw new Error(`Invalid keypair file format for ${role} wallet at ${keypairPath}`);
  }

  const secretKey = Uint8Array.from(parsed);
  const keypair = Keypair.fromSecretKey(secretKey);

  return {
    role,
    keypairPath,
    publicKey: keypair.publicKey.toBase58(),
    privateKeyBase58: bs58.encode(secretKey)
  };
}
