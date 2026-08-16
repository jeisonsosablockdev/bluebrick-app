import { normalizeReferralCode, type ReferralAttributionSource } from "@/features/referral-marketing/domain/referrals-domain";

export const REFERRAL_HINT_STORAGE_KEY = "brids_referral_hint";

export type ReferralHintOrigin = "auto" | "manual";

export type StoredReferralHint = {
  referralCode: string;
  origin: ReferralHintOrigin;
  landingPath: string | null;
  capturedAt: string;
};

function safeTrim(input: string): string {
  return input.trim().slice(0, 64);
}

export function normalizeReferralCodeInput(input: string): string {
  if (!input.trim()) {
    return "";
  }

  return safeTrim(normalizeReferralCode(input));
}

export function extractReferralCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const referralCode = parsed.searchParams.get("ref");
    const normalized = referralCode ? normalizeReferralCodeInput(referralCode) : "";
    return normalized || null;
  } catch {
    return null;
  }
}

export function buildStoredReferralHint(input: {
  referralCode: string;
  origin: ReferralHintOrigin;
  landingPath?: string | null;
  capturedAt?: string;
}): StoredReferralHint | null {
  const referralCode = normalizeReferralCodeInput(input.referralCode);
  if (!referralCode) {
    return null;
  }

  return {
    referralCode,
    origin: input.origin,
    landingPath: input.landingPath?.trim() || null,
    capturedAt: input.capturedAt ? new Date(input.capturedAt).toISOString() : new Date().toISOString()
  };
}

export function parseStoredReferralHint(raw: string | null | undefined): StoredReferralHint | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredReferralHint>;
    const referralCode =
      typeof parsed.referralCode === "string" ? normalizeReferralCodeInput(parsed.referralCode) : "";
    const origin = parsed.origin === "manual" ? "manual" : parsed.origin === "auto" ? "auto" : null;
    const capturedAt = typeof parsed.capturedAt === "string" ? new Date(parsed.capturedAt).toISOString() : null;

    if (!referralCode || !origin || !capturedAt) {
      return null;
    }

    return {
      referralCode,
      origin,
      landingPath: typeof parsed.landingPath === "string" && parsed.landingPath.trim() ? parsed.landingPath : null,
      capturedAt
    };
  } catch {
    return null;
  }
}

export function deriveReferralAttributionSource(input: {
  origin: ReferralHintOrigin;
  isMobileWalletFlow: boolean;
}): ReferralAttributionSource {
  if (input.origin === "manual") {
    return "manual";
  }

  return input.isMobileWalletFlow ? "deep_link" : "link";
}

export function buildReferralAuthMetadata(input: {
  landingPath: string | null;
  origin: ReferralHintOrigin;
  source: ReferralAttributionSource;
}): Record<string, unknown> {
  return {
    landingPath: input.landingPath,
    captureOrigin: input.origin,
    inferredSource: input.source
  };
}

export function buildReferralAuthPayload(input: {
  referralCode: string;
  origin: ReferralHintOrigin;
  landingPath: string | null;
  isMobileWalletFlow: boolean;
}): {
  normalizedReferralCode: string;
  referralSource: ReferralAttributionSource | undefined;
  referralMetadata: Record<string, unknown> | undefined;
} {
  const normalizedReferralCode = normalizeReferralCodeInput(input.referralCode);
  if (!normalizedReferralCode) {
    return {
      normalizedReferralCode: "",
      referralSource: undefined,
      referralMetadata: undefined
    };
  }

  const referralSource = deriveReferralAttributionSource({
    origin: input.origin,
    isMobileWalletFlow: input.isMobileWalletFlow
  });

  return {
    normalizedReferralCode,
    referralSource,
    referralMetadata: buildReferralAuthMetadata({
      landingPath: input.landingPath,
      origin: input.origin,
      source: referralSource
    })
  };
}

export function buildPhantomBrowseDeepLink(siteUrl: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(siteUrl)}`;
}

export function readStoredReferralHint(): StoredReferralHint | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseStoredReferralHint(window.localStorage.getItem(REFERRAL_HINT_STORAGE_KEY));
}

export function writeStoredReferralHint(hint: StoredReferralHint): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REFERRAL_HINT_STORAGE_KEY, JSON.stringify(hint));
}

export function clearStoredReferralHint(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(REFERRAL_HINT_STORAGE_KEY);
}
