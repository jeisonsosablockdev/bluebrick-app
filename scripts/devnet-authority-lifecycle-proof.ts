import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createCollectionV2, mplCore } from "@metaplex-foundation/mpl-core";
import { createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair, Connection, PublicKey, VersionedTransaction, SystemProgram, Transaction } from "@solana/web3.js";

import {
  isCoreAuthorityLifecycleSubmitRecoverableError,
  prepareAuthorityLifecycleOperation,
  submitAuthorityLifecycleSignedTransactions
} from "@/lib/core-authority-lifecycle";
import { withDbClient } from "@/lib/db/pool";
import { getSolanaRpcUrl, METAPLEX_CORE_PROGRAM_ID } from "@/lib/solana";

type EnvSource = ".env" | ".env.local";

type ProofRecord = {
  operation: "emergency_rotate" | "rotate";
  operationId: string;
  role: "appdata_authority" | "transfer_delegate";
  collectionAddress: string;
  signer: string;
  targetAuthority: string;
  signature: string;
  explorer: string;
  proposalId: string;
};

function parseEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return "";

  const quotedWithDouble = value.startsWith("\"") && value.endsWith("\"");
  const quotedWithSingle = value.startsWith("'") && value.endsWith("'");
  if (!quotedWithDouble && !quotedWithSingle) return value;

  const unquoted = value.slice(1, -1);
  return quotedWithDouble ? unquoted.replace(/\\n/g, "\n") : unquoted;
}

function loadEnvFile(fileName: EnvSource): void {
  const envPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = parseEnvValue(raw);
  }
}

function loadRuntimeEnv(): void {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

function loadKeypairFromPath(filePath: string): Keypair {
  const raw = fs.readFileSync(filePath, "utf8");
  const decoded = JSON.parse(raw) as unknown;

  if (!Array.isArray(decoded) || decoded.some((byte) => !Number.isInteger(byte))) {
    throw new Error(`Invalid keypair JSON format at ${filePath}`);
  }

  const secretKey = Uint8Array.from(decoded as number[]);
  if (secretKey.length !== 64) {
    throw new Error(`Expected 64-byte secret key at ${filePath}, got ${secretKey.length}`);
  }

  return Keypair.fromSecretKey(secretKey);
}

function getDefaultSolanaKeypairPath(): string {
  return path.join(os.homedir(), ".config", "solana", "id.json");
}

function getCliConfiguredKeypairPath(): string | null {
  const configPath = path.join(os.homedir(), ".config", "solana", "cli", "config.yml");
  if (!fs.existsSync(configPath)) {
    return null;
  }

  const content = fs.readFileSync(configPath, "utf8");
  const match = content.match(/^keypair_path:\s*(.+)$/m);
  if (!match) {
    return null;
  }

  const rawPath = match[1].trim().replace(/^["']|["']$/g, "");
  return rawPath || null;
}

function signPreparedTransaction(transactionBase64: string, signer: Keypair): string {
  const tx = VersionedTransaction.deserialize(Buffer.from(transactionBase64, "base64"));
  tx.sign([signer]);
  return Buffer.from(tx.serialize()).toString("base64");
}

function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
}

function explorerAccount(address: string): string {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}?cluster=devnet`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSignature(
  connection: Connection,
  signature: string,
  timeoutMs = 180_000,
  pollMs = 1_500
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    const value = status.value;

    if (value?.err) {
      throw new Error(`Signature ${signature} failed with error: ${JSON.stringify(value.err)}`);
    }

    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for signature confirmation: ${signature}`);
}

async function assertTxFinalized(connection: Connection, signature: string): Promise<void> {
  const timeoutMs = 180_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    const value = status.value;

    if (!value) {
      await sleep(1_500);
      continue;
    }

    if (value.err) {
      throw new Error(`Signature ${signature} failed with error: ${JSON.stringify(value.err)}`);
    }

    if (value.confirmationStatus === "finalized") {
      return;
    }

    await sleep(1_500);
  }

  throw new Error(`Signature ${signature} did not reach finalized status within timeout.`);
}

async function ensureCollectionOwner(connection: Connection, collectionAddress: string): Promise<void> {
  const account = await connection.getAccountInfo(new PublicKey(collectionAddress), "confirmed");
  if (!account) {
    throw new Error(`Collection ${collectionAddress} not found on-chain`);
  }

  if (account.owner.toBase58() !== METAPLEX_CORE_PROGRAM_ID) {
    throw new Error(
      `Collection ${collectionAddress} owner mismatch. expected=${METAPLEX_CORE_PROGRAM_ID}, got=${account.owner.toBase58()}`
    );
  }
}

async function fundTempAuthority(connection: Connection, payer: Keypair, recipient: PublicKey): Promise<string> {
  const transferLamports = 30_000_000; // 0.03 SOL
  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: payer.publicKey,
    recentBlockhash: latest.blockhash
  }).add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: transferLamports
    })
  );
  tx.sign(payer);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  await waitForSignature(connection, signature);
  return signature;
}

async function createProofCollection(connection: Connection, payer: Keypair, rpcUrl: string): Promise<{
  collectionAddress: string;
  signature: string;
}> {
  const umi = createUmi(rpcUrl).use(mplCore());
  const payerSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(payer));
  umi.use(signerIdentity(payerSigner, true));

  const collectionSigner = generateSigner(umi);
  const builder = createCollectionV2(umi, {
    collection: collectionSigner,
    updateAuthority: payerSigner.publicKey,
    payer: payerSigner,
    name: `LC-PROOF-${new Date().toISOString().slice(5, 10)}`,
    uri: "https://example.com/authority-lifecycle-proof-collection.json"
  });

  const umiTx = await builder.buildAndSign(umi);
  const web3Tx = toWeb3JsTransaction(umiTx);
  const signature = await connection.sendRawTransaction(web3Tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  await waitForSignature(connection, signature);

  return {
    collectionAddress: collectionSigner.publicKey,
    signature
  };
}

async function submitLifecycleWithRetry(input: Parameters<typeof submitAuthorityLifecycleSignedTransactions>[0]) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await submitAuthorityLifecycleSignedTransactions(input);
    } catch (error) {
      if (
        !isCoreAuthorityLifecycleSubmitRecoverableError(error)
        || error.code === "BLOCKHASH_EXPIRED"
        || attempt === maxAttempts
      ) {
        throw error;
      }

      await sleep(5_000);
    }
  }

  throw new Error("submit lifecycle retry loop exhausted unexpectedly.");
}

async function main(): Promise<void> {
  loadRuntimeEnv();
  const proofRpc = process.env.AUTHORITY_LIFECYCLE_PROOF_RPC?.trim() || "https://api.devnet.solana.com";
  process.env.SOLANA_RPC_URL = proofRpc;
  process.env.NEXT_PUBLIC_SOLANA_RPC = proofRpc;

  if (!process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS) {
    process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS = "1";
  }

  const keypairPath = process.env.SOLANA_KEYPAIR_PATH?.trim()
    || getCliConfiguredKeypairPath()
    || getDefaultSolanaKeypairPath();
  const payer = loadKeypairFromPath(keypairPath);
  const payerPublicKey = payer.publicKey.toBase58();
  const tempAuthority = Keypair.generate();

  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const now = new Date();
  const slug = now.toISOString().replace(/[:.]/g, "-");
  console.error(`[proof] rpc=${rpcUrl}`);
  console.error(`[proof] payer=${payerPublicKey}`);
  const providedCollectionAddress = process.env.AUTHORITY_PROOF_COLLECTION_ADDRESS?.trim() || null;
  let collectionAddress = providedCollectionAddress;
  let collectionCreateSignature: string | null = null;

  if (!collectionAddress) {
    const created = await createProofCollection(connection, payer, rpcUrl);
    collectionAddress = created.collectionAddress;
    collectionCreateSignature = created.signature;
    console.error(`[proof] collection created=${collectionAddress} signature=${collectionCreateSignature}`);
  } else {
    console.error(`[proof] collection provided=${collectionAddress}`);
  }
  const proofRecords: ProofRecord[] = [];

  const collectionAddressFinal = collectionAddress;
  if (!collectionAddressFinal) {
    throw new Error("collectionAddress could not be resolved.");
  }

  const emergencyProposalId = `story-006-04-emergency-${slug}`;
  const emergencyPrepare = await prepareAuthorityLifecycleOperation({
    payerPublicKey,
    collectionAddress: collectionAddressFinal,
    role: "appdata_authority",
    operation: "emergency_rotate",
    newAuthority: tempAuthority.publicKey.toBase58(),
    multisig: {
      proposalId: emergencyProposalId,
      proposer: payerPublicKey,
      executor: payerPublicKey,
      approverSigners: [
        payerPublicKey,
        Keypair.generate().publicKey.toBase58(),
        Keypair.generate().publicKey.toBase58()
      ],
      reason: "Story-006-04 emergency rotation devnet proof",
      requestedAt: new Date().toISOString()
    }
  });
  console.error(`[proof] emergency prepared operationId=${emergencyPrepare.operationId}`);

  const emergencySigned = emergencyPrepare.transactions.map((tx) => ({
    kind: tx.kind,
    operationId: tx.operationId,
    transactionBase64: signPreparedTransaction(tx.transactionBase64, payer)
  }));
  const emergencySubmit = await submitLifecycleWithRetry({
    expectedPayerPublicKey: payerPublicKey,
    operationId: emergencyPrepare.operationId,
    signedTransactions: emergencySigned
  });
  console.error(`[proof] emergency submitted signature=${emergencySubmit.signatures[0].signature}`);

  proofRecords.push({
    operation: "emergency_rotate",
    operationId: emergencySubmit.operationId,
    role: emergencySubmit.role,
    collectionAddress: collectionAddressFinal,
    signer: payerPublicKey,
    targetAuthority: tempAuthority.publicKey.toBase58(),
    signature: emergencySubmit.signatures[0].signature,
    explorer: explorerTx(emergencySubmit.signatures[0].signature),
    proposalId: emergencyProposalId
  });

  const fundingSignature = await fundTempAuthority(connection, payer, tempAuthority.publicKey);
  console.error(`[proof] funded temp authority signature=${fundingSignature}`);

  await new Promise((resolve) => setTimeout(resolve, 1_500));

  const rotateBackProposalId = `story-006-04-rotate-back-${slug}`;
  const rotateBackPrepare = await prepareAuthorityLifecycleOperation({
    payerPublicKey: tempAuthority.publicKey.toBase58(),
    collectionAddress: collectionAddressFinal,
    role: "appdata_authority",
    operation: "rotate",
    newAuthority: payerPublicKey,
    multisig: {
      proposalId: rotateBackProposalId,
      proposer: tempAuthority.publicKey.toBase58(),
      executor: tempAuthority.publicKey.toBase58(),
      approverSigners: [
        tempAuthority.publicKey.toBase58(),
        payerPublicKey
      ],
      reason: "Story-006-04 restore authority after emergency validation",
      requestedAt: new Date().toISOString()
    }
  });
  console.error(`[proof] rotate-back prepared operationId=${rotateBackPrepare.operationId}`);

  const rotateBackSigned = rotateBackPrepare.transactions.map((tx) => ({
    kind: tx.kind,
    operationId: tx.operationId,
    transactionBase64: signPreparedTransaction(tx.transactionBase64, tempAuthority)
  }));
  const rotateBackSubmit = await submitLifecycleWithRetry({
    expectedPayerPublicKey: tempAuthority.publicKey.toBase58(),
    operationId: rotateBackPrepare.operationId,
    signedTransactions: rotateBackSigned
  });
  console.error(`[proof] rotate-back submitted signature=${rotateBackSubmit.signatures[0].signature}`);

  proofRecords.push({
    operation: "rotate",
    operationId: rotateBackSubmit.operationId,
    role: rotateBackSubmit.role,
    collectionAddress: collectionAddressFinal,
    signer: tempAuthority.publicKey.toBase58(),
    targetAuthority: payerPublicKey,
    signature: rotateBackSubmit.signatures[0].signature,
    explorer: explorerTx(rotateBackSubmit.signatures[0].signature),
    proposalId: rotateBackProposalId
  });

  for (const record of proofRecords) {
    await assertTxFinalized(connection, record.signature);
  }
  await ensureCollectionOwner(connection, collectionAddressFinal);

  const auditRows = await withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      operation: string;
      status: string;
      multisig_proposal_id: string;
      multisig_approver_signers: unknown;
      signature: string | null;
      submitted_at: Date | string | null;
      new_authority: string;
    }>(
      `SELECT id, operation, status, multisig_proposal_id, multisig_approver_signers, signature, submitted_at, new_authority
       FROM authority_audit_events
       WHERE id::text = ANY($1::text[])
       ORDER BY submitted_at ASC`,
      [proofRecords.map((record) => record.operationId)]
    );
    return result.rows;
  });

  const registryRow = await withDbClient(async (client) => {
    const result = await client.query<{
      role: string;
      collection_address: string;
      authority_pubkey: string;
      authority_version: number | string;
      updated_at: Date | string;
      last_operation_id: string | null;
    }>(
      `SELECT role, collection_address, authority_pubkey, authority_version, updated_at, last_operation_id
       FROM authority_registry
       WHERE role = 'appdata_authority' AND collection_address = $1
       LIMIT 1`,
      [collectionAddressFinal]
    );

    return result.rows[0] ?? null;
  });

  const output = {
    generatedAtUtc: new Date().toISOString(),
    rpcUrl,
    payerPublicKey,
    tempAuthorityPublicKey: tempAuthority.publicKey.toBase58(),
    collectionAddress: collectionAddressFinal,
    collectionExplorer: explorerAccount(collectionAddressFinal),
    collectionCreation: collectionCreateSignature
      ? {
        signature: collectionCreateSignature,
        explorer: explorerTx(collectionCreateSignature)
      }
      : null,
    operations: proofRecords,
    auditRows,
    registryRow
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
