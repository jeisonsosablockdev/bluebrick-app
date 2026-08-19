import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { adminNotificationCampaignSendSchema } from "@/lib/notifications/admin-campaign-route-contract";
import {
  AdminNotificationCampaignError,
  createAdminNotificationCampaign,
} from "@/lib/notifications/admin-campaigns";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return notificationErrorResponse(403, "FORBIDDEN", "Admin wallet session is required.");
  }

  const body = await request.json().catch(() => null);
  const parsed = adminNotificationCampaignSendSchema.safeParse(body);

  if (!parsed.success) {
    return notificationErrorResponse(400, "INVALID_ADMIN_NOTIFICATION_CAMPAIGN", "Send payload is invalid.");
  }

  try {
    const result = await createAdminNotificationCampaign({
      actorPubkey: role.pubkey,
      messageClass: parsed.data.messageClass,
      title: parsed.data.title,
      body: parsed.data.body,
      destinationUrl: parsed.data.destinationUrl ?? null,
      previewHash: parsed.data.previewHash,
      dryRun: parsed.data.dryRun ?? false,
      segment: parsed.data.segment ?? {}
    });

    return NextResponse.json(
      {
        ok: true,
        data: result
      },
      {
        status: parsed.data.dryRun ? 200 : 202,
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    if (error instanceof AdminNotificationCampaignError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not send admin notification campaign.";
    return notificationErrorResponse(500, "ADMIN_NOTIFICATION_SEND_FAILED", message);
  }
}
