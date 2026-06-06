import { NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";
import { getInvestorPortfolio } from "@/lib/investor-portfolio-service";

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

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();

  if (!auth.accountAuthenticated) {
    return unauthorizedResponse();
  }

  try {
    const portfolio = await getInvestorPortfolio({
      walletPublicKey: auth.walletPublicKey,
      accountAuthenticated: auth.accountAuthenticated,
      sessionConflict: auth.sessionConflict
    });

    return NextResponse.json({
      ok: true,
      data: portfolio
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INVESTOR_PORTFOLIO_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Could not load investor portfolio."
        }
      },
      { status: 500 }
    );
  }
}
