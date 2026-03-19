"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSolscanAccountUrl, getSolscanTransactionUrl } from "@/lib/solana";

type PreparedTransaction = {
  kind: "create-collection" | "create-candy-machine" | "add-config-lines" | "mint";
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
  priceLamports: number;
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
  error?: string;
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

type GeneratedMetadataUris = {
  collectionUri: string;
  assetUri: string;
};

const DEFAULT_START_DATE = () => new Date(Date.now() + 60_000).toISOString();
const IMAGE_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
const SUBMIT_TX_TIMEOUT_MS = 120_000;

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

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

function parsePositiveInt(value: string): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
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
  const unsigned = VersionedTransaction.deserialize(fromBase64(transactionBase64));
  const signed = await signTransaction(unsigned);
  return toBase64(signed.serialize());
}

export function CoreCandyMachinePanel({
  prefill,
  snapshotContext,
  onSnapshotFinalized,
  onDeployCompleted
}: CoreCandyMachinePanelProps) {
  const { connected, publicKey, signTransaction } = useWallet();
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
        image: prefill.imageUrl
      })
    });

    const payload = await parseJson<{ collectionUri?: string; assetUri?: string; error?: string }>(response);
    if (!response.ok || !payload.collectionUri || !payload.assetUri) {
      throw new Error(payload.error ?? "Could not generate metadata URIs.");
    }

    return {
      collectionUri: payload.collectionUri.trim(),
      assetUri: payload.assetUri.trim()
    };
  }, [
    form.assetNamePrefix,
    form.collectionName,
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
        collectionUri: generated.collectionUri,
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
  async function submitSignedSingleTransaction(transaction: PreparedTransaction, signedTransactionBase64: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, SUBMIT_TX_TIMEOUT_MS);

    try {
      const response = await fetch("/api/admin/core-candy-machine/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          signedTransactions: [
            {
              kind: transaction.kind,
              serial: transaction.serial,
              expectedAddress: transaction.expectedAddress,
              transactionBase64: signedTransactionBase64
            }
          ]
        })
      });

      const payload = await parseJson<SubmitResponse & ErrorResponse>(response);
      const signature = payload.transactions?.[0]?.signature;

      if (!response.ok || !signature) {
        throw new Error(payload.error ?? `Could not submit transaction ${transaction.label}.`);
      }

      return signature;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`Timed out submitting transaction ${transaction.label}.`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function finalizeSnapshot(
    currentQuantity: number,
    candyMachineAddress: string,
    collectionAddress: string,
    signatures: RunSignatureEntry[]
  ): Promise<void> {
    setIsFinalizingSnapshot(true);

    try {
      const draftId = snapshotContext?.draftId?.trim() || `core-cm-${Date.now()}`;
      const formSnapshot = snapshotContext?.formSnapshot ?? {
        internalCode: prefill?.internalCode ?? "",
        collectionName: form.collectionName,
        assetNamePrefix: form.assetNamePrefix,
        quantity: currentQuantity
      };

      const response = await fetch("/api/admin/core-candy-machine/snapshot/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          formSnapshot,
          mint: {
            quantity: currentQuantity,
            status: "Mint complete.",
            collectionName: form.collectionName,
            collectionUri: form.collectionUri,
            assetNamePrefix: form.assetNamePrefix,
            assetUri: form.assetUri,
            startDate: form.startDate,
            candyMachineAddress,
            collectionAddress,
            signatures
          }
        })
      });

      const payload = await parseJson<SnapshotFinalizeResponse & ErrorResponse>(response);
      if (!response.ok || !payload.snapshotId) {
        throw new Error(payload.error ?? "Could not finalize mint snapshot.");
      }

      setSnapshotResult(payload);
      onSnapshotFinalized?.(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not finalize mint snapshot.";
      setErrorMessage(message);
    } finally {
      setIsFinalizingSnapshot(false);
    }
  }

  async function runDeployFlow(): Promise<void> {
    if (!canRun || !publicKey || !signTransaction) {
      setErrorMessage("Connect Phantom and keep wallet unlocked.");
      return;
    }

    if (!quantity) {
      setErrorMessage("Quantity must be a positive integer.");
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
    setBusyAction("deploy");
    setRunState((current) => ({
      ...current,
      status: "Preparing deploy...",
      deployProgress: { current: 0, total: 0 },
      signatures: []
    }));

    try {
      const prepareResponse = await fetch("/api/admin/core-candy-machine/deploy/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: form.collectionName,
          collectionUri,
          assetNamePrefix: form.assetNamePrefix,
          assetUri,
          quantity,
          startDate: form.startDate
        })
      });
      const prepared = await parseJson<DeployPrepareResponse & ErrorResponse>(prepareResponse);

      if (!prepareResponse.ok || !Array.isArray(prepared.transactions)) {
        throw new Error(prepared.error ?? "Could not prepare deploy transactions.");
      }

      const collectedSignatures: RunSignatureEntry[] = [];

      setRunState((current) => ({
        ...current,
        status: "Deploy prepared. Signing transactions...",
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        deployProgress: { current: 0, total: prepared.transactions.length },
        signatures: []
      }));

      for (const [index, transaction] of prepared.transactions.entries()) {
        const signedBase64 = await signPreparedTransaction(signTransaction, transaction.transactionBase64);
        const signature = await submitSignedSingleTransaction(transaction, signedBase64);
        const entry: RunSignatureEntry = {
          signature,
          kind: transaction.kind,
          label: transaction.label,
          expectedAddress: transaction.expectedAddress
        };
        collectedSignatures.push(entry);

        setRunState((current) => ({
          ...current,
          status: `Deploying (${index + 1}/${prepared.transactions.length})`,
          deployProgress: { current: index + 1, total: prepared.transactions.length },
          signatures: [...collectedSignatures]
        }));
      }

      setRunState((current) => ({
        ...current,
        status: "Deploy complete. Candy Machine ready to mint."
      }));

      onDeployCompleted?.({
        candyMachineAddress: prepared.candyMachineAddress,
        collectionAddress: prepared.collectionAddress,
        quantity,
        signatures: [...collectedSignatures]
      });
    } catch (error) {
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
          Deploy uses guards <code>startDate</code> + <code>solPayment(0.00001 SOL)</code>. Wallet only signs server-built transactions.
        </p>
        <p className="text-xs text-amber-200/90">
          `collectionUri` and `assetUri` must point to JSON metadata, not image URLs.
        </p>
        {isGeneratingUri ? <p className="text-xs text-cyan-200/90">Generating metadata URIs from uploaded image...</p> : null}
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
          <Input value={form.collectionName} onChange={(event) => setForm((current) => ({ ...current, collectionName: event.target.value }))} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Collection URI
          <Input value={form.collectionUri} onChange={(event) => setForm((current) => ({ ...current, collectionUri: event.target.value }))} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Asset name prefix
          <Input value={form.assetNamePrefix} onChange={(event) => setForm((current) => ({ ...current, assetNamePrefix: event.target.value }))} />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          Asset URI
          <Input value={form.assetUri} onChange={(event) => setForm((current) => ({ ...current, assetUri: event.target.value }))} />
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
      </div>

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
