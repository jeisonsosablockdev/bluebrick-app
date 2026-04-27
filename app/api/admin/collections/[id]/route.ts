import { NextRequest, NextResponse } from "next/server";

import { getAdminCollectionsE2eFixture } from "@/lib/admin/admin-collections-e2e-fixture";
import { getRequestRole } from "@/lib/auth-session";
import {
  assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError
} from "@/lib/admin/collection-ownership";
import {
  getAdminCollectionContentByEntryId,
  updateAdminCollectionContent
} from "@/lib/admin/collection-content-repository";
import {
  AdminCollectionPatchPayloadError,
  isAdminCollectionPatchPayloadError,
  parseAdminCollectionPatchPayload
} from "@/lib/admin/collection-patch-payload";

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
        data: detail
      });
    }

    const ownership = await assertAdminCollectionOwnership(role.pubkey, collectionId);
    const content = await getAdminCollectionContentByEntryId(ownership.entryId);

    if (!content) {
      return errorResponse(404, "COLLECTION_CONTENT_NOT_FOUND", "Collection content was not found.");
    }

    return NextResponse.json({
      ok: true,
      data: {
        ownership,
        content
      }
    });
  } catch (error) {
    if (isAdminCollectionOwnershipError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not load admin collection detail.";
    return errorResponse(500, "ADMIN_COLLECTION_DETAIL_FAILED", message);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { id } = await params;
  const collectionId = id.trim();

  try {
    const payload = await request
      .json()
      .catch(() => {
        throw new AdminCollectionPatchPayloadError(
          "INVALID_COLLECTION_PAYLOAD",
          "Collection PATCH payload must be valid JSON."
        );
      });
    const update = parseAdminCollectionPatchPayload(payload);
    const ownership = await assertAdminCollectionOwnership(role.pubkey, collectionId);
    const content = await updateAdminCollectionContent({
      entryId: ownership.entryId,
      updatedBy: role.pubkey,
      fractionalInvestmentSummary: update.fractionalInvestmentSummary,
      propertyInformation: update.propertyInformation,
      galleryImages: update.galleryImages,
      propertyImages: update.propertyImages,
      documents: update.documents,
      googleMapsPlace: update.googleMapsPlace
    });

    if (!content) {
      return errorResponse(404, "COLLECTION_CONTENT_NOT_FOUND", "Collection content was not found.");
    }

    return NextResponse.json({
      ok: true,
      data: {
        section: update.section,
        ownership,
        content
      }
    });
  } catch (error) {
    if (isAdminCollectionPatchPayloadError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    if (isAdminCollectionOwnershipError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not update admin collection detail.";
    return errorResponse(500, "ADMIN_COLLECTION_PATCH_FAILED", message);
  }
}
