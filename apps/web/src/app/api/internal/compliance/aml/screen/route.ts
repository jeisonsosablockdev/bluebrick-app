import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { runWalletAmlScreening } from "@/features/profile/application/aml-screening-service";

type AmlScreenRequestBody = {
  walletPublicKey?: unknown;
  reason?: unknown;
};

type AuthorizationMode = "admin_session" | "internal_token";

function isWalletPublicKey(value: string): boolean {
  return /^[A-Za-z0-9]{32,64}$/.test(value);
}

function parseInternalToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

function resolveAuthorizationMode(request: NextRequest): AuthorizationMode | null {
  const role = getRequestRole(request);
  if (role.authenticated && role.role === "admin") {
    return "admin_session";
  }

  const expectedToken = process.env.COMPLIANCE_INTERNAL_TOKEN?.trim();
  const providedToken = parseInternalToken(request);

  if (expectedToken && providedToken && expectedToken === providedToken) {
    return "internal_token";
  }

  return null;
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "FORBIDDEN",
        message: "Admin session or valid internal token is required."
      }
    },
    { status: 403 }
  );
}

function invalidPayloadResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_PAYLOAD",
        message
      }
    },
    { status: 400 }
  );
}

function normalizePayload(payload: unknown): { walletPublicKey: string; reason: string } {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = payload as AmlScreenRequestBody;
  const walletPublicKey = typeof body.walletPublicKey === "string" ? body.walletPublicKey.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "manual_recheck";

  if (!isWalletPublicKey(walletPublicKey)) {
    throw new Error("walletPublicKey must be a valid wallet id.");
  }

  if (reason.length === 0 || reason.length > 120) {
    throw new Error("reason must be 1-120 characters.");
  }

  return {
    walletPublicKey,
    reason
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authorizationMode = resolveAuthorizationMode(request);
  if (!authorizationMode) {
    return forbiddenResponse();
  }

  let normalized: { walletPublicKey: string; reason: string };

  try {
    const body = await request.json().catch(() => null);
    normalized = normalizePayload(body);
  } catch (error) {
    return invalidPayloadResponse(error instanceof Error ? error.message : "Invalid payload.");
  }

  try {
    const actorType = authorizationMode === "admin_session" ? "admin" : "system";
    const actorId = authorizationMode === "admin_session" ? "admin_session" : "internal_token";

    const result = await runWalletAmlScreening({
      walletPublicKey: normalized.walletPublicKey,
      trigger: normalized.reason,
      actorType,
      actorId
    });

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not execute AML screening.";
    return NextResponse.json(
      {
        error: {
          code: "AML_SCREENING_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
