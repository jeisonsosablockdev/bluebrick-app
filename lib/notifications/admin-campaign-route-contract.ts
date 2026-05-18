import { z } from "zod";

import type { AdminNotificationMessageClass } from "@/lib/notifications/admin-campaigns";

const adminNotificationMessageClasses = [
  "product_update",
  "compliance_update",
  "ops_notice"
] satisfies [AdminNotificationMessageClass, ...AdminNotificationMessageClass[]];

const adminNotificationSegmentSchema = z.object({
  country: z.string().trim().length(2).nullable().optional(),
  platformFamily: z.enum(["ios", "android", "desktop", "unknown"]).nullable().optional(),
  appMode: z.enum(["browser", "standalone"]).nullable().optional()
});

const adminNotificationCampaignBaseSchema = z.object({
  messageClass: z.enum(adminNotificationMessageClasses),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(320),
  destinationUrl: z.string().trim().max(1024).nullable().optional(),
  segment: adminNotificationSegmentSchema.optional()
});

export const adminNotificationCampaignPreviewSchema = adminNotificationCampaignBaseSchema;

export const adminNotificationCampaignSendSchema = adminNotificationCampaignBaseSchema.extend({
  previewHash: z.string().trim().min(16).max(128),
  dryRun: z.boolean().optional()
});
