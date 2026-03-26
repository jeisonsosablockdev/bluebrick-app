import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getAmlCaseSnapshotForAdmin } from "@/lib/compliance/profile-repository";

type RouteParams = {
  params: Promise<{
    walletPublicKey: string;
  }>;
};

function isWalletPublicKey(value: string): boolean {
  return /^[A-Za-z0-9]{32,64}$/.test(value);
}

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

  if (!role.authenticated || role.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { walletPublicKey } = await params;
  const normalizedWalletPublicKey = walletPublicKey.trim();

  if (!isWalletPublicKey(normalizedWalletPublicKey)) {
    return errorResponse(400, "INVALID_WALLET_PUBLIC_KEY", "walletPublicKey must be a valid wallet id.");
  }

  try {
    const snapshot = await getAmlCaseSnapshotForAdmin(normalizedWalletPublicKey);

    if (!snapshot) {
      return errorResponse(404, "AML_CASE_NOT_FOUND", "AML case was not found for this wallet.");
    }

    return NextResponse.json({
      ok: true,
      data: snapshot
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load AML case snapshot.";
    return errorResponse(500, "AML_CASE_FETCH_FAILED", message);
  }
}
