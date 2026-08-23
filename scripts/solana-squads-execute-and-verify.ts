/**
 * Script to execute approved proposal and verify PDA on Solana Devnet
 */
/* eslint-disable no-restricted-imports */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, Keypair, PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { deriveProjectConfigPda, decodeProjectConfigAccountData } from "../apps/web/src/lib/solana-kit/pda/project-config-reader";

const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), "my-solana-wallet.json");
const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SQUADS_V4_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
const SQUADS_DEVNET_MULTISIG_PDA = new PublicKey("rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD");
const UNIFIED_PROGRAM_ID = new PublicKey("HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE");

function loadKeypair(): Keypair {
  const raw = fs.readFileSync(DEFAULT_KEYPAIR_PATH, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function verifyAndExecute(txIndex = 3n) {
  const connection = new Connection(DEVNET_RPC_URL, "confirmed");
  const signer = loadKeypair();

  const [proposalPda] = multisig.getProposalPda({
    multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex: txIndex,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const proposalAccount = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda);
  console.log("Proposal", txIndex.toString(), "Status:", proposalAccount.status);
  console.log("Approved count:", proposalAccount.approved.length);

  if (proposalAccount.approved.length >= 2 && proposalAccount.status.__kind !== "Executed") {
    console.log("Threshold reached! Executing vault transaction on Devnet...");
    const { instruction: executeIx, lookupTableAccounts } = await multisig.instructions.vaultTransactionExecute({
      connection,
      multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
      transactionIndex: txIndex,
      member: signer.publicKey,
      programId: SQUADS_V4_PROGRAM_ID,
    });

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const msg = new TransactionMessage({
      payerKey: signer.publicKey,
      recentBlockhash: blockhash,
      instructions: [executeIx],
    }).compileToV0Message(lookupTableAccounts);

    const execTx = new VersionedTransaction(msg);
    execTx.sign([signer]);

    const sig = await connection.sendRawTransaction(execTx.serialize(), { skipPreflight: false });
    console.log("Executing transaction signature:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Execution Confirmed! Tx: https://solscan.io/tx/" + sig + "?cluster=devnet");
  }

  // Verify on-chain PDA
  const targetCollection = "EhN6smWN3kRLVSyT7y7jTBQZYRhtBmo9QWsJx9bSis43";
  const { pdaAddress } = await deriveProjectConfigPda(targetCollection, UNIFIED_PROGRAM_ID.toBase58() as any);
  console.log("\n🔍 Reading PDA On-Chain:", pdaAddress);
  const acc = await connection.getAccountInfo(new PublicKey(pdaAddress));

  if (acc) {
    console.log("✅ PDA EXISTS ON-CHAIN!");
    console.log("  Owner:", acc.owner.toBase58());
    console.log("  Data length:", acc.data.length, "bytes");
    const decoded = decodeProjectConfigAccountData(new Uint8Array(acc.data));
    console.log("  Decoded ProjectConfigState:", decoded);
  } else {
    console.log("⏳ PDA is not yet created on-chain (waiting for 2nd signature & execution).");
  }
}

verifyAndExecute().catch(console.error);
