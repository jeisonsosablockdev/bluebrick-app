import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import {
  getOrCreateProfileBundle,
  ProfileRepositoryError,
  updateProfileBasics
} from "@/features/profile/infrastructure/profile-repository";
import { COUNTRIES } from "@/lib/countries";
import { getOnboardingRewardForWallet } from "@/lib/onboarding-reward-service";

type ProfileRequestBody = {
  username?: unknown;
  bio?: unknown;
  avatarUrl?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  country?: unknown;
  stateProvince?: unknown;
  email?: unknown;
  address?: unknown;
  phone?: unknown;
};

type NormalizedProfileInput = {
  username: string;
  bio: string;
  avatarUrl: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  stateProvince: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
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

async function getOnboardingRewardSafely(walletPublicKey: string) {
  return getOnboardingRewardForWallet(walletPublicKey).catch(() => null);
}

function normalizeProfileInput(raw: unknown): NormalizedProfileInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = raw as ProfileRequestBody;

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";

  const firstName = typeof body.firstName === "string" ? body.firstName.trim().substring(0, 100) : null;
  const lastName = typeof body.lastName === "string" ? body.lastName.trim().substring(0, 100) : null;
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : null;
  const stateProvince = typeof body.stateProvince === "string" ? body.stateProvince.trim().toUpperCase() : null;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const address = typeof body.address === "string" ? body.address.trim().substring(0, 500) : null;
  
  let phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email has an invalid format.");
  }

  if (country && country.length !== 2) {
    throw new Error("Invalid country format. Expected a 2-letter ISO code.");
  }

  if (stateProvince) {
    if (stateProvince.length > 100) {
      throw new Error("Invalid state/province. Maximum 100 characters allowed.");
    }
    if (country) {
      const matchedCountry = COUNTRIES.find((c) => c.code === country);
      if (matchedCountry && matchedCountry.divisions) {
        const matchedDiv = matchedCountry.divisions.find((d) => d.code === stateProvince);
        if (!matchedDiv) {
          throw new Error(`Invalid state/province for ${country}. Please select a valid option.`);
        }
      }
    }
  }

  if (phone) {
    phone = phone.replace(/[\s\-\(\)\.]/g, "");
    if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
      throw new Error("Invalid phone format. Ensure you include the country code and valid digits.");
    }
  }

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
    avatarUrl,
    firstName: firstName || null,
    lastName: lastName || null,
    country: country || null,
    stateProvince: stateProvince || null,
    email: email || null,
    address: address || null,
    phone: phone || null
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  try {
    const [profile, onboardingReward] = await Promise.all([
      getOrCreateProfileBundle(walletPublicKey),
      getOnboardingRewardSafely(walletPublicKey)
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        ...profile,
        onboardingReward
      }
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
      avatarUrl: normalizedInput.avatarUrl,
      firstName: normalizedInput.firstName,
      lastName: normalizedInput.lastName,
      country: normalizedInput.country,
      stateProvince: normalizedInput.stateProvince,
      email: normalizedInput.email,
      address: normalizedInput.address,
      phone: normalizedInput.phone
    });

    const onboardingReward = await getOnboardingRewardSafely(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: {
        ...updated,
        onboardingReward
      }
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
