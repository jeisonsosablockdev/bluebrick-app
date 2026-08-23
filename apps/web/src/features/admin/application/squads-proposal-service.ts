/**
 * =========================================================================================
 * Layer 2: Application Layer — Squads Proposal & Execution Application Service
 * Module: squads-proposal-service.ts
 *
 * Description:
 * Implements Single Responsibility Principle (SRP) for orchestrating the multi-step
 * on-chain governance flow:
 * 1. Submit Date Change Proposal (Backend Preparation -> Wallet Signing -> Devnet Broadcast).
 * 2. Dispatch Unified Multisig Action (Vote/Execute -> Wallet Signing -> Devnet Broadcast).
 *
 * Invariants:
 * - Enforces connected wallet validation before dispatching transactions.
 * - Deserializes and re-serializes VersionedTransaction bytes safely.
 * - Handles wallet user cancellation gracefully without unhandled rejections.
 * =========================================================================================
 */

import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction,
  type LegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";
import type { PendingDateProposal } from "@/features/admin/presentation/admin-collection-notary-dates-panel";

export type SubmitDateProposalParams = {
  collectionId: string;
  collectionAddress: string | null;
  proposedStartDate: string;
  proposedEndDate: string;
  justification: string;
  signerWallet: string | null;
  signTransaction?: (transaction: LegacyVersionedTransaction) => Promise<LegacyVersionedTransaction>;
};

export type SubmitDateProposalResult = {
  ok: true;
  proposal: PendingDateProposal;
  txSignature?: string;
  solscanUrl?: string;
};

export type DispatchMultisigActionParams = {
  proposalId: string;
  transactionIndex?: string;
  signerWallet: string | null;
  action: "VOTE" | "EXECUTE";
  signTransaction?: (transaction: LegacyVersionedTransaction) => Promise<LegacyVersionedTransaction>;
  collectionAddress?: string;
  projectStartAt?: string;
  projectEndAt?: string;
};

export type DispatchMultisigActionResult = {
  ok: true;
  txSignature: string;
  solscanUrl?: string;
  slot?: number;
  isExecuted: boolean;
  message?: string;
};

/**
 * Orchestrates proposal submission from the collection panel to Solana Devnet.
 *
 * @param params - Submission parameters including proposed dates and connected wallet.
 * @returns Result object containing the confirmed proposal and Devnet transaction signature.
 */
export async function submitDateChangeProposal(
  params: SubmitDateProposalParams
): Promise<SubmitDateProposalResult> {
  const {
    collectionId,
    collectionAddress,
    proposedStartDate,
    proposedEndDate,
    justification,
    signerWallet,
    signTransaction
  } = params;

  // Step 1: Validate wallet connection
  if (!signerWallet || !signTransaction) {
    throw new Error("Se requiere una wallet de Solana conectada para firmar la propuesta en Squads Multisig.");
  }

  const proposedStartAt = new Date(`${proposedStartDate}T00:00:00.000Z`).toISOString();
  const proposedEndAt = new Date(`${proposedEndDate}T23:59:59.000Z`).toISOString();

  const target = collectionId || collectionAddress;
  const targetCollection =
    collectionAddress ||
    (collectionId && collectionId.length > 30 ? collectionId : "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz");

  // Step 2: Prepare unsigned proposal transaction via backend API
  const res = await fetch(`/api/admin/collections/${target}/date-change-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposedStartAt,
      proposedEndAt,
      justification,
      requesterWallet: signerWallet,
      collectionAddress: targetCollection
    })
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || "Error al enviar la solicitud de cambio de fecha.");
  }

  if (!data.preparedTx?.transactionBase64) {
    throw new Error(data.message || "No se pudo preparar la transacción on-chain de Squads v4 para firmar.");
  }

  // Step 3: Request cryptographic signature from Phantom / Solflare wallet
  let signedBase64: string;
  try {
    const rawBytes = Buffer.from(data.preparedTx.transactionBase64, "base64");
    const unsignedTx = deserializeLegacyVersionedTransaction(new Uint8Array(rawBytes));
    const signedTx = await signTransaction(unsignedTx);
    const signedBytes = serializeLegacyVersionedTransaction(signedTx);
    signedBase64 = Buffer.from(signedBytes).toString("base64");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al firmar con wallet.";
    if (
      msg.toLowerCase().includes("user rejected") ||
      msg.toLowerCase().includes("rejected the request") ||
      msg.toLowerCase().includes("user cancel")
    ) {
      throw new Error("Cancelaste la solicitud de firma en la wallet.");
    }
    throw err;
  }

  // Step 4: Broadcast signed transaction to Solana Devnet RPC
  const broadcastRes = await fetch("/api/admin/treasury/squads/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposalId: data.data.requestId,
      signerWallet,
      signedTransactionBase64: signedBase64
    })
  });

  const broadcastData = await broadcastRes.json();
  if (!broadcastRes.ok) {
    throw new Error(broadcastData.message || "Error al emitir propuesta a Solana Devnet.");
  }

  const proposalData = data.data as PendingDateProposal;
  if (broadcastData.data?.txSignature) {
    proposalData.txSignature = broadcastData.data.txSignature;
    proposalData.solscanUrl = broadcastData.data.solscanUrl;
  }

  return {
    ok: true,
    proposal: proposalData,
    txSignature: broadcastData.data?.txSignature,
    solscanUrl: broadcastData.data?.solscanUrl
  };
}

/**
 * Dispatches a multisig vote or execution action against Squads Protocol v4 on Solana Devnet.
 *
 * @param params - Action parameters including proposalId, transactionIndex, and action type.
 * @returns Result object containing the confirmed signature, slot, and execution status.
 */
export async function dispatchMultisigAction(
  params: DispatchMultisigActionParams
): Promise<DispatchMultisigActionResult> {
  const {
    proposalId,
    transactionIndex,
    signerWallet,
    action,
    signTransaction,
    collectionAddress,
    projectStartAt,
    projectEndAt
  } = params;

  // Step 1: Validate wallet connection
  if (!signerWallet || !signTransaction) {
    throw new Error("Se requiere una wallet de Solana conectada para realizar esta acción.");
  }

  // Step 2: Prepare unsigned transaction via backend API
  const prepareRes = await fetch("/api/admin/treasury/squads/prepare-vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposalId,
      transactionIndex,
      signerWallet,
      collectionAddress,
      newStartAt: projectStartAt,
      newEndAt: projectEndAt,
      action
    })
  });

  const prepareJson = await prepareRes.json();
  if (!prepareRes.ok || !prepareJson.data?.transactionBase64) {
    throw new Error(prepareJson.message ?? "Error al preparar la transacción en Solana Devnet.");
  }

  // Step 3: Request cryptographic signature from Phantom / Solflare wallet
  let signedTransactionBase64: string;
  try {
    const rawBytes = Buffer.from(prepareJson.data.transactionBase64, "base64");
    const unsignedTx = deserializeLegacyVersionedTransaction(new Uint8Array(rawBytes));
    const signedTx = await signTransaction(unsignedTx);
    const signedBytes = serializeLegacyVersionedTransaction(signedTx);
    signedTransactionBase64 = Buffer.from(signedBytes).toString("base64");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al firmar con wallet.";
    if (
      msg.toLowerCase().includes("user rejected") ||
      msg.toLowerCase().includes("rejected the request") ||
      msg.toLowerCase().includes("user cancel")
    ) {
      throw new Error("Cancelaste la solicitud de firma en la wallet.");
    }
    throw err;
  }

  // Step 4: Broadcast signed transaction to Solana Devnet RPC
  const res = await fetch("/api/admin/treasury/squads/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposalId,
      signerWallet,
      signedTransactionBase64
    })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? "Error al procesar la acción multisig en Solana Devnet.");
  }

  const isExecuted = action === "EXECUTE" || json.data?.executed === true;

  return {
    ok: true,
    txSignature: json.data?.txSignature,
    solscanUrl: json.data?.solscanUrl,
    slot: json.data?.slot,
    isExecuted,
    message: json.data?.message
  };
}
