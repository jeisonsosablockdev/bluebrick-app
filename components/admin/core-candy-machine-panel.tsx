"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { convertUsdToSol, usdToUsdcAtomic } from "@/lib/admin/pricing";
import { getSolscanAccountUrl, getSolscanTransactionUrl } from "@/lib/infrastructure/solana";
import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";

type PreparedTransaction = {
  kind:
    | "create-collection"
    | "create-candy-machine"
    | "add-config-lines"
    | "mint"
    | "add-owner-freeze-plugin"
    | "add-app-data-plugin"
    | "write-app-data";
  label: string;
  serial: number | null;
  expectedAddress: string | null;
  transactionBase64: string;
};

type DeployPrepareResponse = {
  deployId: string;
  candyMachineAddress: string;
  collectionAddress: string;
  quantity: number;
  paymentMode: "USDC";
  priceUsdcAtomic: number | null;
  priceLamports: null;
  startDate: string;
  transactions: PreparedTransaction[];
};

type SubmitResponse = {
  transactions: Array<{
    kind: PreparedTransaction["kind"];
    serial: number | null;
    expectedAddress: string | null;
    signature: string;
  }>;
};

type ErrorResponse = {
  error?: string | {
    code?: string;
    message?: string;
    providerStatus?: number | null;
    providerCode?: string | null;
  };
  code?: string;
  recoverable?: boolean;
};

export type SnapshotFinalizeResponse = {
  snapshotId: string;
  mintJobId: string;
  verificationStatus: "verified" | "failed" | "degraded";
  verificationMethod: "das_get_assets_by_group" | "candy_machine_items_loaded";
  marketplaceHandoffStatus: "pending" | "ready" | "consumed" | "failed";
  expectedQuantity: number;
  foundAssets: number | null;
  canCreateAsset: boolean;
  verificationError: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

type RunSignatureEntry = {
  signature: string;
  kind: PreparedTransaction["kind"];
  label: string;
  expectedAddress: string | null;
};

type DeploySignaturePollResult = {
  allConfirmed: boolean;
  hasFailedSignature: boolean;
  attempts: number;
};

type DeploySignaturePollOptions = {
  maxAttempts?: number;
  pollDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  fetchStatuses?: (signatures: string[]) => Promise<Record<string, unknown>>;
};

export type DeployCompletedPayload = {
  candyMachineAddress: string;
  collectionAddress: string;
  quantity: number;
  signatures: RunSignatureEntry[];
};

type CoreCandyMachinePanelProps = {
  prefill?: {
    collectionName?: string;
    assetNamePrefix?: string;
    internalCode?: string;
    assetUri?: string;
    imageUrl?: string;
    quantity?: number;
    description?: string;
    symbol?: string;
    nftPriceUsd?: number;
    nftPriceInputCurrency?: "USD" | "SOL";
    solUsdRate?: number | null;
  };
  snapshotContext?: {
    draftId: string;
    formSnapshot: Record<string, unknown>;
  };
  onSnapshotFinalized?: (result: SnapshotFinalizeResponse) => void;
  onDeployCompleted?: (payload: DeployCompletedPayload) => void;
};

type PanelFormState = {
  collectionName: string;
  collectionUri: string;
  assetNamePrefix: string;
  assetUri: string;
  quantity: string;
  startDate: string;
};

type RunState = {
  status: string;
  deployProgress: { current: number; total: number };
  candyMachineAddress: string | null;
  collectionAddress: string | null;
  signatures: RunSignatureEntry[];
};

type SnapshotFinalizeInput = {
  quantity: number;
  candyMachineAddress: string;
  collectionAddress: string;
  signatures: RunSignatureEntry[];
  formState: PanelFormState;
  draftId: string;
  formSnapshot: Record<string, unknown>;
};

type SnapshotRecoveryContext = SnapshotFinalizeInput & {
  deployId: string;
};

type SnapshotRecheckMode = "manual" | "auto";

export function isDeploySignatureConfirmedForCreateAsset(status: unknown): boolean {
  if (!status || typeof status !== "object") {
    return false;
  }

  const record = status as { confirmed?: unknown; failed?: unknown; confirmationStatus?: unknown };
  if (record.failed === true) {
    return false;
  }

  if (record.confirmed === true) {
    return true;
  }

  return record.confirmationStatus === "confirmed" || record.confirmationStatus === "finalized";
}

function isDeploySignatureFailedForCreateAsset(status: unknown): boolean {
  return Boolean(status && typeof status === "object" && (status as { failed?: unknown }).failed === true);
}

type GeneratedMetadataUris = {
  collectionUri: string;
  assetUri: string;
  resolvedCollectionName?: string;
  resolvedAssetNamePrefix?: string;
};

const DEFAULT_START_DATE = () => new Date(Date.now() + 60_000).toISOString();
const IMAGE_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
const SUBMIT_TX_TIMEOUT_MS = 120_000;
const DEPLOY_SIGNATURE_STATUS_MAX_ATTEMPTS = 30;
const DEPLOY_SIGNATURE_STATUS_POLL_MS = 2_000;
const SNAPSHOT_AUTO_RECHECK_DELAY_MS = 15_000;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64Value: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64Value, "base64"));
}

function truncate(value: string): string {
  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

function logClientDeployTrace(event: string, context: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({
    eventName: `core_candy_machine.deploy.client.${event}`,
    emittedAt: new Date().toISOString(),
    ...context
  }));
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

function readErrorMessage(payload: ErrorResponse | null, fallback: string): string {
  const error = payload?.error;
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const providerSuffix = [
      typeof error.providerStatus === "number" ? `status ${error.providerStatus}` : "",
      typeof error.providerCode === "string" && error.providerCode.trim() ? error.providerCode.trim() : ""
    ].filter(Boolean).join(", ");
    const message = typeof error.message === "string" && error.message.trim() ? error.message.trim() : fallback;
    return providerSuffix ? `${message} (${providerSuffix})` : message;
  }

  return fallback;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchDeploySignatureStatuses(signatures: string[]): Promise<Record<string, unknown>> {
  const statusResponse = await fetch("/api/admin/core-candy-machine/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signatures })
  });

  if (!statusResponse.ok) {
    return {};
  }

  const payload = await parseJson<{ statuses?: Record<string, unknown> }>(statusResponse);
  return payload?.statuses ?? {};
}

export async function waitForDeploySignatureStatuses(
  signatures: string[],
  options: DeploySignaturePollOptions = {}
): Promise<DeploySignaturePollResult> {
  const maxAttempts = options.maxAttempts ?? DEPLOY_SIGNATURE_STATUS_MAX_ATTEMPTS;
  const pollDelayMs = options.pollDelayMs ?? DEPLOY_SIGNATURE_STATUS_POLL_MS;
  const sleep = options.sleep ?? wait;
  const fetchStatuses = options.fetchStatuses ?? fetchDeploySignatureStatuses;
  let allConfirmed = false;
  let hasFailedSignature = false;
  let attempts = 0;

  while (!allConfirmed && attempts < maxAttempts) {
    await sleep(pollDelayMs);

    try {
      const statuses = await fetchStatuses(signatures);
      hasFailedSignature = signatures.some((signature) =>
        isDeploySignatureFailedForCreateAsset(statuses[signature])
      );
      allConfirmed = signatures.every((signature) =>
        isDeploySignatureConfirmedForCreateAsset(statuses[signature])
      );

      if (hasFailedSignature) {
        break;
      }
    } catch {
      // Keep polling through transient backend or network errors.
    }

    attempts++;
  }

  return { allConfirmed, hasFailedSignature, attempts };
}

function parsePositiveInt(value: string): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

function formatUsdAmount(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })}`;
}

function formatSolAmount(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 8 })} SOL`;
}

function looksLikeImageUri(uri: string): boolean {
  const lower = uri.toLowerCase();
  return IMAGE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function looksLikeMetadataJsonUri(uri: string): boolean {
  const trimmed = uri.trim().toLowerCase();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("ipfs://")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.pathname.toLowerCase().endsWith(".json");
  } catch {
    return false;
  }
}

async function signPreparedTransaction(
  signTransaction: NonNullable<ReturnType<typeof useWallet>["signTransaction"]>,
  transactionBase64: string
): Promise<string> {
  const unsigned = deserializeLegacyVersionedTransaction(fromBase64(transactionBase64));
  const signed = await signTransaction(unsigned);
  return toBase64(serializeLegacyVersionedTransaction(signed));
}

export function CoreCandyMachinePanel({
  prefill,
  snapshotContext,
  onSnapshotFinalized,
  onDeployCompleted
}: CoreCandyMachinePanelProps) {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const [form, setForm] = useState<PanelFormState>({
    collectionName: prefill?.collectionName?.trim() || "Core CM Collection",
    collectionUri: "",
    assetNamePrefix: prefill?.assetNamePrefix?.trim() || "Asset",
    assetUri: prefill?.assetUri?.trim() || "",
    quantity: prefill?.quantity && prefill.quantity > 0 ? String(prefill.quantity) : "1",
    startDate: DEFAULT_START_DATE()
  });
  const [runState, setRunState] = useState<RunState>({
    status: "Idle",
    deployProgress: { current: 0, total: 0 },
    candyMachineAddress: null,
    collectionAddress: null,
    signatures: []
  });
  const [busyAction, setBusyAction] = useState<"deploy" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingUri, setIsGeneratingUri] = useState(false);
  const [isFinalizingSnapshot, setIsFinalizingSnapshot] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState<SnapshotFinalizeResponse | null>(null);
  const [snapshotRecoveryContext, setSnapshotRecoveryContext] = useState<SnapshotRecoveryContext | null>(null);
  const [snapshotAutoRecheckArmed, setSnapshotAutoRecheckArmed] = useState(false);

  const requestGeneratedMetadataUris = useCallback(async (): Promise<GeneratedMetadataUris> => {
    if (!prefill?.imageUrl) {
      throw new Error("Upload an image first to generate metadata URIs.");
    }

    const response = await fetch("/api/admin/core-candy-machine/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: prefill.collectionName ?? form.collectionName,
        assetNamePrefix: prefill.assetNamePrefix ?? form.assetNamePrefix,
        internalCode: prefill.internalCode ?? "",
        symbol: prefill.symbol ?? "NFT",
        description: prefill.description ?? "",
        image: prefill.imageUrl,
        quantity: parsePositiveInt(form.quantity) ?? 1,
        startSerial: 1
      })
    });

    const payload = await parseJson<{
      collectionUri?: string;
      assetUri?: string;
      resolvedCollectionName?: string;
      resolvedAssetNamePrefix?: string;
    } & ErrorResponse>(response);
    if (!response.ok || !payload.collectionUri || !payload.assetUri) {
      throw new Error(readErrorMessage(payload, "Could not generate metadata URIs."));
    }

    return {
      collectionUri: payload.collectionUri.trim(),
      assetUri: payload.assetUri.trim(),
      resolvedCollectionName: typeof payload.resolvedCollectionName === "string"
        ? payload.resolvedCollectionName.trim()
        : undefined,
      resolvedAssetNamePrefix: typeof payload.resolvedAssetNamePrefix === "string"
        ? payload.resolvedAssetNamePrefix.trim()
        : undefined
    };
  }, [
    form.assetNamePrefix,
    form.collectionName,
    form.quantity,
    prefill?.assetNamePrefix,
    prefill?.collectionName,
    prefill?.description,
    prefill?.internalCode,
    prefill?.imageUrl,
    prefill?.symbol
  ]);

  const generateMetadataUris = useCallback(async (): Promise<GeneratedMetadataUris> => {
    setIsGeneratingUri(true);
    try {
      const generated = await requestGeneratedMetadataUris();
      setForm((current) => ({
        ...current,
        collectionName: generated.resolvedCollectionName || current.collectionName,
        collectionUri: generated.collectionUri,
        assetNamePrefix: generated.resolvedAssetNamePrefix || current.assetNamePrefix,
        assetUri: generated.assetUri
      }));
      setErrorMessage(null);
      return generated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate metadata URIs.";
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsGeneratingUri(false);
    }
  }, [requestGeneratedMetadataUris]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      collectionName: prefill?.collectionName?.trim() || current.collectionName,
      assetNamePrefix: prefill?.assetNamePrefix?.trim() || current.assetNamePrefix,
      assetUri: prefill?.assetUri?.trim() || current.assetUri,
      quantity: prefill?.quantity && prefill.quantity > 0 ? String(prefill.quantity) : current.quantity
    }));
  }, [prefill?.assetNamePrefix, prefill?.assetUri, prefill?.collectionName, prefill?.quantity]);

  useEffect(() => {
    const shouldGenerate = Boolean(prefill?.imageUrl) && (!form.collectionUri.trim() || !form.assetUri.trim());
    if (!shouldGenerate) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await generateMetadataUris();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not generate metadata URIs.");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [form.assetUri, form.collectionUri, prefill?.imageUrl, generateMetadataUris]);

  const canRun = connected && Boolean(publicKey) && Boolean(signTransaction);
  const quantity = parsePositiveInt(form.quantity);
  const canGenerateMetadataFromPrefill = Boolean(prefill?.imageUrl) && (
    !looksLikeMetadataJsonUri(form.collectionUri)
    || !looksLikeMetadataJsonUri(form.assetUri)
    || looksLikeImageUri(form.collectionUri)
    || looksLikeImageUri(form.assetUri)
  );
  const deployPercentage = useMemo(() => {
    if (runState.deployProgress.total <= 0) {
      return 0;
    }

    return Math.round((runState.deployProgress.current / runState.deployProgress.total) * 100);
  }, [runState.deployProgress]);
  const configuredNftPriceUsd = useMemo(() => {
    const value = prefill?.nftPriceUsd;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return null;
    }

    return value;
  }, [prefill?.nftPriceUsd]);
  const configuredNftPriceUsdcAtomic = useMemo(() => {
    if (!configuredNftPriceUsd) {
      return null;
    }

    try {
      return usdToUsdcAtomic(configuredNftPriceUsd);
    } catch {
      return null;
    }
  }, [configuredNftPriceUsd]);
  const configuredNftPriceSol = useMemo(() => {
    if (!configuredNftPriceUsd || typeof prefill?.solUsdRate !== "number" || prefill.solUsdRate <= 0) {
      return null;
    }

    try {
      return convertUsdToSol(configuredNftPriceUsd, prefill.solUsdRate);
    } catch {
      return null;
    }
  }, [configuredNftPriceUsd, prefill?.solUsdRate]);
  async function submitSignedTransactionsBatch(
    deployId: string,
    preparedTransactions: PreparedTransaction[],
    signedTransactionsBase64: string[]
  ): Promise<SubmitResponse["transactions"]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, SUBMIT_TX_TIMEOUT_MS);

    try {
      logClientDeployTrace("submit_request", {
        deployId,
        total: preparedTransactions.length
      });

      const response = await fetch("/api/admin/core-candy-machine/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          deployId,
          signedTransactions: preparedTransactions.map((transaction, index) => ({
            kind: transaction.kind,
            serial: transaction.serial,
            expectedAddress: transaction.expectedAddress,
            transactionBase64: signedTransactionsBase64[index]
          }))
        })
      });

      const payload = await parseJson<SubmitResponse & ErrorResponse>(response);
      if (!response.ok || !Array.isArray(payload.transactions)) {
        throw new Error(readErrorMessage(payload, "Could not submit deploy transactions."));
      }

      logClientDeployTrace("submit_response", {
        deployId,
        total: payload.transactions.length
      });

      return payload.transactions;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        logClientDeployTrace("submit_timeout", {
          deployId,
          total: preparedTransactions.length
        });
        throw new Error("Timed out submitting deploy transactions. The backend did not respond in time.");
      }

      logClientDeployTrace("submit_error", {
        deployId,
        message: error instanceof Error ? error.message : "Unknown submit error"
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function signPreparedTransactions(
    deployId: string,
    preparedTransactions: PreparedTransaction[],
    signSingle: NonNullable<ReturnType<typeof useWallet>["signTransaction"]>
  ): Promise<string[]> {
    logClientDeployTrace("sign_start", {
      deployId,
      total: preparedTransactions.length,
      mode: signAllTransactions ? "signAllTransactions" : "signTransaction"
    });

    if (signAllTransactions) {
      const unsignedTransactions = preparedTransactions.map((transaction) =>
        deserializeLegacyVersionedTransaction(fromBase64(transaction.transactionBase64))
      );
      const signedTransactions = await signAllTransactions(unsignedTransactions);
      logClientDeployTrace("sign_complete", {
        deployId,
        total: signedTransactions.length,
        mode: "signAllTransactions"
      });
      return signedTransactions.map((signedTransaction) => toBase64(serializeLegacyVersionedTransaction(signedTransaction)));
    }

    const signedTransactionsBase64: string[] = [];

    for (const [index, transaction] of preparedTransactions.entries()) {
      const signedBase64 = await signPreparedTransaction(signSingle, transaction.transactionBase64);
      signedTransactionsBase64.push(signedBase64);

      setRunState((current) => ({
        ...current,
        status: `Signing (${index + 1}/${preparedTransactions.length})`
      }));

      logClientDeployTrace("sign_single_complete", {
        deployId,
        index: index + 1,
        total: preparedTransactions.length,
        kind: transaction.kind,
        expectedAddress: transaction.expectedAddress
      });
    }

    logClientDeployTrace("sign_complete", {
      deployId,
      total: signedTransactionsBase64.length,
      mode: "signTransaction"
    });

    return signedTransactionsBase64;
  }

  const finalizeSnapshot = useCallback(async (input: SnapshotFinalizeInput): Promise<SnapshotFinalizeResponse | null> => {
    setIsFinalizingSnapshot(true);

    try {
      const currentQuantity = input.quantity;
      const requestForm = input.formState;

      const response = await fetch("/api/admin/core-candy-machine/snapshot/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: input.draftId,
          formSnapshot: input.formSnapshot,
          mint: {
            quantity: currentQuantity,
            status: "Mint complete.",
            collectionName: requestForm.collectionName,
            collectionUri: requestForm.collectionUri,
            assetNamePrefix: requestForm.assetNamePrefix,
            assetUri: requestForm.assetUri,
            startDate: requestForm.startDate,
            candyMachineAddress: input.candyMachineAddress,
            collectionAddress: input.collectionAddress,
            signatures: input.signatures
          }
        })
      });

      const payload = await parseJson<SnapshotFinalizeResponse & ErrorResponse>(response);
      if (!response.ok || !payload.snapshotId) {
        throw new Error(readErrorMessage(payload, "Could not finalize mint snapshot."));
      }

      setSnapshotResult(payload);
      onSnapshotFinalized?.(payload);
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not finalize mint snapshot.";
      setErrorMessage(message);
      return null;
    } finally {
      setIsFinalizingSnapshot(false);
    }
  }, [onSnapshotFinalized]);

  const recheckSnapshot = useCallback(async (mode: SnapshotRecheckMode = "manual"): Promise<void> => {
    if (!snapshotRecoveryContext) {
      setErrorMessage("No confirmed Candy Machine deploy is available for snapshot re-check.");
      return;
    }

    setErrorMessage(null);
    setSnapshotAutoRecheckArmed(false);
    setRunState((current) => ({
      ...current,
      status: mode === "auto"
        ? "Automatically re-checking mint snapshot..."
        : "Re-checking mint snapshot..."
    }));
    logClientDeployTrace("snapshot_recheck_request", {
      deployId: snapshotRecoveryContext.deployId,
      candyMachineAddress: snapshotRecoveryContext.candyMachineAddress,
      collectionAddress: snapshotRecoveryContext.collectionAddress,
      mode,
      signatures: snapshotRecoveryContext.signatures.length
    });

    const finalizedSnapshot = await finalizeSnapshot(snapshotRecoveryContext);

    logClientDeployTrace("snapshot_recheck_response", {
      deployId: snapshotRecoveryContext.deployId,
      canCreateAsset: finalizedSnapshot?.canCreateAsset ?? false,
      verificationStatus: finalizedSnapshot?.verificationStatus ?? null,
      mode,
      snapshotId: finalizedSnapshot?.snapshotId ?? null
    });

    if (!finalizedSnapshot) {
      setRunState((current) => ({
        ...current,
        status: "Deploy confirmed, but mint snapshot is not ready."
      }));
      return;
    }

    if (!finalizedSnapshot.canCreateAsset) {
      const message = finalizedSnapshot.verificationError?.message
        ?? "Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.";
      setRunState((current) => ({
        ...current,
        status: "Deploy confirmed, but mint snapshot is not ready."
      }));
      setErrorMessage(message);
      return;
    }

    setSnapshotRecoveryContext(null);
    setRunState((current) => ({
      ...current,
      status: "Deploy complete. Snapshot verified. Candy Machine ready for Create Asset."
    }));
    onDeployCompleted?.({
      candyMachineAddress: snapshotRecoveryContext.candyMachineAddress,
      collectionAddress: snapshotRecoveryContext.collectionAddress,
      quantity: snapshotRecoveryContext.quantity,
      signatures: [...snapshotRecoveryContext.signatures]
    });
  }, [finalizeSnapshot, onDeployCompleted, snapshotRecoveryContext]);

  useEffect(() => {
    if (!snapshotRecoveryContext || !snapshotAutoRecheckArmed || busyAction !== null || isFinalizingSnapshot) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSnapshotAutoRecheckArmed(false);
      void recheckSnapshot("auto");
    }, SNAPSHOT_AUTO_RECHECK_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    busyAction,
    isFinalizingSnapshot,
    recheckSnapshot,
    snapshotAutoRecheckArmed,
    snapshotRecoveryContext
  ]);

  async function runDeployFlow(): Promise<void> {
    if (!canRun || !publicKey || !signTransaction) {
      setErrorMessage("Connect Phantom and keep wallet unlocked.");
      return;
    }

    if (!quantity) {
      setErrorMessage("Quantity must be a positive integer.");
      return;
    }

    if (!configuredNftPriceUsd) {
      setErrorMessage("NFT cost from form is missing or invalid. Set Costo por NFT before deploy.");
      return;
    }

    let priceUsdcAtomic: number;
    try {
      priceUsdcAtomic = usdToUsdcAtomic(configuredNftPriceUsd);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not derive USDC atomic price from form value.");
      return;
    }

    let collectionUri = form.collectionUri.trim();
    let assetUri = form.assetUri.trim();

    const shouldAutoGenerateUris = (
      !collectionUri
      || !assetUri
      || looksLikeImageUri(collectionUri)
      || looksLikeImageUri(assetUri)
    );

    if (shouldAutoGenerateUris && prefill?.imageUrl) {
      try {
        const generated = await generateMetadataUris();
        collectionUri = generated.collectionUri;
        assetUri = generated.assetUri;
      } catch {
        return;
      }
    }

    if (!looksLikeMetadataJsonUri(collectionUri) || looksLikeImageUri(collectionUri)) {
      setErrorMessage("Collection URI must be a public metadata JSON URI (https://...json or ipfs://...).");
      return;
    }

    if (!looksLikeMetadataJsonUri(assetUri) || looksLikeImageUri(assetUri)) {
      setErrorMessage("Asset URI must be a public metadata JSON URI (https://...json or ipfs://...).");
      return;
    }

    setErrorMessage(null);
    setSnapshotResult(null);
    setSnapshotRecoveryContext(null);
    setSnapshotAutoRecheckArmed(false);
    setBusyAction("deploy");
    setRunState((current) => ({
      ...current,
      status: "Preparing deploy...",
      deployProgress: { current: 0, total: 0 },
      signatures: []
    }));

    try {
      const deployFormState: PanelFormState = {
        ...form,
        collectionUri,
        assetUri
      };

      logClientDeployTrace("prepare_request", {
        quantity,
        hasCollectionUri: Boolean(collectionUri),
        hasAssetUri: Boolean(assetUri)
      });

      const prepareResponse = await fetch("/api/admin/core-candy-machine/deploy/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: form.collectionName,
          collectionUri,
          assetNamePrefix: form.assetNamePrefix,
          assetUri,
          quantity,
          priceUsdcAtomic,
          startDate: form.startDate
        })
      });
      const prepared = await parseJson<DeployPrepareResponse & ErrorResponse>(prepareResponse);

      if (!prepareResponse.ok || !Array.isArray(prepared.transactions)) {
        throw new Error(readErrorMessage(prepared, "Could not prepare deploy transactions."));
      }

      logClientDeployTrace("prepare_response", {
        deployId: prepared.deployId,
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        total: prepared.transactions.length
      });

      setRunState((current) => ({
        ...current,
        status: "Deploy prepared. Signing transactions...",
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        deployProgress: { current: 0, total: prepared.transactions.length },
        signatures: []
      }));

      const signedTransactionsBase64 = await signPreparedTransactions(prepared.deployId, prepared.transactions, signTransaction);

      setRunState((current) => ({
        ...current,
        status: `Submitting ${prepared.transactions.length} transactions...`
      }));

      const submittedTransactions = await submitSignedTransactionsBatch(
        prepared.deployId,
        prepared.transactions,
        signedTransactionsBase64
      );
      const collectedSignatures: RunSignatureEntry[] = submittedTransactions.map((submitted, index) => ({
        signature: submitted.signature,
        kind: submitted.kind,
        label: prepared.transactions[index]?.label ?? submitted.kind,
        expectedAddress: submitted.expectedAddress
      }));

      setRunState((current) => ({
        ...current,
        deployProgress: { current: prepared.transactions.length, total: prepared.transactions.length },
        signatures: [...collectedSignatures],
        status: "Waiting for network confirmation via webhook..."
      }));

      const deploySignatureStatuses = await waitForDeploySignatureStatuses(
        collectedSignatures.map((entry) => entry.signature)
      );
      const { allConfirmed, hasFailedSignature } = deploySignatureStatuses;

      logClientDeployTrace("status_poll_complete", {
        deployId: prepared.deployId,
        allConfirmed,
        hasFailedSignature,
        attempts: deploySignatureStatuses.attempts
      });

      if (hasFailedSignature) {
        setErrorMessage("One or more deploy transactions failed on-chain. Create Asset remains blocked.");
        setRunState((current) => ({
          ...current,
          status: "Deploy failed"
        }));
        return;
      }

      if (!allConfirmed) {
         setErrorMessage("Deploy transactions were submitted, but confirmation took too long. They might still succeed in the background. Check Solscan.");
      }

      setRunState((current) => ({
        ...current,
        status: allConfirmed
          ? "Deploy confirmed. Finalizing mint snapshot..."
          : "Deploy submitted (pending background confirmation). Snapshot not finalized yet."
      }));

      if (!allConfirmed) {
        return;
      }

      const snapshotFinalizeInput: SnapshotFinalizeInput = {
        quantity,
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        signatures: collectedSignatures,
        formState: deployFormState,
        draftId: snapshotContext?.draftId?.trim() || `core-cm-${Date.now()}`,
        formSnapshot: snapshotContext?.formSnapshot ?? {
          internalCode: prefill?.internalCode ?? "",
          collectionName: deployFormState.collectionName,
          assetNamePrefix: deployFormState.assetNamePrefix,
          quantity
        }
      };
      const finalizedSnapshot = await finalizeSnapshot(snapshotFinalizeInput);

      logClientDeployTrace("snapshot_finalize_response", {
        deployId: prepared.deployId,
        canCreateAsset: finalizedSnapshot?.canCreateAsset ?? false,
        verificationStatus: finalizedSnapshot?.verificationStatus ?? null,
        snapshotId: finalizedSnapshot?.snapshotId ?? null
      });

      if (!finalizedSnapshot?.canCreateAsset) {
        const message = finalizedSnapshot?.verificationError?.message
          ?? "Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.";
        setSnapshotRecoveryContext({
          deployId: prepared.deployId,
          ...snapshotFinalizeInput
        });
        setSnapshotAutoRecheckArmed(true);
        setRunState((current) => ({
          ...current,
          status: "Deploy confirmed. Waiting 15 seconds before snapshot re-check."
        }));
        setErrorMessage(message);
        return;
      }

      setSnapshotRecoveryContext(null);
      setSnapshotAutoRecheckArmed(false);
      setRunState((current) => ({
        ...current,
        status: "Deploy complete. Snapshot verified. Candy Machine ready for Create Asset."
      }));

      onDeployCompleted?.({
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        quantity,
        signatures: [...collectedSignatures]
      });
    } catch (error) {
      logClientDeployTrace("flow_error", {
        message: error instanceof Error ? error.message : "Deploy failed unexpectedly."
      });
      setErrorMessage(error instanceof Error ? error.message : "Deploy failed unexpectedly.");
      setRunState((current) => ({
        ...current,
        status: "Deploy failed"
      }));
    } finally {
      setBusyAction(null);
    }
  }

  const verificationTone = snapshotResult?.canCreateAsset
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
    : "border-amber-400/40 bg-amber-500/10 text-amber-100";

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">Core Candy Machine Mint</h3>
        <p className="text-xs text-white/70">
          Deploy uses guards <code>startDate</code> + <code>tokenPayment(USDC)</code>. Wallet only signs server-built transactions.
        </p>
        {configuredNftPriceUsd && configuredNftPriceUsdcAtomic ? (
          <p className="text-xs text-emerald-200/90">
            Guard price from <code>Costo por NFT</code>: {formatUsdAmount(configuredNftPriceUsd)} ({configuredNftPriceUsdcAtomic.toLocaleString("en-US")} atomic USDC).
          </p>
        ) : (
          <p className="text-xs text-amber-200/90">
            Missing <code>Costo por NFT</code> from step 1. Deploy will stay blocked until the field has a positive value.
          </p>
        )}
        {prefill?.nftPriceInputCurrency === "SOL" && configuredNftPriceSol ? (
          <p className="text-xs text-cyan-200/90">
            Input equivalence: ~{formatSolAmount(configuredNftPriceSol)}.
          </p>
        ) : null}
        <p className="text-xs text-amber-200/90">
          `collectionUri` and `assetUri` must point to JSON metadata, not image URLs.
        </p>
        <p className="text-xs text-sky-200/85">
          Collection name and asset prefix are auto-generated and server-normalized to avoid Candy Machine length failures.
        </p>
        {isGeneratingUri ? (
          <div className="overflow-hidden rounded-2xl border border-cyan-300/35 bg-cyan-400/10 p-3 text-xs text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.16)]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/40 bg-slate-950/60">
                <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-300/20" />
                <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Creating metadata links</p>
                <p className="text-cyan-100/80">Generating Collection URI and Asset URI from the uploaded media.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {["Collection URI", "Asset URI"].map((label) => (
                <div key={label} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-cyan-100/80">
                    <span>{label}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      Generating
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-200 via-white to-emerald-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {!isGeneratingUri && canGenerateMetadataFromPrefill ? (
          <button
            className="text-xs font-semibold text-cyan-200 underline underline-offset-2"
            onClick={() => {
              void generateMetadataUris().catch(() => null);
            }}
            type="button"
          >
            Generate URIs from uploaded image
          </button>
        ) : null}
        {prefill?.description ? (
          <p className="text-xs text-white/60">{prefill.description}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{errorMessage}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-white/70">
          Collection name
          <Input readOnly value={form.collectionName} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Collection URI
          <Input
            className={isGeneratingUri ? "animate-pulse border border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]" : undefined}
            value={form.collectionUri}
            onChange={(event) => setForm((current) => ({ ...current, collectionUri: event.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Asset name prefix
          <Input readOnly value={form.assetNamePrefix} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Asset URI
          <Input
            className={isGeneratingUri ? "animate-pulse border border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]" : undefined}
            value={form.assetUri}
            onChange={(event) => setForm((current) => ({ ...current, assetUri: event.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Quantity
          <Input type="number" min={1} value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Start date (ISO)
          <Input value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.05] px-3 py-3 text-xs text-white/85 backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-cyan-100/90">
              <span>Deploy</span>
              <span>{runState.deployProgress.current}/{runState.deployProgress.total || 0}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/20 bg-slate-950/45 backdrop-blur-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300/85 via-sky-400/85 to-emerald-300/85 shadow-[0_0_18px_rgba(56,189,248,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, deployPercentage))}%` }}
              />
            </div>
            <p className="text-[11px] text-cyan-100/80">{deployPercentage}%</p>
          </div>
          <p className="text-[11px] text-white/70">{runState.status}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" onClick={() => void runDeployFlow()} disabled={!canRun || busyAction !== null || isFinalizingSnapshot}>
          {busyAction === "deploy" ? "Deploying..." : "Deploy"}
        </Button>
        {snapshotRecoveryContext && !snapshotResult?.canCreateAsset && !snapshotAutoRecheckArmed && !isFinalizingSnapshot ? (
          <Button
            className="min-h-11"
            onClick={() => void recheckSnapshot()}
            disabled={busyAction !== null || isFinalizingSnapshot}
            type="button"
          >
            {isFinalizingSnapshot ? "Checking snapshot..." : "Re-check snapshot"}
          </Button>
        ) : null}
      </div>

      {snapshotRecoveryContext && snapshotAutoRecheckArmed ? (
        <p className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          Snapshot re-check will run automatically in about 15 seconds. Create Asset remains blocked while the server verifies on-chain state.
        </p>
      ) : null}

      {isFinalizingSnapshot ? (
        <p className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          Verifying minted assets on-chain and persisting mint snapshot...
        </p>
      ) : null}

      {snapshotResult ? (
        <div className={`rounded-xl border px-3 py-2 text-xs ${verificationTone}`}>
          <p>Verification: {snapshotResult.verificationStatus}</p>
          <p>Method: {snapshotResult.verificationMethod}</p>
          <p>Found assets: {snapshotResult.foundAssets ?? "n/a"} / {snapshotResult.expectedQuantity}</p>
          <p>Snapshot: {snapshotResult.snapshotId}</p>
          <p>Create Asset gate: {snapshotResult.canCreateAsset ? "enabled" : "blocked"}</p>
          {snapshotResult.verificationError ? (
            <p>{snapshotResult.verificationError.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1 text-xs text-white/70">
        <p>Connected wallet: {publicKey ? truncate(publicKey.toBase58()) : "Not connected"}</p>
        {runState.collectionAddress ? (
          <p>
            Collection:{" "}
            <a className="underline" href={getSolscanAccountUrl(runState.collectionAddress)} rel="noreferrer" target="_blank">
              {truncate(runState.collectionAddress)}
            </a>
          </p>
        ) : null}
        {runState.candyMachineAddress ? (
          <p>
            Candy Machine:{" "}
            <a className="underline" href={getSolscanAccountUrl(runState.candyMachineAddress)} rel="noreferrer" target="_blank">
              {truncate(runState.candyMachineAddress)}
            </a>
          </p>
        ) : null}
      </div>

      {runState.signatures.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Transaction Signatures</p>
          <div className="max-h-72 space-y-1 overflow-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
            {runState.signatures.map((entry) => (
              <div key={entry.signature} className="text-xs text-white/80">
                <p>{entry.label}</p>
                <a className="underline" href={getSolscanTransactionUrl(entry.signature)} rel="noreferrer" target="_blank">
                  {entry.signature}
                </a>
                {entry.expectedAddress ? (
                  <p>
                    Asset:{" "}
                    <a className="underline" href={getSolscanAccountUrl(entry.expectedAddress)} rel="noreferrer" target="_blank">
                      {entry.expectedAddress}
                    </a>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
