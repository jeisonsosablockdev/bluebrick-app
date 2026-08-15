"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { METAPLEX_CORE_PROGRAM_ID, getSolscanAccountUrl, getSolscanTransactionUrl } from "@/lib/infrastructure/solana";
import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";

type PreparedTransaction = {
  kind: "collection" | "asset";
  label: string;
  serial: number | null;
  expectedAddress: string;
  transactionBase64: string;
};

type PreparedBatchResponse = {
  network: "devnet";
  payerPublicKey: string;
  collectionAddress: string;
  preparedAt: string;
  transactions: PreparedTransaction[];
};

type SubmitResponse = {
  transactions: Array<{
    kind: "collection" | "asset";
    serial: number | null;
    expectedAddress: string;
    signature: string;
  }>;
};
type SubmittedTransaction = SubmitResponse["transactions"][number];

type ErrorResponse = {
  error?: string;
};

type MintFormState = {
  collectionName: string;
  collectionUri: string;
  assetNamePrefix: string;
  assetUri: string;
  totalItems: string;
  startSerial: string;
};

type MintRunState = {
  status: string;
  total: number;
  completed: number;
  collectionAddress: string | null;
  submittedTransactions: SubmittedTransaction[];
};

const DEFAULT_FORM: MintFormState = {
  collectionName: "Andruia Property Collection",
  collectionUri: "https://example.com/collection.json",
  assetNamePrefix: "Property Fraction",
  assetUri: "https://example.com/fraction.json",
  totalItems: "1",
  startSerial: "1"
};

function truncateHash(value: string): string {
  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

function getSubmittedLabel(transaction: SubmittedTransaction): string {
  if (transaction.kind === "collection") {
    return "Collection";
  }

  if (transaction.serial !== null) {
    return `NFT #${transaction.serial}`;
  }

  return "NFT";
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(base64Value: string): Uint8Array {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

export function MetaplexCoreMintPanel() {
  const { connected, publicKey, signTransaction } = useWallet();
  const [formState, setFormState] = useState<MintFormState>(DEFAULT_FORM);
  const [runState, setRunState] = useState<MintRunState>({
    status: "Idle",
    total: 0,
    completed: 0,
    collectionAddress: null,
    submittedTransactions: []
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const progressPercentage = useMemo(() => {
    if (runState.total === 0) {
      return 0;
    }

    return Math.round((runState.completed / runState.total) * 100);
  }, [runState.completed, runState.total]);

  function updateField<Key extends keyof MintFormState>(field: Key, value: MintFormState[Key]): void {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function runMintFlow(): Promise<void> {
    if (!connected || !publicKey || !signTransaction) {
      setErrorMessage("Connect Phantom and keep it unlocked before starting.");
      return;
    }

    setErrorMessage(null);
    setIsRunning(true);
    setRunState({
      status: "Preparing batch...",
      total: 0,
      completed: 0,
      collectionAddress: null,
      submittedTransactions: []
    });

    try {
      const prepareResponse = await fetch("/api/admin/metaplex-core/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: formState.collectionName,
          collectionUri: formState.collectionUri,
          assetNamePrefix: formState.assetNamePrefix,
          assetUri: formState.assetUri,
          totalItems: Number(formState.totalItems),
          startSerial: Number(formState.startSerial)
        })
      });
      const preparedBatch = await readJsonResponse<PreparedBatchResponse & ErrorResponse>(prepareResponse);

      if (!prepareResponse.ok) {
        throw new Error(preparedBatch?.error ?? "Could not prepare mint batch.");
      }

      if (!preparedBatch || !Array.isArray(preparedBatch.transactions) || typeof preparedBatch.payerPublicKey !== "string") {
        throw new Error("Prepare endpoint returned an invalid payload.");
      }

      if (preparedBatch.payerPublicKey !== publicKey.toBase58()) {
        throw new Error("Connected wallet does not match authenticated admin session.");
      }

      const submittedTransactions: SubmittedTransaction[] = [];

      setRunState({
        status: "Batch prepared. Waiting for signature...",
        total: preparedBatch.transactions.length,
        completed: 0,
        collectionAddress: preparedBatch.collectionAddress,
        submittedTransactions
      });

      for (const [index, transactionItem] of preparedBatch.transactions.entries()) {
        setRunState((current) => ({
          ...current,
          status: `Signing ${transactionItem.label} (${index + 1}/${preparedBatch.transactions.length})`
        }));

        const unsignedTransaction = deserializeLegacyVersionedTransaction(fromBase64(transactionItem.transactionBase64));
        const signedTransaction = await signTransaction(unsignedTransaction);
        const signedTransactionBase64 = toBase64(serializeLegacyVersionedTransaction(signedTransaction));

        setRunState((current) => ({
          ...current,
          status: `Submitting ${transactionItem.label} (${index + 1}/${preparedBatch.transactions.length})`
        }));

        const submitResponse = await fetch("/api/admin/metaplex-core/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransactions: [
              {
                kind: transactionItem.kind,
                serial: transactionItem.serial,
                expectedAddress: transactionItem.expectedAddress,
                transactionBase64: signedTransactionBase64
              }
            ]
          })
        });
        const submitPayload = await readJsonResponse<SubmitResponse & ErrorResponse>(submitResponse);

        if (!submitResponse.ok || !submitPayload.transactions?.[0]?.signature) {
          throw new Error(submitPayload?.error ?? `Could not submit ${transactionItem.label}.`);
        }

        submittedTransactions.push(submitPayload.transactions[0]);
        setRunState((current) => ({
          ...current,
          completed: current.completed + 1,
          submittedTransactions: [...submittedTransactions]
        }));
      }

      setRunState((current) => ({
        ...current,
        status: "Mint batch completed."
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Minting failed unexpectedly.";
      setErrorMessage(message);
      setRunState((current) => ({
        ...current,
        status: "Failed"
      }));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">Metaplex Core Batch Mint</h2>
        <p className="text-sm text-white/70">
          The backend builds transactions. This UI only signs with Phantom and shows progress.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm text-white/80">
          Collection name
          <Input
            value={formState.collectionName}
            onChange={(event) => updateField("collectionName", event.target.value)}
            placeholder="Collection name"
          />
        </label>
        <label className="space-y-2 text-sm text-white/80">
          Collection URI
          <Input
            value={formState.collectionUri}
            onChange={(event) => updateField("collectionUri", event.target.value)}
            placeholder="https://... or ipfs://..."
          />
        </label>
        <label className="space-y-2 text-sm text-white/80">
          Asset name prefix
          <Input
            value={formState.assetNamePrefix}
            onChange={(event) => updateField("assetNamePrefix", event.target.value)}
            placeholder="Property Fraction"
          />
        </label>
        <label className="space-y-2 text-sm text-white/80">
          Asset URI
          <Input
            value={formState.assetUri}
            onChange={(event) => updateField("assetUri", event.target.value)}
            placeholder="https://... or ipfs://..."
          />
        </label>
        <label className="space-y-2 text-sm text-white/80">
          Total items (max 25)
          <Input
            type="number"
            min={1}
            max={25}
            value={formState.totalItems}
            onChange={(event) => updateField("totalItems", event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-white/80">
          Start serial
          <Input type="number" min={1} value={formState.startSerial} onChange={(event) => updateField("startSerial", event.target.value)} />
        </label>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-sm text-white/80">Status: {runState.status}</p>
        <p className="text-sm text-white/80">
          Progress: {runState.completed}/{runState.total} ({progressPercentage}%)
        </p>
        <p className="text-xs text-white/60">
          Program:{" "}
          <a
            href={getSolscanAccountUrl(METAPLEX_CORE_PROGRAM_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-cyan-300/60 underline-offset-2 hover:text-cyan-200"
          >
            Metaplex Core ({truncateHash(METAPLEX_CORE_PROGRAM_ID)})
          </a>
        </p>
        {runState.collectionAddress ? (
          <p className="text-xs text-white/60">
            Collection:{" "}
            <a
              href={getSolscanAccountUrl(runState.collectionAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-cyan-300/60 underline-offset-2 hover:text-cyan-200"
            >
              {truncateHash(runState.collectionAddress)}
            </a>
          </p>
        ) : null}
        {runState.submittedTransactions.length > 0 ? (
          <ul className="space-y-1 text-xs text-cyan-200/90">
            {runState.submittedTransactions.map((transaction) => (
              <li key={transaction.signature} className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/40 px-2 py-0.5 text-[11px] text-cyan-100">
                  {getSubmittedLabel(transaction)}
                </span>
                <a
                  href={getSolscanAccountUrl(transaction.expectedAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline decoration-cyan-300/70 underline-offset-2 hover:text-cyan-100"
                >
                  {truncateHash(transaction.expectedAddress)}
                </a>
                <a
                  href={getSolscanTransactionUrl(transaction.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline decoration-cyan-300/70 underline-offset-2 hover:text-cyan-100"
                >
                  tx: {truncateHash(transaction.signature)}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {errorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-200">{errorMessage}</p> : null}

      <Button
        className="min-h-11 w-full md:w-auto"
        onClick={() => {
          void runMintFlow();
        }}
        disabled={isRunning}
      >
        {isRunning ? "Minting..." : "Prepare, Sign and Mint"}
      </Button>
    </Card>
  );
}
