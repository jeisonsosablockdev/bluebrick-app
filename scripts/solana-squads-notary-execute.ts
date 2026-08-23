/**
 * =========================================================================================
 * Script: Squads v4 Notary PDA Proposal Orchestrator & On-Chain Verifier
 * File: scripts/solana-squads-notary-execute.ts
 *
 * Description:
 * Creates a Squads v4 Proposal for ProjectConfig PDA initialization/update on Solana Devnet,
 * signs it, executes it via Squads v4, and reads back the on-chain PDA state.
 * =========================================================================================
 */

/* eslint-disable no-restricted-imports */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

import {
  deriveProjectConfigPda,
  decodeProjectConfigAccountData,
  PROJECT_CONFIG_NOTARY_PROGRAM_ID,
} from "../apps/web/src/lib/solana-kit/pda/project-config-reader";

const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), "my-solana-wallet.json");
const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SQUADS_V4_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
const SQUADS_DEVNET_MULTISIG_PDA = new PublicKey("rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD");
const UNIFIED_PROGRAM_ID = new PublicKey("HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE");

function loadKeypair(filePath: string = DEFAULT_KEYPAIR_PATH): Keypair {
  const raw = fs.readFileSync(filePath, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function run() {
  console.log("============================================================");
  console.log("🏛️  SQUADS v4 NOTARY PDA ON-CHAIN ORCHESTRATION & VERIFIER");
  console.log("============================================================\n");

  const connection = new Connection(DEVNET_RPC_URL, "confirmed");
  const signer = loadKeypair();
  const signerPubkey = signer.publicKey;
  console.log("Signer Wallet:", signerPubkey.toBase58());

  const solBalance = await connection.getBalance(signerPubkey);
  console.log("Signer SOL Balance:", (solBalance / 1e9).toFixed(4), "SOL");

  // Step 1: Query Squads Multisig
  const msInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, SQUADS_DEVNET_MULTISIG_PDA);
  console.log("\nSquads Multisig Details:");
  console.log("  Threshold:", msInfo.threshold);
  console.log("  Members:", msInfo.members.map(m => m.key.toBase58()));
  console.log("  Current Transaction Index:", msInfo.transactionIndex.toString());

  const [vaultPda] = multisig.getVaultPda({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    index: 0,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  console.log("  Vault PDA (Index 0):", vaultPda.toBase58());

  // Step 2: Target Collection and Dates
  const targetCollection = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  const collectionPubkey = new PublicKey(targetCollection);
  const { pdaAddress: projectConfigPdaAddress } = await deriveProjectConfigPda(targetCollection, UNIFIED_PROGRAM_ID.toBase58() as any);
  const projectConfigPubkey = new PublicKey(projectConfigPdaAddress);

  console.log("\nTarget Configuration:");
  console.log("  Collection Address:", targetCollection);
  console.log("  Project Config PDA:", projectConfigPdaAddress);

  // Check if PDA already exists
  const existingPdaAccount = await connection.getAccountInfo(projectConfigPubkey);
  const pdaExists = existingPdaAccount !== null;
  console.log("  PDA Status:", pdaExists ? "ALREADY INITIALIZED" : "NOT YET INITIALIZED");

  const startAt = 1788220800n; // 2026-09-01
  const endAt = 1819756800n;   // 2027-09-01
  const nextTxIndex = BigInt(msInfo.transactionIndex.toString()) + 1n;

  console.log("\nPreparing Proposal for Transaction Index:", nextTxIndex.toString());

  let innerInstruction: TransactionInstruction;

  if (!pdaExists) {
    // initialize_project_config discriminator: sha256("global:initialize_project_config")[0..8]
    const initDiscriminator = crypto.createHash("sha256").update("global:initialize_project_config").digest().subarray(0, 8);
    const initData = Buffer.alloc(8 + 8 + 8 + 1);
    initDiscriminator.copy(initData, 0);
    initData.writeBigInt64LE(startAt, 8);
    initData.writeBigInt64LE(endAt, 16);
    initData.writeUInt8(0, 24); // vault_index = 0

    innerInstruction = new TransactionInstruction({
      programId: UNIFIED_PROGRAM_ID,
      keys: [
        { pubkey: vaultPda, isSigner: true, isWritable: false },
        { pubkey: SQUADS_DEVNET_MULTISIG_PDA, isSigner: false, isWritable: false },
        { pubkey: collectionPubkey, isSigner: false, isWritable: false },
        { pubkey: projectConfigPubkey, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: true, isWritable: true }, // payer = vaultPda
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: initData,
    });
  } else {
    // update_project_dates discriminator: sha256("global:update_project_dates")[0..8]
    const updateDiscriminator = crypto.createHash("sha256").update("global:update_project_dates").digest().subarray(0, 8);
    const updateData = Buffer.alloc(8 + 8 + 8);
    updateDiscriminator.copy(updateData, 0);
    updateData.writeBigInt64LE(startAt, 8);
    updateData.writeBigInt64LE(endAt, 16);

    innerInstruction = new TransactionInstruction({
      programId: UNIFIED_PROGRAM_ID,
      keys: [
        { pubkey: vaultPda, isSigner: true, isWritable: false },
        { pubkey: SQUADS_DEVNET_MULTISIG_PDA, isSigner: false, isWritable: false },
        { pubkey: collectionPubkey, isSigner: false, isWritable: false },
        { pubkey: projectConfigPubkey, isSigner: false, isWritable: true },
      ],
      data: updateData,
    });
  }

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const innerVaultMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: blockhash,
    instructions: [innerInstruction],
  });

  // Create vaultTransaction instruction
  const vaultTxIx = multisig.instructions.vaultTransactionCreate({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: nextTxIndex,
    creator: signerPubkey,
    rentPayer: signerPubkey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage: innerVaultMessage,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  // Create proposal instruction
  const proposalIx = multisig.instructions.proposalCreate({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    creator: signerPubkey,
    rentPayer: signerPubkey,
    transactionIndex: nextTxIndex,
    isDraft: false,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  // Compile and send proposal creation
  const createMsg = new TransactionMessage({
    payerKey: signerPubkey,
    recentBlockhash: blockhash,
    instructions: [vaultTxIx, proposalIx],
  }).compileToV0Message();

  const createTx = new VersionedTransaction(createMsg);
  createTx.sign([signer]);

  console.log("Broadcasting proposal creation transaction...");
  const createSig = await connection.sendRawTransaction(createTx.serialize(), { skipPreflight: false });
  console.log("Confirming creation signature:", createSig);
  await connection.confirmTransaction(createSig, "confirmed");
  console.log("✅ Proposal Created! Tx:", `https://solscan.io/tx/${createSig}?cluster=devnet`);

  // Step 3: Approve with Signer 1
  console.log("\nCasting approval vote with member 1 (", signerPubkey.toBase58(), ")...");
  const { blockhash: voteBlockhash } = await connection.getLatestBlockhash("confirmed");
  const approveIx1 = multisig.instructions.proposalApprove({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: nextTxIndex,
    member: signerPubkey,
    memo: "BRIDS_NOTARY:approve:start_end_dates",
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const voteMsg1 = new TransactionMessage({
    payerKey: signerPubkey,
    recentBlockhash: voteBlockhash,
    instructions: [approveIx1],
  }).compileToV0Message();
  const voteTx1 = new VersionedTransaction(voteMsg1);
  voteTx1.sign([signer]);
  const voteSig1 = await connection.sendRawTransaction(voteTx1.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(voteSig1, "confirmed");
  console.log("✅ Vote 1 Recorded! Tx:", `https://solscan.io/tx/${voteSig1}?cluster=devnet`);

  const [proposalPda] = multisig.getProposalPda({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: nextTxIndex,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const proposalAccount = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda);
  console.log("\nProposal Status:");
  console.log("  Approved signers count:", proposalAccount.approved.length);
  console.log("  Status enum:", proposalAccount.status);
}

run().catch(console.error);
