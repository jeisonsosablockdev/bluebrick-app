import { sanitizeInteger } from "@/lib/security";
import {
  hasNotificationsDatabase,
  isAdminPushCampaignsEnabled as isAdminPushCampaignsRuntimeEnabled,
  isNotificationsSchemaUnavailableError
} from "@/lib/notifications/runtime-config";

const DEFAULT_AUDIENCE_CAP = 100;
const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 10;
const DEFAULT_RATE_LIMIT_MAX_CAMPAIGNS = 3;

function parseEnvPositiveInteger(name: string, fallback: number): number {
  return sanitizeInteger(process.env[name], fallback, 1, 10_000);
}

export function hasAdminCampaignDatabase(): boolean {
  return hasNotificationsDatabase();
}

export function isAdminCampaignSchemaUnavailableError(error: unknown): boolean {
  return isNotificationsSchemaUnavailableError(error);
}

export function getAdminCampaignAudienceCap(): number {
  return parseEnvPositiveInteger("ADMIN_PUSH_CAMPAIGN_AUDIENCE_CAP", DEFAULT_AUDIENCE_CAP);
}

export function getAdminCampaignRateLimitWindowMinutes(): number {
  return parseEnvPositiveInteger("ADMIN_PUSH_CAMPAIGN_RATE_LIMIT_WINDOW_MINUTES", DEFAULT_RATE_LIMIT_WINDOW_MINUTES);
}

export function getAdminCampaignRateLimitMax(): number {
  return parseEnvPositiveInteger("ADMIN_PUSH_CAMPAIGN_RATE_LIMIT_MAX", DEFAULT_RATE_LIMIT_MAX_CAMPAIGNS);
}

export function isAdminPushCampaignsEnabled(): boolean {
  return isAdminPushCampaignsRuntimeEnabled();
}
