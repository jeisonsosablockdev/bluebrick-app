import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { address, getAddressEncoder } from "@solana/kit";
import nacl from "tweetnacl";

import { consumeNonce, createSession, getSessionMaxAgeSeconds, getSessionPublicKey, hasUsableNonce, revokeSession } from "@/lib/auth-store";
import { parseSiwsMessage } from "@/lib/siws";

const AUTH_COOKIE_NAME = "siws_session";
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

export function verifySiwsPayload(payload: VerifyPayload, requestHost: string): VerifyResult {
  const parsed = parseSiwsMessage(payload.message);

  if (!parsed) {
    return { ok: false, status: 400, error: "Invalid SIWS message format." };
  }

  if (parsed.publicKey !== payload.publicKey) {
    return { ok: false, status: 400, error: "Public key mismatch." };
  }

  if (!hasUsableNonce(parsed.nonce)) {
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

  if (!consumeNonce(parsed.nonce)) {
    return { ok: false, status: 409, error: "Nonce already consumed." };
  }

  return { ok: true, publicKey: normalizedPublicKey, sessionToken: createSession(normalizedPublicKey) };
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
