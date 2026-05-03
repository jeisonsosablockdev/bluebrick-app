import crypto from "node:crypto";

import {
  findWalletByKycProviderSessionId,
  recordComplianceAuditEvent,
  registerKycWebhookEvent,
  updateKycStatusFromProvider
} from "@/lib/compliance/profile-repository";
import { runWalletAmlScreening } from "@/lib/compliance/aml-screening-service";
import { type KycStatus } from "@/lib/compliance/compliance-status-projector";
import { markReferralAttributionKycApproved } from "@/lib/referrals/repository";
import { promotePendingQualificationRewardsForInvitee } from "@/lib/referrals/reward-engine";

export class InvalidStripeWebhookSignatureError extends Error {}
export class InvalidStripeWebhookPayloadError extends Error {}

type StripeVerificationSessionObject = {
  id: string;
  metadata?: {
    wallet_public_key?: string;
  };
  last_verification_report?: string;
  last_error?: {
    code?: string;
  };
};

export type StripeIdentityEvent = {
  id: string;
  type: string;
  data: {
    object: StripeVerificationSessionObject;
  };
};

export type VerifyAndParseStripeIdentityEventInput = {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
};

export type ProcessStripeIdentityWebhookResult = {
  duplicate: boolean;
  processed: boolean;
  eventId: string;
  walletPublicKey: string | null;
  kycStatus: KycStatus | null;
};

function getWebhookToleranceSeconds(): number {
  const raw = Number(process.env.STRIPE_IDENTITY_WEBHOOK_TOLERANCE_SECONDS);

  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw <= 0) {
    return 300;
  }

  return raw;
}

function parseStripeSignatureHeader(signatureHeader: string): {
  timestamp: number;
  signatures: string[];
} {
  const entries = signatureHeader
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const entry of entries) {
    const [key, ...rest] = entry.split("=");
    const value = rest.join("=");

    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      const parsedTimestamp = Number(value);
      if (Number.isFinite(parsedTimestamp)) {
        timestamp = parsedTimestamp;
      }
      continue;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    throw new InvalidStripeWebhookSignatureError("Invalid Stripe webhook signature.");
  }

  return { timestamp, signatures };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

function verifyStripeWebhookSignature(input: VerifyAndParseStripeIdentityEventInput): void {
  const parsedHeader = parseStripeSignatureHeader(input.signatureHeader);
  const now = Math.floor(Date.now() / 1000);
  const tolerance = getWebhookToleranceSeconds();

  if (Math.abs(now - parsedHeader.timestamp) > tolerance) {
    throw new InvalidStripeWebhookSignatureError("Invalid Stripe webhook signature.");
  }

  const signedPayload = `${parsedHeader.timestamp}.${input.rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", input.webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const hasMatch = parsedHeader.signatures.some((signature) => timingSafeEqualHex(signature, expectedSignature));

  if (!hasMatch) {
    throw new InvalidStripeWebhookSignatureError("Invalid Stripe webhook signature.");
  }
}

function parseStripeIdentityEvent(rawBody: string): StripeIdentityEvent {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new InvalidStripeWebhookPayloadError("Stripe webhook payload is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new InvalidStripeWebhookPayloadError("Stripe webhook payload must be an object.");
  }

  const event = parsed as Partial<StripeIdentityEvent>;
  const object = event.data?.object;

  if (
    typeof event.id !== "string" ||
    typeof event.type !== "string" ||
    !object ||
    typeof object !== "object" ||
    typeof object.id !== "string"
  ) {
    throw new InvalidStripeWebhookPayloadError("Stripe webhook payload is missing required event fields.");
  }

  return {
    id: event.id,
    type: event.type,
    data: {
      object: {
        id: object.id,
        metadata: {
          wallet_public_key: object.metadata?.wallet_public_key
        },
        last_verification_report: object.last_verification_report,
        last_error: {
          code: object.last_error?.code
        }
      }
    }
  };
}

export function verifyAndParseStripeIdentityEvent(
  input: VerifyAndParseStripeIdentityEventInput
): StripeIdentityEvent {
  verifyStripeWebhookSignature(input);
  return parseStripeIdentityEvent(input.rawBody);
}

export function mapStripeIdentityEventType(eventType: string): KycStatus | null {
  if (eventType === "identity.verification_session.processing") {
    return "pending";
  }

  if (eventType === "identity.verification_session.verified") {
    return "verified";
  }

  if (
    eventType === "identity.verification_session.requires_input" ||
    eventType === "identity.verification_session.canceled"
  ) {
    return "rejected";
  }

  return null;
}

function resolveRejectionReasonCode(event: StripeIdentityEvent): string | null {
  return event.data.object.last_error?.code || event.type || null;
}

export async function processStripeIdentityWebhook(
  input: VerifyAndParseStripeIdentityEventInput
): Promise<ProcessStripeIdentityWebhookResult> {
  const event = verifyAndParseStripeIdentityEvent(input);
  const sessionId = event.data.object.id;
  const mappedStatus = mapStripeIdentityEventType(event.type);
  const metadataWallet = event.data.object.metadata?.wallet_public_key?.trim() || null;
  const walletPublicKey = metadataWallet || (await findWalletByKycProviderSessionId(sessionId));

  const inserted = await registerKycWebhookEvent({
    providerEventId: event.id,
    provider: "stripe_identity",
    eventType: event.type,
    walletPublicKey,
    providerSessionId: sessionId,
    status: mappedStatus ? "processed" : "ignored"
  });

  if (!inserted) {
    if (walletPublicKey) {
      await recordComplianceAuditEvent({
        walletPublicKey,
        actorType: "provider",
        actorId: "stripe_identity",
        eventName: "kyc.webhook_replayed",
        eventPayload: {
          eventId: event.id,
          eventType: event.type,
          providerSessionId: sessionId
        }
      });
    }

    return {
      duplicate: true,
      processed: false,
      eventId: event.id,
      walletPublicKey,
      kycStatus: mappedStatus
    };
  }

  if (walletPublicKey) {
    await recordComplianceAuditEvent({
      walletPublicKey,
      actorType: "provider",
      actorId: "stripe_identity",
      eventName: "kyc.webhook_received",
      eventPayload: {
        eventId: event.id,
        eventType: event.type,
        providerSessionId: sessionId
      }
    });
  }

  if (!walletPublicKey || !mappedStatus) {
    return {
      duplicate: false,
      processed: false,
      eventId: event.id,
      walletPublicKey,
      kycStatus: mappedStatus
    };
  }

  await updateKycStatusFromProvider({
    walletPublicKey,
    provider: "stripe_identity",
    providerSessionId: sessionId,
    providerReportId: event.data.object.last_verification_report || null,
    kycStatus: mappedStatus,
    rejectionReasonCode: mappedStatus === "rejected" ? resolveRejectionReasonCode(event) : null
  });

  await recordComplianceAuditEvent({
    walletPublicKey,
    actorType: "provider",
    actorId: "stripe_identity",
    eventName: "compliance.status_projected",
    eventPayload: {
      eventId: event.id,
      providerSessionId: sessionId,
      kycStatus: mappedStatus
    }
  });

  if (mappedStatus === "verified") {
    await markReferralAttributionKycApproved({
      inviteeWalletPublicKey: walletPublicKey
    });
    await promotePendingQualificationRewardsForInvitee({
      inviteeWalletPublicKey: walletPublicKey
    });
    await runWalletAmlScreening({
      walletPublicKey,
      trigger: "kyc_verified_webhook",
      actorType: "provider",
      actorId: "stripe_identity"
    });
  }

  return {
    duplicate: false,
    processed: true,
    eventId: event.id,
    walletPublicKey,
    kycStatus: mappedStatus
  };
}
