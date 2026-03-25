import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { markKycSessionPending } from "@/lib/compliance/profile-repository";
import {
  consumeStripeSessionRateLimit,
  createStripeIdentityVerificationSession,
  StripeIdentityError
} from "@/lib/kyc/stripe-identity";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Wallet authentication is required."
      }
    },
    { status: 401 }
  );
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();

  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();

  if (!host) {
    return "http://localhost:3000";
  }

  return `${forwardedProto}://${host}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  const clientIp = getClientIp(request);
  const rateLimit = consumeStripeSessionRateLimit({
    walletPublicKey,
    clientIp
  });

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many verification session requests. Please retry later."
        }
      },
      { status: 429 }
    );
    response.headers.set("retry-after", String(rateLimit.retryAfterSeconds));
    return response;
  }

  try {
    const origin = getRequestOrigin(request);
    const session = await createStripeIdentityVerificationSession({
      walletPublicKey,
      returnUrl: `${origin}/protected/perfil`
    });

    await markKycSessionPending({
      walletPublicKey,
      provider: "stripe_identity",
      providerSessionId: session.id
    });

    return NextResponse.json({
      ok: true,
      data: {
        sessionId: session.id,
        url: session.url,
        status: session.status
      }
    });
  } catch (error) {
    if (error instanceof StripeIdentityError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message
          }
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Could not create Stripe Identity session.";

    return NextResponse.json(
      {
        error: {
          code: "KYC_SESSION_CREATION_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
