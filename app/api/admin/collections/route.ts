import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { listAdminCollectionReadModels } from "@/lib/admin/collections-read-model";

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
    const collections = await listAdminCollectionReadModels(role.pubkey);

    return NextResponse.json({
      ok: true,
      data: collections
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load admin collections.";

    return NextResponse.json(
      {
        error: {
          code: "ADMIN_COLLECTIONS_LIST_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
