/**
 * Script: Create Squads v4 Proposal for Fix & Flip Brandon 117 666
 * Collection: EhN6smWN3kRLVSyT7y7jTBQZYRhtBmo9QWsJx9bSis43
 * Dates: Aug 1 2026 (1785542400) -> Aug 23 2026 (1787529599)
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
} from "../apps/web/src/lib/solana-kit/pda/project-config-reader";

const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), "my-solana-wallet.json");
const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SQUADS_V4_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
const SQUADS_DEVNET_MULTISIG_PDA = new PublicKey("rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD");
const UNIFIED_PROGRAM_ID = new PublicKey("HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE");

function loadKeypair(): Keypair {
  const raw = fs.readFileSync(DEFAULT_KEYPAIR_PATH, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function run() {
  console.log("============================================================");
  console.log("🏛️  SQUADS v4 — PROPOSAL FOR FIX & FLIP BRANDON 117 666");
  console.log("============================================================\n");

  const connection = new Connection(DEVNET_RPC_URL, "confirmed");
  const signer = loadKeypair();
  const signerPubkey = signer.publicKey;
  console.log("Signer Wallet:", signerPubkey.toBase58());

  const msInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, SQUADS_DEVNET_MULTISIG_PDA);
  const nextTxIndex = BigInt(msInfo.transactionIndex.toString()) + 1n;
  console.log("Next Transaction Index:", nextTxIndex.toString());

  const [vaultPda] = multisig.getVaultPda({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    index: 0,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const targetCollection = "EhN6smWN3kRLVSyT7y7jTBQZYRhtBmo9QWsJx9bSis43";
  const collectionPubkey = new PublicKey(targetCollection);
  const { pdaAddress: projectConfigPdaAddress } = await deriveProjectConfigPda(targetCollection, UNIFIED_PROGRAM_ID.toBase58() as any);
  const projectConfigPubkey = new PublicKey(projectConfigPdaAddress);

  console.log("Collection Address:", targetCollection);
  console.log("Target PDA:", projectConfigPdaAddress);

  // Dates: Aug 1 2026 00:00:00 UTC -> Aug 23 2026 23:59:59 UTC
  const startAt = 1785542400n; // 2026-08-01T00:00:00.000Z
  const endAt = 1787529599n;   // 2026-08-23T23:59:59.000Z

  console.log("Start Date:", new Date(Number(startAt) * 1000).toISOString(), "(Aug 1 2026)");
  console.log("End Date:  ", new Date(Number(endAt) * 1000).toISOString(), "(Aug 23 2026)");

  // initialize_project_config discriminator
  const initDiscriminator = crypto.createHash("sha256").update("global:initialize_project_config").digest().subarray(0, 8);
  const initData = Buffer.alloc(8 + 8 + 8 + 1);
  initDiscriminator.copy(initData, 0);
  initData.writeBigInt64LE(startAt, 8);
  initData.writeBigInt64LE(endAt, 16);
  initData.writeUInt8(0, 24); // vault_index = 0

  const innerInstruction = new TransactionInstruction({
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

  const createMsg = new TransactionMessage({
    payerKey: signerPubkey,
    recentBlockhash: blockhash,
    instructions: [vaultTxIx, proposalIx],
  }).compileToV0Message();

  const createTx = new VersionedTransaction(createMsg);
  createTx.sign([signer]);

  console.log("\n1. Broadcasting proposal creation to Devnet...");
  const createSig = await connection.sendRawTransaction(createTx.serialize(), { skipPreflight: false });
  console.log("Confirming creation signature:", createSig);
  await connection.confirmTransaction(createSig, "confirmed");
  console.log("✅ Proposal Created! Tx: https://solscan.io/tx/" + createSig + "?cluster=devnet");

  // Step 2: Approve with Signer 1
  console.log("\n2. Casting approval vote with wallet 1 (", signerPubkey.toBase58(), ")...");
  const { blockhash: voteBlockhash } = await connection.getLatestBlockhash("confirmed");
  const approveIx1 = multisig.instructions.proposalApprove({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: nextTxIndex,
    member: signerPubkey,
    memo: "BRIDS_NOTARY:init:fix_flip_brandon_117_666",
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
  console.log("✅ Vote 1 Recorded! Tx: https://solscan.io/tx/" + voteSig1 + "?cluster=devnet");

  const [proposalPda] = multisig.getProposalPda({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: nextTxIndex,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const proposalAccount = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda);
  console.log("\nProposal Status:");
  console.log("  Index:", nextTxIndex.toString());
  console.log("  Proposal PDA:", proposalPda.toBase58());
  console.log("  Approved signers count:", proposalAccount.approved.length);
  console.log("  Status enum:", proposalAccount.status);
}

run().catch(console.error);
