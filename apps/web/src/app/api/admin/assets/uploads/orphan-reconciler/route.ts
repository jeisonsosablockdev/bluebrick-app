import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { parseReconcileInput, reconcileOrphanedUploads } from "@/lib/asset-uploads/orphan-reconciler";

type ReconcileErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_RECONCILE_REQUEST" | "RECONCILE_FAILED";

function errorResponse(status: number, code: ReconcileErrorCode, message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const body = await request.json().catch(() => ({}));
    const input = parseReconcileInput(body);
    const result = await reconcileOrphanedUploads(input);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reconcile orphan uploads.";
    return errorResponse(500, "RECONCILE_FAILED", message);
  }
}
