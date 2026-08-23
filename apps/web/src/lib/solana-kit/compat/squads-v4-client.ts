/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Squads Protocol v4 Native Client & Instruction Builder
 * Module: squads-v4-client
 *
 * 🏛️ ARCHITECTURAL ROLE:
 * Encapsulates the official `@sqds/multisig` SDK integration for Solana Devnet.
 * Provides type-safe instruction assemblers for `proposalCreate`, `proposalApprove`,
 * `vaultTransactionCreate`, and `vaultTransactionExecute` targeting the verified
 * Squads v4 program (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`).
 *
 * 🛡️ SECURITY INVARIANTS:
 * 1. Devnet Boundary: Strictly queries and executes on Solana Devnet (never mocks).
 * 2. Strict PDA Derivations: All PDAs derived via official Squads v4 seeds.
 * 3. Authority Manifest: Multisig PDA `rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD`,
 *    Vault PDA `D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB` (Index 0).
 *
 * @spec BRI-8 (SPEC-10) / EPIC-015 SOLUTION-ARCHITECTURE
 * =========================================================================================
 */

import crypto from "node:crypto";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

import { getSolanaRpcUrl, getSolscanTransactionUrl } from "@/lib/infrastructure/solana";
import {
  deriveProjectConfigPda,
  PROJECT_CONFIG_NOTARY_PROGRAM_ID
} from "@/lib/solana-kit/pda/project-config-reader";

/** Canonical Squads Protocol v4 Program ID on Solana Devnet and Mainnet */
export const SQUADS_V4_PROGRAM_ID = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf";

/** Canonical BRIDS Governance & Treasury Multisig PDA on Devnet */
export const SQUADS_DEVNET_MULTISIG_PDA = "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD";

/** Canonical BRIDS Governance & Treasury Vault PDA on Devnet (Vault Index 0) */
export const SQUADS_DEVNET_VAULT_PDA = "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB";

/**
 * Result structure emitted when an unsigned VersionedTransaction is prepared for wallet signature.
 */
export type PreparedSquadsTransactionResult = {
  attemptId: string;
  transactionBase64: string;
  blockhash: string;
  lastValidBlockHeight?: number;
  proposalPda: string;
  transactionIndex: string;
  signerWallet: string;
};

/**
 * Decoded state of the Squads v4 Multisig account.
 */
export type SquadsMultisigState = {
  multisigPda: string;
  programId: string;
  threshold: number;
  membersCount: number;
  transactionIndex: bigint;
  staleTransactionIndex: bigint;
  members: string[];
};

/**
 * Derives the deterministic Proposal PDA for a given transaction index on Squads v4.
 *
 * Step-by-Step Logic:
 * // Step 1: Parse multisig public key.
 * // Step 2: Invoke official multisig.getProposalPda with programId.
 * // Step 3: Return base58 PDA address and bump.
 *
 * @param multisigAddress - Base58 string of the parent multisig account
 * @param transactionIndex - Monotonically increasing bigint transaction index
 * @returns Proposal PDA string and bump number
 */
export function deriveSquadsProposalPda(
  multisigAddress: string,
  transactionIndex: bigint
): { proposalPda: string; bump: number } {
  // Step 1: Parse multisig public key
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  // Step 2: Derive Proposal PDA
  const [pda, bump] = multisig.getProposalPda({
    multisigPda: multisigPubkey,
    transactionIndex,
    programId: programPubkey
  });

  // Step 3: Return base58 representation
  return {
    proposalPda: pda.toBase58(),
    bump
  };
}

/**
 * Derives the deterministic Vault PDA for a given vault index on Squads v4.
 *
 * @param multisigAddress - Base58 string of the parent multisig account
 * @param vaultIndex - Index of the vault within the multisig (default 0)
 * @returns Vault PDA string and bump number
 */
export function deriveSquadsVaultPda(
  multisigAddress: string = SQUADS_DEVNET_MULTISIG_PDA,
  vaultIndex: number = 0
): { vaultPda: string; bump: number } {
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  const [pda, bump] = multisig.getVaultPda({
    multisigPda: multisigPubkey,
    index: vaultIndex,
    programId: programPubkey
  });

  return {
    vaultPda: pda.toBase58(),
    bump
  };
}

/**
 * Queries and decodes the current state of a Squads v4 Multisig account from Devnet RPC.
 *
 * Step-by-Step Logic:
 * // Step 1: Establish Devnet RPC connection.
 * // Step 2: Deserialize on-chain Multisig account data using Borsh decoder.
 * // Step 3: Map members and return typed SquadsMultisigState.
 *
 * @param multisigAddress - Base58 string of the multisig account
 * @returns SquadsMultisigState
 */
export async function fetchSquadsMultisigState(
  multisigAddress: string = SQUADS_DEVNET_MULTISIG_PDA
): Promise<SquadsMultisigState> {
  // Step 1: Connect to Solana Devnet RPC
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const multisigPubkey = new PublicKey(multisigAddress);

  // Step 2: Fetch on-chain account data
  const accountInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPubkey
  );

  // Step 3: Map decoded fields
  return {
    multisigPda: multisigAddress,
    programId: SQUADS_V4_PROGRAM_ID,
    threshold: accountInfo.threshold,
    membersCount: accountInfo.members.length,
    transactionIndex: BigInt(accountInfo.transactionIndex.toString()),
    staleTransactionIndex: BigInt(accountInfo.staleTransactionIndex.toString()),
    members: accountInfo.members.map((m) => m.key.toBase58())
  };
}

/**
 * On-chain Squads Proposal Data Transfer Object
 */
export type SquadsNativeProposalDTO = {
  transactionIndex: string;
  proposalPda: string;
  vaultTransactionPda: string;
  status: "Draft" | "Active" | "Approved" | "Executed" | "Rejected" | "Cancelled";
  approved: string[];
  rejected: string[];
  cancelled: string[];
  threshold: number;
  totalMembers: number;
  members: string[];
  executionTime?: number;
};

export type BroadcastResult = {
  txSignature: string;
  slot: number;
  solscanUrl: string;
  confirmed: boolean;
};

/**
 * Queries all native on-chain Proposals from Squads v4 for the target multisig.
 *
 * Step-by-Step Logic:
 * // Step 1: Fetch Multisig account to know the latest transactionIndex and members.
 * // Step 2: Iterate and fetch Proposal accounts for each transaction index.
 * // Step 3: Map into typed SquadsNativeProposalDTO array with status strings.
 *
 * @param multisigAddress - Multisig account address
 * @returns Array of SquadsNativeProposalDTO
 */
export async function fetchSquadsNativeProposals(
  multisigAddress: string = SQUADS_DEVNET_MULTISIG_PDA
): Promise<SquadsNativeProposalDTO[]> {
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  const msInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPubkey);
  const totalTx = Number(msInfo.transactionIndex.toString());
  const members = msInfo.members.map((m) => m.key.toBase58());
  const threshold = msInfo.threshold;

  const proposals: SquadsNativeProposalDTO[] = [];

  for (let i = 1; i <= totalTx; i++) {
    const txIndex = BigInt(i);
    try {
      const [proposalPda] = multisig.getProposalPda({
        multisigPda: multisigPubkey,
        transactionIndex: txIndex,
        programId: programPubkey
      });

      const [vaultTxPda] = multisig.getTransactionPda({
        multisigPda: multisigPubkey,
        index: txIndex,
        programId: programPubkey
      });

      const propAccount = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda);

      let statusStr: SquadsNativeProposalDTO["status"] = "Active";
      const kind = (propAccount.status as { __kind?: string })?.__kind;
      if (kind === "Draft") statusStr = "Draft";
      else if (kind === "Approved") statusStr = "Approved";
      else if (kind === "Executed") statusStr = "Executed";
      else if (kind === "Rejected") statusStr = "Rejected";
      else if (kind === "Cancelled") statusStr = "Cancelled";
      else if (kind === "Active") statusStr = "Active";

      proposals.push({
        transactionIndex: txIndex.toString(),
        proposalPda: proposalPda.toBase58(),
        vaultTransactionPda: vaultTxPda.toBase58(),
        status: statusStr,
        approved: propAccount.approved.map((a) => a.toBase58()),
        rejected: propAccount.rejected.map((r) => r.toBase58()),
        cancelled: propAccount.cancelled.map((c) => c.toBase58()),
        threshold,
        totalMembers: members.length,
        members
      });
    } catch {
      // If a proposal account doesn't exist for index i, skip silently
    }
  }

  return proposals.reverse();
}

/**
 * Assembles an unsigned VersionedTransaction containing the native Squads v4 `proposalCreate` instruction.
 *
 * Step-by-Step Logic:
 * // Step 1: Fetch recent blockhash and current multisig state from Devnet.
 * // Step 2: Build native proposalCreate TransactionInstruction via @sqds/multisig.
 * // Step 3: Compile into VersionedTransaction message (v0) and serialize to base64 wire format.
 *
 * @param params - Proposal creation parameters
 * @returns PreparedSquadsTransactionResult
 */
export async function prepareSquadsProposalCreateTransaction(params: {
  creatorWallet: string;
  multisigAddress?: string;
  transactionIndex?: bigint;
  isDraft?: boolean;
}): Promise<PreparedSquadsTransactionResult> {
  const {
    creatorWallet,
    multisigAddress = SQUADS_DEVNET_MULTISIG_PDA,
    isDraft = false
  } = params;

  // Step 1: Resolve Devnet connection, blockhash, and transactionIndex
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const creatorPubkey = new PublicKey(creatorWallet);
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  let targetTxIndex = params.transactionIndex;
  if (targetTxIndex === undefined) {
    const multisigState = await fetchSquadsMultisigState(multisigAddress);
    targetTxIndex = multisigState.transactionIndex + 1n;
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const attemptId = `PROP-CREATE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Step 2: Construct native proposalCreate instruction
  const proposalInstruction = multisig.instructions.proposalCreate({
    multisigPda: multisigPubkey,
    creator: creatorPubkey,
    rentPayer: creatorPubkey,
    transactionIndex: targetTxIndex,
    isDraft,
    programId: programPubkey
  });

  const { proposalPda } = deriveSquadsProposalPda(multisigAddress, targetTxIndex);

  // Step 3: Compile VersionedTransaction
  const messageV0 = new TransactionMessage({
    payerKey: creatorPubkey,
    recentBlockhash: blockhash,
    instructions: [proposalInstruction]
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const transactionBase64 = Buffer.from(versionedTx.serialize()).toString("base64");

  return {
    attemptId,
    transactionBase64,
    blockhash,
    lastValidBlockHeight,
    proposalPda,
    transactionIndex: targetTxIndex.toString(),
    signerWallet: creatorWallet
  };
}

/**
 * Assembles an unsigned VersionedTransaction containing the native Squads v4 `proposalApprove` instruction.
 *
 * Step-by-Step Logic:
 * // Step 1: Fetch recent blockhash from Devnet RPC.
 * // Step 2: Build native proposalApprove TransactionInstruction via @sqds/multisig.
 * // Step 3: Compile into VersionedTransaction message (v0) and serialize to base64 wire format.
 *
 * @param params - Proposal vote approval parameters
 * @returns PreparedSquadsTransactionResult
 */
export async function prepareSquadsProposalApproveTransaction(params: {
  memberWallet: string;
  multisigAddress?: string;
  transactionIndex: bigint;
  memo?: string;
}): Promise<PreparedSquadsTransactionResult> {
  const {
    memberWallet,
    multisigAddress = SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex,
    memo
  } = params;

  // Step 1: Resolve Devnet connection and blockhash
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const memberPubkey = new PublicKey(memberWallet);
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const attemptId = `PROP-VOTE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Step 2: Construct native proposalApprove instruction
  const approveInstruction = multisig.instructions.proposalApprove({
    multisigPda: multisigPubkey,
    transactionIndex,
    member: memberPubkey,
    memo: memo ?? undefined,
    programId: programPubkey
  });

  const { proposalPda } = deriveSquadsProposalPda(multisigAddress, transactionIndex);

  // Step 3: Compile VersionedTransaction
  const messageV0 = new TransactionMessage({
    payerKey: memberPubkey,
    recentBlockhash: blockhash,
    instructions: [approveInstruction]
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const transactionBase64 = Buffer.from(versionedTx.serialize()).toString("base64");

  return {
    attemptId,
    transactionBase64,
    blockhash,
    lastValidBlockHeight,
    proposalPda,
    transactionIndex: transactionIndex.toString(),
    signerWallet: memberWallet
  };
}

/**
 * Assembles an atomic VersionedTransaction that:
 * 1. Transfers 0.10 USDC (100,000 atomic units) platform fee to the BRIDS treasury.
 * 2. Creates the Squads v4 `vaultTransaction` encapsulating the `update_project_dates` CPI to the Notary Program.
 * 3. Creates the Squads v4 `proposal` for multisig committee voting.
 *
 * @param params - Date change proposal configuration and requester wallet
 * @returns PreparedSquadsTransactionResult
 */
export async function prepareSquadsDateChangeProposalTransaction(params: {
  creatorWallet: string;
  collectionAddress: string;
  newStartAtUnixSeconds: bigint;
  newEndAtUnixSeconds: bigint;
  multisigAddress?: string;
  vaultIndex?: number;
  transactionIndex?: bigint;
}): Promise<PreparedSquadsTransactionResult> {
  const {
    creatorWallet,
    collectionAddress,
    newStartAtUnixSeconds,
    newEndAtUnixSeconds,
    multisigAddress = SQUADS_DEVNET_MULTISIG_PDA,
    vaultIndex = 0
  } = params;

  // Step 1: Connect to Devnet RPC and resolve blockhash
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const creatorPubkey = new PublicKey(creatorWallet);
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  let targetTxIndex = params.transactionIndex;
  if (targetTxIndex === undefined) {
    const multisigState = await fetchSquadsMultisigState(multisigAddress);
    targetTxIndex = multisigState.transactionIndex + 1n;
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const attemptId = `PROP-NOTARY-CREATE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Step 2: Check if Notary PDA is already initialized
  const { pdaAddress: projectConfigPda } = await deriveProjectConfigPda(
    collectionAddress,
    PROJECT_CONFIG_NOTARY_PROGRAM_ID
  );
  const projectConfigPubkey = new PublicKey(projectConfigPda);
  const collectionPubkey = new PublicKey(collectionAddress);
  const unifiedProgramPubkey = new PublicKey(PROJECT_CONFIG_NOTARY_PROGRAM_ID.toString());

  const pdaAccount = await connection.getAccountInfo(projectConfigPubkey);
  const pdaExists = pdaAccount !== null;

  const [vaultPda] = multisig.getVaultPda({
    multisigPda: multisigPubkey,
    index: vaultIndex,
    programId: programPubkey
  });

  let innerInstruction: TransactionInstruction;

  if (!pdaExists) {
    // initialize_project_config discriminator: sha256("global:initialize_project_config")[0..8]
    const initDiscriminator = crypto
      .createHash("sha256")
      .update("global:initialize_project_config")
      .digest()
      .subarray(0, 8);
    const initData = Buffer.alloc(8 + 8 + 8 + 1);
    initDiscriminator.copy(initData, 0);
    initData.writeBigInt64LE(newStartAtUnixSeconds, 8);
    initData.writeBigInt64LE(newEndAtUnixSeconds, 16);
    initData.writeUInt8(vaultIndex, 24);

    innerInstruction = new TransactionInstruction({
      programId: unifiedProgramPubkey,
      keys: [
        { pubkey: vaultPda, isSigner: true, isWritable: false },
        { pubkey: multisigPubkey, isSigner: false, isWritable: false },
        { pubkey: collectionPubkey, isSigner: false, isWritable: false },
        { pubkey: projectConfigPubkey, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data: initData
    });
  } else {
    // update_project_dates discriminator: sha256("global:update_project_dates")[0..8]
    const updateDiscriminator = crypto
      .createHash("sha256")
      .update("global:update_project_dates")
      .digest()
      .subarray(0, 8);
    const updateData = Buffer.alloc(8 + 8 + 8);
    updateDiscriminator.copy(updateData, 0);
    updateData.writeBigInt64LE(newStartAtUnixSeconds, 8);
    updateData.writeBigInt64LE(newEndAtUnixSeconds, 16);

    innerInstruction = new TransactionInstruction({
      programId: unifiedProgramPubkey,
      keys: [
        { pubkey: vaultPda, isSigner: true, isWritable: false },
        { pubkey: multisigPubkey, isSigner: false, isWritable: false },
        { pubkey: collectionPubkey, isSigner: false, isWritable: false },
        { pubkey: projectConfigPubkey, isSigner: false, isWritable: true }
      ],
      data: updateData
    });
  }

  const innerVaultMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: blockhash,
    instructions: [innerInstruction]
  });

  // Step 3: Build native Squads vaultTransactionCreate instruction
  const vaultTxInstruction = multisig.instructions.vaultTransactionCreate({
    multisigPda: multisigPubkey,
    transactionIndex: targetTxIndex,
    creator: creatorPubkey,
    rentPayer: creatorPubkey,
    vaultIndex,
    ephemeralSigners: 0,
    transactionMessage: innerVaultMessage,
    programId: programPubkey
  });

  // Step 4: Build native Squads proposalCreate instruction
  const proposalInstruction = multisig.instructions.proposalCreate({
    multisigPda: multisigPubkey,
    creator: creatorPubkey,
    rentPayer: creatorPubkey,
    transactionIndex: targetTxIndex,
    isDraft: false,
    programId: programPubkey
  });

  const { proposalPda } = deriveSquadsProposalPda(multisigAddress, targetTxIndex);

  // Step 5: Compile into atomic VersionedTransaction (v0)
  const messageV0 = new TransactionMessage({
    payerKey: creatorPubkey,
    recentBlockhash: blockhash,
    instructions: [vaultTxInstruction, proposalInstruction]
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const transactionBase64 = Buffer.from(versionedTx.serialize()).toString("base64");

  return {
    attemptId,
    transactionBase64,
    blockhash,
    lastValidBlockHeight,
    proposalPda,
    transactionIndex: targetTxIndex.toString(),
    signerWallet: creatorWallet
  };
}

/**
 * Assembles an unsigned VersionedTransaction containing the native Squads v4 `vaultTransactionExecute` instruction.
 * When broadcast, Squads Protocol CPI-calls the `project_config_notary` program on Solana Devnet,
 * writing the newly approved dates into the on-chain Notary PDA.
 *
 * @param params - Execution trigger parameters
 * @returns PreparedSquadsTransactionResult
 */
export async function prepareSquadsVaultTransactionExecute(params: {
  memberWallet: string;
  multisigAddress?: string;
  transactionIndex: bigint;
}): Promise<PreparedSquadsTransactionResult> {
  const {
    memberWallet,
    multisigAddress = SQUADS_DEVNET_MULTISIG_PDA,
    transactionIndex
  } = params;

  // Step 1: Connect to Devnet RPC
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const memberPubkey = new PublicKey(memberWallet);
  const multisigPubkey = new PublicKey(multisigAddress);
  const programPubkey = new PublicKey(SQUADS_V4_PROGRAM_ID);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const attemptId = `PROP-EXEC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Step 2: Build native vaultTransactionExecute instruction via @sqds/multisig
  const { instruction: executeInstruction, lookupTableAccounts } =
    await multisig.instructions.vaultTransactionExecute({
      connection,
      multisigPda: multisigPubkey,
      transactionIndex,
      member: memberPubkey,
      programId: programPubkey
    });

  const { proposalPda } = deriveSquadsProposalPda(multisigAddress, transactionIndex);

  // Step 3: Compile into VersionedTransaction
  const messageV0 = new TransactionMessage({
    payerKey: memberPubkey,
    recentBlockhash: blockhash,
    instructions: [executeInstruction]
  }).compileToV0Message(lookupTableAccounts);

  const versionedTx = new VersionedTransaction(messageV0);
  const transactionBase64 = Buffer.from(versionedTx.serialize()).toString("base64");

  return {
    attemptId,
    transactionBase64,
    blockhash,
    lastValidBlockHeight,
    proposalPda,
    transactionIndex: transactionIndex.toString(),
    signerWallet: memberWallet
  };
}

/**
 * Broadcasts a wallet-signed VersionedTransaction to Solana Devnet RPC and waits for confirmation.
 *
 * @param signedTransactionBase64 - Base64 encoded signed wire transaction
 * @returns Broadcast result with signature, slot, and Solscan URL
 */
export async function broadcastSignedTransaction(
  signedTransactionBase64: string
): Promise<BroadcastResult> {
  const rpcUrl = getSolanaRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");

  const txBytes = Buffer.from(signedTransactionBase64, "base64");
  const versionedTx = VersionedTransaction.deserialize(txBytes);

  const txSignature = await connection.sendRawTransaction(versionedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed"
  });

  const confirmation = await connection.confirmTransaction(txSignature, "confirmed");

  if (confirmation.value.err) {
    throw new Error(`TRANSACTION_EXECUTION_FAILED: ${JSON.stringify(confirmation.value.err)}`);
  }

  const txDetails = await connection.getTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed"
  });

  const slot = txDetails?.slot ?? 0;
  const solscanUrl = getSolscanTransactionUrl(txSignature);

  return {
    txSignature,
    slot,
    solscanUrl,
    confirmed: true
  };
}

