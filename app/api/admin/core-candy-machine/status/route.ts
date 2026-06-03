import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getWebhookEventsBySignatures } from "@/lib/mint-orchestrator-store";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  createKitRpcConnection,
  getSignatureStatusWithKitRpc
} from "@/lib/solana-kit/compat/web3-transactions";

type StatusRequestBody = {
  signatures?: unknown;
};

type DeploySignatureStatus = {
  confirmed: boolean;
  failed: boolean;
  confirmationStatus: string | null;
  observedByWebhook: boolean;
  source: "rpc" | "webhook";
};

function hasWebhookObservation(value: unknown): boolean {
  return Boolean(value && typeof value === "object");
}

async function resolveStatusesWithRpc(
  statuses: Record<string, unknown | null>,
  signatures: string[]
): Promise<Record<string, unknown | null>> {
  const rpc = createKitRpcConnection(getSolanaRpcUrl());
  const resolvedStatuses: Record<string, DeploySignatureStatus | null> = {};

  await Promise.all(signatures.map(async (signature) => {
    const observedByWebhook = hasWebhookObservation(statuses[signature]);

    try {
      const rpcStatus = await getSignatureStatusWithKitRpc(rpc, signature, {
        searchTransactionHistory: true
      });

      if (!rpcStatus) {
        resolvedStatuses[signature] = observedByWebhook
          ? {
              confirmed: false,
              failed: false,
              confirmationStatus: null,
              observedByWebhook,
              source: "webhook"
            }
          : null;
        return;
      }

      const confirmationStatus = rpcStatus.confirmationStatus ?? null;
      const failed = Boolean(rpcStatus.err);
      const confirmed = !failed && (confirmationStatus === "confirmed" || confirmationStatus === "finalized");
      const normalized: DeploySignatureStatus = {
        confirmed,
        failed,
        confirmationStatus,
        observedByWebhook,
        source: "rpc"
      };

      resolvedStatuses[signature] = normalized;
    } catch {
      resolvedStatuses[signature] = observedByWebhook
        ? {
            confirmed: false,
            failed: false,
            confirmationStatus: null,
            observedByWebhook,
            source: "webhook"
          }
        : null;
    }
  }));

  return resolvedStatuses;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as StatusRequestBody | null;

  if (!body || !Array.isArray(body.signatures)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const signatures = body.signatures.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (signatures.length === 0) {
    return NextResponse.json({ error: "At least one signature is required." }, { status: 400 });
  }

  try {
    const statuses = getWebhookEventsBySignatures("helius", signatures);
    const resolvedStatuses = await resolveStatusesWithRpc(statuses, signatures);
    return NextResponse.json({ statuses: resolvedStatuses });
  } catch {
    return NextResponse.json({ error: "Could not fetch statuses." }, { status: 500 });
  }
}
