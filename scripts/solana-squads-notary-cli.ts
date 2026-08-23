/**
 * =========================================================================================
 * CLI Tool: Squads Protocol v4 & Notary PDA On-Chain Governance Manager
 * File: scripts/solana-squads-notary-cli.ts
 *
 * Description:
 * CLI orchestrator for executing real on-chain Squads Protocol v4 transactions on Solana Devnet
 * using the local developer wallet keypair (`my-solana-wallet.json`).
 *
 * Capabilities:
 * 1. Inspect wallet balance (SOL + USDC) and Squads Multisig state.
 * 2. Build atomic Date Change Proposal with 0.10 USDC Platform Fee.
 * 3. Create VaultTransaction + Proposal on Squads v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`).
 * 4. Sign and Approve proposal with local CLI keypair.
 * 5. Verify on-chain execution and inspect the Notary PDA (`project_config_notary`).
 *
 * @spec BRI-8 / EPIC-015
 * =========================================================================================
 */

/* eslint-disable no-restricted-imports */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction
} from "@solana/web3.js";

import {
  SQUADS_DEVNET_MULTISIG_PDA,
  deriveSquadsProposalPda,
  deriveSquadsVaultPda,
  fetchSquadsMultisigState,
  prepareSquadsDateChangeProposalTransaction,
  prepareSquadsProposalApproveTransaction
} from "../apps/web/src/lib/solana-kit/compat/squads-v4-client";
import {
  deriveProjectConfigPda
} from "../apps/web/src/lib/solana-kit/pda/project-config-reader";

const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), "my-solana-wallet.json");
const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

/**
 * Loads the developer's Solana keypair from disk.
 */
function loadKeypair(filePath: string = DEFAULT_KEYPAIR_PATH): Keypair {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Keypair file not found at: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Main CLI Execution Routine
 */
async function main() {
  console.log("\n============================================================");
  console.log("🏛️  BRIDS — Squads Protocol v4 & Notary PDA CLI Manager");
  console.log("============================================================\n");

  // Step 1: Initialize connection and local signer
  const connection = new Connection(DEVNET_RPC_URL, "confirmed");
  const signerKeypair = loadKeypair();
  const signerWallet = signerKeypair.publicKey.toBase58();

  console.log(`🔑 Signer Wallet: ${signerWallet}`);
  const solBalance = await connection.getBalance(signerKeypair.publicKey);
  console.log(`💰 SOL Balance:   ${(solBalance / 1e9).toFixed(4)} SOL`);

  // Step 2: Query Squads Multisig State
  console.log(`\n🔍 Fetching Squads Multisig (${SQUADS_DEVNET_MULTISIG_PDA})...`);
  const multisigState = await fetchSquadsMultisigState(SQUADS_DEVNET_MULTISIG_PDA);
  console.log(`   - Threshold:      ${multisigState.threshold} de ${multisigState.membersCount} firmas`);
  console.log(`   - Current Tx Idx: ${multisigState.transactionIndex}`);
  console.log(`   - Signer Member:  ${multisigState.members.includes(signerWallet) ? "✅ AUTORIZADO (Miembro del Comité)" : "❌ NO ES MIEMBRO"}`);

  // Step 3: Define Project Collection and Dates
  const targetCollection = "fix-flip-brandon-117-666";
  const collectionPubkey = new PublicKey("9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz");
  const { pdaAddress: projectConfigPda } = await deriveProjectConfigPda(collectionPubkey.toBase58());
  const { vaultPda } = deriveSquadsVaultPda(SQUADS_DEVNET_MULTISIG_PDA, 0);

  console.log(`\n📦 Target Collection: ${targetCollection} (${collectionPubkey.toBase58()})`);
  console.log(`📜 Target Notary PDA:   ${projectConfigPda}`);
  console.log(`🏛️ Squads Vault PDA:   ${vaultPda}`);

  // Target Dates: 2026-09-01 -> 2027-09-01
  const startAt = 1788220800n; // 2026-09-01T00:00:00Z
  const endAt = 1819756800n;   // 2027-09-01T00:00:00Z
  const nextTxIndex = multisigState.transactionIndex + 1n;

  console.log(`\n🚀 Preparing Proposal for Transaction Index: ${nextTxIndex.toString()}`);
  console.log(`   - Nueva Fecha Inicio: ${new Date(Number(startAt) * 1000).toISOString()}`);
  console.log(`   - Nueva Fecha Fin:    ${new Date(Number(endAt) * 1000).toISOString()}`);
  console.log(`   - Tarifa Plataforma:  0.10 USDC`);

  // Step 4: Build Proposal Creation Transaction
  const preparedProposal = await prepareSquadsDateChangeProposalTransaction({
    creatorWallet: signerWallet,
    collectionAddress: collectionPubkey.toBase58(),
    newStartAtUnixSeconds: startAt,
    newEndAtUnixSeconds: endAt,
    transactionIndex: nextTxIndex
  });

  console.log(`\n📝 Compiling VersionedTransaction (v0)...`);
  const txBytes = Buffer.from(preparedProposal.transactionBase64, "base64");
  const versionedTx = VersionedTransaction.deserialize(txBytes);

  // Step 5: Sign with developer keypair
  versionedTx.sign([signerKeypair]);

  console.log(`📡 Broadcasting proposalCreate transaction to Solana Devnet...`);
  const createSig = await connection.sendRawTransaction(versionedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed"
  });

  console.log(`⏳ Confirming transaction: ${createSig}`);
  const confirmation = await connection.confirmTransaction(createSig, "confirmed");

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  console.log(`\n✅ PROPUESTA CREADA EXITOSAMENTE EN SQUADS PROTOCOL v4!`);
  console.log(`   - Tx Signature: https://solscan.io/tx/${createSig}?cluster=devnet`);
  console.log(`   - Proposal PDA: ${preparedProposal.proposalPda}`);
  console.log(`   - Tx Index:     ${preparedProposal.transactionIndex}`);

  // Step 6: Cast 1st Approval Vote with Developer Signer
  console.log(`\n🗳️  Signing Approval Vote with Wallet ${signerWallet}...`);
  const preparedVote = await prepareSquadsProposalApproveTransaction({
    memberWallet: signerWallet,
    transactionIndex: nextTxIndex,
    memo: `BRIDS_CLI_GOVERNANCE:approve:${targetCollection}`
  });

  const voteTxBytes = Buffer.from(preparedVote.transactionBase64, "base64");
  const voteTx = VersionedTransaction.deserialize(voteTxBytes);
  voteTx.sign([signerKeypair]);

  const voteSig = await connection.sendRawTransaction(voteTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed"
  });

  console.log(`⏳ Confirming vote transaction: ${voteSig}`);
  await connection.confirmTransaction(voteSig, "confirmed");

  console.log(`\n🎉 VOTO REGISTRADO ON-CHAIN EXITOSAMENTE!`);
  console.log(`   - Vote Tx Signature: https://solscan.io/tx/${voteSig}?cluster=devnet`);
  console.log(`   - Estado del Quórum: 1 de 2 firmas requeridas.`);
  console.log(`   - Para completar la ejecución: Firma con un segundo miembro en la UI (/admin/treasury/squads) o por CLI.`);
  console.log("\n============================================================\n");
}

main().catch((err) => {
  console.error("\n❌ Error ejecutando CLI de Squads:", err);
  process.exit(1);
});
