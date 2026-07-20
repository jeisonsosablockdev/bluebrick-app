/**
 * SPEC-S02-B (EPIC-014): Admin Provenance Backfill API Endpoint
 *
 * POST /api/admin/provenance/backfill
 * Body: { projectId: string }
 *
 * Triggers mint provenance backfill for a project.
 * Scans assets, validates archival RPC transaction history, and populates asset_project_origins.
 *
 * Admin-only route.
 */

import { type NextRequest, NextResponse } from "next/server";

import { runProvenanceBackfill } from "@/lib/provenance/provenance-backfill";
import { getRequestRole } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { projectId?: string };
    const projectId = body.projectId?.trim();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required in request body." },
        { status: 400 }
      );
    }

    const result = await runProvenanceBackfill(projectId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error during provenance backfill.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
