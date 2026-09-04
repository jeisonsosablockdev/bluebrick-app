/**
 * ============================================================================
 * @file apps/web/src/app/api/cron/sync-dashboard/route.ts
 * @description Layer 1: Presentation - Vercel Cron Job Route Handler for Dashboard Sync
 * ============================================================================
 * Purpose: Provides a secure HTTP GET endpoint invoked by Vercel Cron on schedule
 * (0 *\/2 * * *) to trigger the automated Excel dashboard synchronization pipeline.
 *
 * Invariants:
 *  - Layer 1 boundary: Strictly isolates HTTP protocol concerns from business logic.
 *  - Zero direct database access: Must NEVER import 'pg' or database drivers directly.
 *  - Consumes exclusively Layer 2 Application Service (DashboardSyncService) via @/features/ai-ingestion.
 *  - Secures endpoint using constant-time Bearer token verification against CRON_SECRET.
 *  - Configured with maxDuration = 60s and dynamic = 'force-dynamic' for Vercel Serverless.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-018-CRON-ROUTE
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  verifyCronAuthorization,
  DashboardSyncService,
  GoogleServiceAccountAdapter,
  StreamingSpreadsheetAdapter,
} from "@/features/ai-ingestion";
import { getDatabasePool } from "@/lib/infrastructure/db/neon-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Handles incoming cron trigger GET requests from Vercel Cron.
 *
 * @param request - NextRequest containing HTTP headers (specifically Authorization Bearer token)
 * @returns NextResponse with synchronization metrics DTO or error payload
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Step 1: Extract and verify Bearer token against CRON_SECRET in constant time
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  const isAuthorized = verifyCronAuthorization(authHeader, expectedSecret);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing authorization credentials" },
      { status: 401 }
    );
  }

  // Step 2: Initialize dependencies and execute dashboard synchronization service
  try {
    const authProvider = new GoogleServiceAccountAdapter({
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });
    const spreadsheetParser = new StreamingSpreadsheetAdapter();
    const dbPool = getDatabasePool();

    const syncService = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
    });

    const result = await syncService.executeSync();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected synchronization error";
    return NextResponse.json(
      {
        error: "Internal Server Error: Dashboard synchronization failed",
        message,
      },
      { status: 500 }
    );
  }
}

