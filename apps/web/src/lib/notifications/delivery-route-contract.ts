import { z } from "zod";

export const notificationEnqueueSchema = z.object({
  dedupeKey: z.string().trim().min(1).max(160),
  notificationType: z.enum(["onboarding_reward_earned", "kyc_status_changed", "checkout_status_changed", "admin_notice"]),
  walletPublicKey: z.string().trim().min(32).max(80),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(320),
  destinationUrl: z.string().trim().max(1024).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const notificationProcessSchema = z.object({
  jobId: z.string().uuid()
});
