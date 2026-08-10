import { createHash, randomUUID } from "node:crypto";

import type { WebPushAppMode, WebPushPlatformFamily } from "@/lib/notifications/web-push-subscriptions-repository";

import { getAdminCampaignAudienceCap, isAdminPushCampaignsEnabled } from "@/lib/notifications/admin-campaign-config";

export type AdminNotificationMessageClass = "product_update" | "compliance_update" | "ops_notice";
export type AdminNotificationCampaignStatus = "previewed" | "blocked" | "queued";

export type AdminNotificationSegment = {
  country: string | null;
  platformFamily: WebPushPlatformFamily | null;
  appMode: WebPushAppMode | null;
};

export type AdminNotificationCampaignInput = {
  actorPubkey: string;
  messageClass: AdminNotificationMessageClass;
  title: string;
  body: string;
  destinationUrl: string | null;
  segment: Partial<AdminNotificationSegment>;
};

export type AdminNotificationAudiencePreview = {
  eligibleWalletCount: number;
  eligibleSubscriptionCount: number;
  excludedWalletCount: number;
  blockedReasons: string[];
  audienceCap: number;
  audienceHash: string;
  sampleWallets: AudienceRow[];
};

export type AdminNotificationCampaignRecord = {
  id: string;
  actorPubkey: string;
  messageClass: AdminNotificationMessageClass;
  title: string;
  body: string;
  destinationUrl: string | null;
  segment: AdminNotificationSegment;
  audienceSummary: AdminNotificationAudiencePreview;
  status: AdminNotificationCampaignStatus;
  queuedJobCount: number;
  createdAt: string;
  queuedAt: string | null;
};

export type CreateAdminNotificationCampaignInput = AdminNotificationCampaignInput & {
  previewHash: string;
  dryRun: boolean;
};

export type AudienceRow = {
  walletPublicKey: string;
  country: string | null;
  activeSubscriptionCount: number;
  platformFamily: WebPushPlatformFamily | null;
  appMode: WebPushAppMode | null;
};

const PREVIEW_SAMPLE_LIMIT = 8;

export class AdminNotificationCampaignError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "ADMIN_NOTIFICATION_CAMPAIGN_ERROR") {
    super(message);
    this.name = "AdminNotificationCampaignError";
    this.status = status;
    this.code = code;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new AdminNotificationCampaignError(`${label} is required.`, 400, "INVALID_ADMIN_NOTIFICATION_CAMPAIGN");
  }
  return normalized;
}

export function sanitizeCampaignText(value: string, label: string, maxLength: number): string {
  const normalized = assertNonEmpty(value, label).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!normalized) {
    throw new AdminNotificationCampaignError(`${label} is required.`, 400, "INVALID_ADMIN_NOTIFICATION_CAMPAIGN");
  }
  return normalized.slice(0, maxLength);
}

function normalizeDestinationUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    throw new AdminNotificationCampaignError(
      "destinationUrl must be an internal path that starts with '/'.",
      400,
      "INVALID_DESTINATION_URL"
    );
  }

  return normalized.slice(0, 1024);
}

function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new AdminNotificationCampaignError("country filter must be an ISO-2 code.", 400, "INVALID_CAMPAIGN_SEGMENT");
  }

  return normalized;
}

export function normalizeAdminNotificationSegment(segment: Partial<AdminNotificationSegment>): AdminNotificationSegment {
  return {
    country: normalizeCountry(segment.country),
    platformFamily: segment.platformFamily ?? null,
    appMode: segment.appMode ?? null
  };
}

export function normalizeAdminCampaignInput(
  input: AdminNotificationCampaignInput
): AdminNotificationCampaignInput & { segment: AdminNotificationSegment } {
  return {
    actorPubkey: sanitizeCampaignText(input.actorPubkey, "actorPubkey", 120),
    messageClass: input.messageClass,
    title: sanitizeCampaignText(input.title, "title", 120),
    body: sanitizeCampaignText(input.body, "body", 320),
    destinationUrl: normalizeDestinationUrl(input.destinationUrl),
    segment: normalizeAdminNotificationSegment(input.segment)
  };
}

function buildAudienceHash(input: {
  title: string;
  body: string;
  destinationUrl: string | null;
  messageClass: AdminNotificationMessageClass;
  segment: AdminNotificationSegment;
  wallets: string[];
  audienceCap: number;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: input.title,
        body: input.body,
        destinationUrl: input.destinationUrl,
        messageClass: input.messageClass,
        segment: input.segment,
        wallets: input.wallets,
        audienceCap: input.audienceCap
      })
    )
    .digest("hex");
}

export function buildPreviewFromAudience(
  normalized: AdminNotificationCampaignInput & { segment: AdminNotificationSegment },
  rows: AudienceRow[]
): AdminNotificationAudiencePreview {
  const eligibleRows = rows.filter((row) => row.activeSubscriptionCount > 0);
  const eligibleWallets = eligibleRows.map((row) => row.walletPublicKey);
  const audienceCap = getAdminCampaignAudienceCap();
  const blockedReasons: string[] = [];

  if (!isAdminPushCampaignsEnabled()) {
    blockedReasons.push("feature_disabled");
  }

  if (eligibleRows.length === 0) {
    blockedReasons.push("no_eligible_wallets");
  }

  if (eligibleRows.length > audienceCap) {
    blockedReasons.push("audience_cap_exceeded");
  }

  return {
    eligibleWalletCount: eligibleRows.length,
    eligibleSubscriptionCount: eligibleRows.reduce((sum, row) => sum + row.activeSubscriptionCount, 0),
    excludedWalletCount: rows.length - eligibleRows.length,
    blockedReasons,
    audienceCap,
    audienceHash: buildAudienceHash({
      title: normalized.title,
      body: normalized.body,
      destinationUrl: normalized.destinationUrl,
      messageClass: normalized.messageClass,
      segment: normalized.segment,
      wallets: eligibleWallets,
      audienceCap
    }),
    sampleWallets: eligibleRows.slice(0, PREVIEW_SAMPLE_LIMIT)
  };
}

export function buildCampaignRecord(
  input: AdminNotificationCampaignInput & { segment: AdminNotificationSegment },
  preview: AdminNotificationAudiencePreview,
  status: AdminNotificationCampaignStatus,
  queuedJobCount: number
): AdminNotificationCampaignRecord {
  const timestamp = nowIso();

  return {
    id: randomUUID(),
    actorPubkey: input.actorPubkey,
    messageClass: input.messageClass,
    title: input.title,
    body: input.body,
    destinationUrl: input.destinationUrl,
    segment: input.segment,
    audienceSummary: preview,
    status,
    queuedJobCount,
    createdAt: timestamp,
    queuedAt: status === "queued" ? timestamp : null
  };
}
