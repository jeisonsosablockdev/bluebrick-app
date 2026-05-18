export { isAdminPushCampaignsEnabled } from "@/lib/notifications/admin-campaign-config";
export {
  AdminNotificationCampaignError,
  type AdminNotificationAudiencePreview,
  type AdminNotificationCampaignInput,
  type AdminNotificationCampaignRecord,
  type AdminNotificationCampaignStatus,
  type AdminNotificationMessageClass,
  type AdminNotificationSegment,
  type CreateAdminNotificationCampaignInput
} from "@/lib/notifications/admin-campaign-domain";
export {
  createAdminNotificationCampaign,
  previewAdminNotificationCampaign
} from "@/lib/notifications/admin-campaign-service";
import {
  resetAdminNotificationCampaignStateForTests,
  seedAdminNotificationAudienceForTests
} from "@/lib/notifications/admin-campaign-state";

export function __resetAdminNotificationCampaignStateForTests(): void {
  resetAdminNotificationCampaignStateForTests();
}

export function __seedAdminNotificationAudienceForTests(
  rows: Parameters<typeof seedAdminNotificationAudienceForTests>[0]
): void {
  seedAdminNotificationAudienceForTests(rows);
}
