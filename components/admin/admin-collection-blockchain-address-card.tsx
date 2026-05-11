"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import { getSolscanAccountUrl } from "@/lib/solana";

export function AdminCollectionBlockchainAddressCard({
  label,
  value,
  emptyLabel,
  copyLabel,
  copiedLabel,
  openLabel
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
  copyLabel: string;
  copiedLabel: string;
  openLabel: string;
}): ReactElement {
  const [copied, setCopied] = useState(false);
  const canInteract = Boolean(value);
  const explorerUrl = value ? getSolscanAccountUrl(value) : null;

  async function handleCopy(): Promise<void> {
    if (!value || !navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className="mt-2 break-all font-mono text-xs text-white/85">{value ?? emptyLabel}</p>
      {canInteract ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => void handleCopy()}
            type="button"
          >
            {copied ? copiedLabel : copyLabel}
          </button>
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-400/20"
            href={explorerUrl ?? "#"}
            rel="noreferrer"
            target="_blank"
          >
            {openLabel}
          </a>
        </div>
      ) : null}
    </div>
  );
}
