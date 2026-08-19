/**
 * SPEC-S02-C (EPIC-014): Archival RPC Health Check Endpoint
 *
 * GET /api/admin/archival/health
 *
 * Returns health status for all configured archival RPC providers
 * (Helius Archive + Alchemy Archive). Updates cached min_ledger_slot
 * in the database after each check.
 *
 * Admin-only route. Requires admin session.
 */

import { type NextRequest, NextResponse } from "next/server";

import { createArchivalRpcClient } from "@/lib/archival/archival-rpc-client";
import {
  listActiveArchivalEndpoints,
  updateArchivalEndpointHealth
} from "@/lib/archival/archival-rpc-endpoint-repository";
import { getRequestRole } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = createArchivalRpcClient();
    const results = await client.healthCheck();

    // Update cached health fields in DB for each endpoint
    const endpoints = await listActiveArchivalEndpoints();

    await Promise.allSettled(
      results.map(async (result) => {
        const endpoint = endpoints.find((e) => e.name === result.name);
        if (!endpoint) return;

        await updateArchivalEndpointHealth({
          name: result.name,
          minLedgerSlot: result.minLedgerSlot,
          lastCheckedAt: new Date(result.checkedAt)
        });
      })
    );

    const overallHealthy = results.every((r) => r.healthy);

    return NextResponse.json(
      {
        healthy: overallHealthy,
        checkedAt: new Date().toISOString(),
        providers: results.map((r) => ({
          name: r.name,
          healthy: r.healthy,
          minLedgerSlot: r.minLedgerSlot,
          currentSlot: r.currentSlot,
          checkedAt: r.checkedAt,
          errorMessage: r.errorMessage
        })),
        dualProviderGapRisk: results.every((r) => !r.healthy)
          ? "Both providers unhealthy — distribution runs would be BLOCKED with dual_provider_gap."
          : null
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error during health check.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
