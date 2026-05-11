import { NextRequest, NextResponse } from "next/server";

import { getAdminCollectionsHealthE2eFixture } from "@/lib/admin/admin-collections-e2e-fixture";
import { listAdminCollectionHealthRows } from "@/lib/admin/collection-health-read-model";
import { getRequestRole } from "@/lib/auth-session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Admin role is required."
        }
      },
      { status: 403 }
    );
  }

  try {
    const fixture = getAdminCollectionsHealthE2eFixture(request);
    if (fixture) {
      return NextResponse.json({
        ok: true,
        data: fixture
      });
    }

    const rows = await listAdminCollectionHealthRows(role.pubkey);

    return NextResponse.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load admin collections health.";

    return NextResponse.json(
      {
        error: {
          code: "ADMIN_COLLECTIONS_HEALTH_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
