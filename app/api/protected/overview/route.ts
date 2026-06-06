import { NextRequest, NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";
import { getInvestorOverview } from "@/lib/investor-overview-service";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Account authentication is required."
      }
    },
    { status: 401 }
  );
}

export async function GET(_request?: NextRequest): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();

  if (!auth.accountAuthenticated) {
    return unauthorizedResponse();
  }

  try {
    const overview = await getInvestorOverview({
      walletPublicKey: auth.walletPublicKey,
      accountAuthenticated: auth.accountAuthenticated,
      sessionConflict: auth.sessionConflict
    });

    return NextResponse.json({
      ok: true,
      data: overview
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INVESTOR_OVERVIEW_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Could not load investor overview."
        }
      },
      { status: 500 }
    );
  }
}
