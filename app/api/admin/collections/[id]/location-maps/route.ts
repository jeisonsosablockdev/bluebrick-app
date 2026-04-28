import { NextRequest, NextResponse } from "next/server";

import { getAdminCollectionsE2eFixture } from "@/lib/admin/admin-collections-e2e-fixture";
import { buildAdminCollectionLocationMapsSection } from "@/lib/admin/admin-collection-location-contract";
import {
  assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError
} from "@/lib/admin/collection-ownership";
import { getAdminCollectionContentByEntryId } from "@/lib/admin/collection-content-repository";
import { getRequestRole } from "@/lib/auth-session";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
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

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { id } = await params;
  const collectionId = id.trim();

  try {
    const fixture = getAdminCollectionsE2eFixture(request);
    if (fixture) {
      const detail = fixture.detailsByEntryId[collectionId] ?? null;
      if (!detail) {
        return errorResponse(404, "COLLECTION_NOT_FOUND", "Collection was not found.");
      }

      return NextResponse.json({
        ok: true,
        data: buildAdminCollectionLocationMapsSection(detail.content)
      });
    }

    const ownership = await assertAdminCollectionOwnership(role.pubkey, collectionId);
    const content = await getAdminCollectionContentByEntryId(ownership.entryId);

    if (!content) {
      return errorResponse(404, "COLLECTION_CONTENT_NOT_FOUND", "Collection content was not found.");
    }

    return NextResponse.json({
      ok: true,
      data: buildAdminCollectionLocationMapsSection(content)
    });
  } catch (error) {
    if (isAdminCollectionOwnershipError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not load admin collection location contract.";
    return errorResponse(500, "ADMIN_COLLECTION_LOCATION_MAPS_FAILED", message);
  }
}
