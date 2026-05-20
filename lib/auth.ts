import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { address, getAddressEncoder } from "@solana/kit";
import nacl from "tweetnacl";

import {
  clearFederatedLinkContext,
  clearWalletLinkContext,
  consumeNonce,
  createFederatedLinkContext,
  createWalletLinkContext,
  createSession,
  createNonceToken,
  getNonceMaxAgeSeconds,
  getSessionMaxAgeSeconds,
  getSessionPublicKey,
  hasUsableNonce,
  readFederatedLinkContext,
  readWalletLinkContext,
  readNonceFromToken,
  revokeSession
} from "@/lib/auth-store";
import { parseSiwsMessage } from "@/lib/siws";

const AUTH_COOKIE_NAME = "siws_session";
const NONCE_COOKIE_NAME = "siws_nonce";
const WALLET_LINK_COOKIE_NAME = "wallet_link_context";
const FEDERATED_LINK_COOKIE_NAME = "federated_link_context";
const SIWS_MAX_AGE_MS = 5 * 60 * 1000;
const addressEncoder = getAddressEncoder();

type VerifyPayload = {
  message: string;
  signature: string;
  publicKey: string;
};

type VerifyResult =
  | { ok: true; publicKey: string; sessionToken: string }
  | { ok: false; status: number; error: string };

export function getRequestHost(request: NextRequest): string {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
}

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

export function isIssuedAtValid(issuedAt: string): boolean {
  const timestamp = Date.parse(issuedAt);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Math.abs(Date.now() - timestamp) <= SIWS_MAX_AGE_MS;
}

export function verifySiwsPayload(payload: VerifyPayload, requestHost: string, expectedNonce: string | null): VerifyResult {
  const parsed = parseSiwsMessage(payload.message);

  if (!parsed) {
    return { ok: false, status: 400, error: "Invalid SIWS message format." };
  }

  if (parsed.publicKey !== payload.publicKey) {
    return { ok: false, status: 400, error: "Public key mismatch." };
  }

  if (!expectedNonce || parsed.nonce !== expectedNonce) {
    return { ok: false, status: 409, error: "Invalid or expired nonce." };
  }

  if (!hasUsableNonce(expectedNonce)) {
    return { ok: false, status: 409, error: "Invalid or expired nonce." };
  }

  if (normalizeHost(parsed.domain) !== normalizeHost(requestHost)) {
    return { ok: false, status: 403, error: "Domain does not match request host." };
  }

  if (!isIssuedAtValid(parsed.issuedAt)) {
    return { ok: false, status: 400, error: "Issued-at timestamp is outside allowed window." };
  }

  let signatureBytes: Uint8Array;
  let walletPublicKeyBytes: Uint8Array;
  let normalizedPublicKey: string;

  try {
    signatureBytes = Uint8Array.from(Buffer.from(payload.signature, "base64"));
    const walletAddress = address(payload.publicKey);
    walletPublicKeyBytes = Uint8Array.from(addressEncoder.encode(walletAddress));
    normalizedPublicKey = walletAddress;
  } catch {
    return { ok: false, status: 400, error: "Malformed signature or public key." };
  }

  const messageBytes = new TextEncoder().encode(payload.message);
  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, walletPublicKeyBytes);

  if (!isValid) {
    return { ok: false, status: 401, error: "Signature verification failed." };
  }

  return { ok: true, publicKey: normalizedPublicKey, sessionToken: createSession(normalizedPublicKey) };
}

export function setNonceCookie(response: NextResponse, nonce: string): void {
  response.cookies.set({
    name: NONCE_COOKIE_NAME,
    value: createNonceToken(nonce),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getNonceMaxAgeSeconds()
  });
}

export function clearNonceCookie(response: NextResponse): void {
  response.cookies.set({
    name: NONCE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getNonceFromRequest(request: NextRequest): string | null {
  const nonceToken = request.cookies.get(NONCE_COOKIE_NAME)?.value;
  if (!nonceToken) {
    return null;
  }

  return readNonceFromToken(nonceToken);
}

export function consumeNonceFromRequest(request: NextRequest): boolean {
  const nonce = getNonceFromRequest(request);

  if (!nonce) {
    return false;
  }

  return consumeNonce(nonce);
}

export function setSessionCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionMaxAgeSeconds()
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function setWalletLinkContextCookie(
  response: NextResponse,
  input: {
    accountId: string;
    workosUserId: string;
    workosSessionId?: string | null;
  }
): { nonce: string; expiresAt: number } {
  const context = createWalletLinkContext(input);

  response.cookies.set({
    name: WALLET_LINK_COOKIE_NAME,
    value: context.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getNonceMaxAgeSeconds()
  });

  return {
    nonce: context.nonce,
    expiresAt: context.expiresAt
  };
}

export function clearWalletLinkContextCookie(response: NextResponse, contextId?: string | null): void {
  if (contextId) {
    clearWalletLinkContext(contextId);
  }

  response.cookies.set({
    name: WALLET_LINK_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getWalletLinkContextFromRequest(request: NextRequest) {
  const token = request.cookies.get(WALLET_LINK_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return readWalletLinkContext(token);
}

export function setFederatedLinkContextCookie(
  response: NextResponse,
  input: {
    accountId: string;
    walletPublicKey: string;
  }
): { expiresAt: number } {
  const context = createFederatedLinkContext(input);

  response.cookies.set({
    name: FEDERATED_LINK_COOKIE_NAME,
    value: context.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getNonceMaxAgeSeconds()
  });

  return {
    expiresAt: context.expiresAt
  };
}

export function clearFederatedLinkContextCookie(response: NextResponse, contextId?: string | null): void {
  if (contextId) {
    clearFederatedLinkContext(contextId);
  }

  response.cookies.set({
    name: FEDERATED_LINK_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getFederatedLinkContextFromRequest(request: NextRequest) {
  const token = request.cookies.get(FEDERATED_LINK_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return readFederatedLinkContext(token);
}

export function revokeRequestSession(request: NextRequest): void {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (sessionToken) {
    revokeSession(sessionToken);
  }
}

export async function getAuthenticatedPublicKeyFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getSessionPublicKey(sessionToken);
}

export function getAuthenticatedPublicKeyFromRequest(request: NextRequest): string | null {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getSessionPublicKey(sessionToken);
}
