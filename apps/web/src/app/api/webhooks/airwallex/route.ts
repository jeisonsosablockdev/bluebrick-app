import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { reconcileAirwallexPaymentIntent } from "@/lib/checkout-service";

function getWebhookSecret(): string {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("AIRWALLEX_WEBHOOK_SECRET is required.");
  }

  return secret;
}

function buildExpectedSignature(timestamp: string, rawBody: string, secret: string): string {
  const valueToDigest = `${timestamp}${rawBody}`;
  return createHmac("sha256", secret).update(valueToDigest).digest("hex");
}

function safeCompareHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function isTimestampWithinToleranceMs(timestampMs: number, toleranceMs = 5 * 60 * 1_000): boolean {
  const now = Date.now();
  return Math.abs(now - timestampMs) <= toleranceMs;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timestamp = request.headers.get("x-timestamp")?.trim() ?? "";
  const signature = request.headers.get("x-signature")?.trim() ?? "";

  if (!timestamp || !signature) {
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Missing signature headers." } }, { status: 400 });
  }

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || !isTimestampWithinToleranceMs(timestampMs)) {
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Invalid or stale x-timestamp." } }, { status: 400 });
  }

  const rawBody = await request.text();

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch {
    return NextResponse.json({ error: { code: "WEBHOOK_CONFIG_ERROR", message: "Webhook secret is not configured." } }, { status: 500 });
  }

  const expectedSignature = buildExpectedSignature(timestamp, rawBody, secret);
  if (!safeCompareHex(signature, expectedSignature)) {
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Webhook signature mismatch." } }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_BODY", message: "Webhook body is not valid JSON." } }, { status: 400 });
  }

  const event = payload as { id?: unknown; name?: unknown };
  const providerEventId = typeof event.id === "string" ? event.id.trim() : "";
  const eventName = typeof event.name === "string" ? event.name.trim() : "";

  if (!providerEventId || !eventName) {
    return NextResponse.json({ error: { code: "INVALID_BODY", message: "Event id and name are required." } }, { status: 400 });
  }

  try {
    const result = await reconcileAirwallexPaymentIntent({
      providerEventId,
      eventName,
      payload
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: { code: "PROCESSING_FAILED", message } }, { status: 500 });
  }
}
