import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import {
  getOrCreateProfileBundle,
  ProfileRepositoryError,
  updateProfileBasics
} from "@/lib/compliance/profile-repository";

type ProfileRequestBody = {
  username?: unknown;
  bio?: unknown;
  avatarUrl?: unknown;
};

type NormalizedProfileInput = {
  username: string;
  bio: string;
  avatarUrl: string;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

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

function invalidPayloadResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_PROFILE_PAYLOAD",
        message
      }
    },
    { status: 400 }
  );
}

function normalizeProfileInput(raw: unknown): NormalizedProfileInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = raw as ProfileRequestBody;

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("username must be 3-32 characters and use only letters, numbers, _, -, or .");
  }

  if (bio.length > 280) {
    throw new Error("bio exceeds maximum length of 280 characters.");
  }

  if (avatarUrl.length > 1024) {
    throw new Error("avatarUrl exceeds maximum length of 1024 characters.");
  }

  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    throw new Error("avatarUrl must be an absolute http(s) URL.");
  }

  return {
    username,
    bio,
    avatarUrl
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  try {
    const profile = await getOrCreateProfileBundle(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: profile
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load profile.";

    return NextResponse.json(
      {
        error: {
          code: "PROFILE_FETCH_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  let normalizedInput: NormalizedProfileInput;

  try {
    const body = await request.json().catch(() => null);
    normalizedInput = normalizeProfileInput(body);
  } catch (error) {
    return invalidPayloadResponse(error instanceof Error ? error.message : "Invalid payload.");
  }

  try {
    const updated = await updateProfileBasics({
      walletPublicKey,
      username: normalizedInput.username,
      bio: normalizedInput.bio,
      avatarUrl: normalizedInput.avatarUrl
    });

    return NextResponse.json({
      ok: true,
      data: updated
    });
  } catch (error) {
    if (error instanceof ProfileRepositoryError && error.code === "USERNAME_TAKEN") {
      return NextResponse.json(
        {
          error: {
            code: "USERNAME_TAKEN",
            message: error.message
          }
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Could not update profile.";

    return NextResponse.json(
      {
        error: {
          code: "PROFILE_UPDATE_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
