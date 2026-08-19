import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { adminNotificationCampaignPreviewSchema } from "@/lib/notifications/admin-campaign-route-contract";
import {
  previewAdminNotificationCampaign,
} from "@/lib/notifications/admin-campaigns";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return notificationErrorResponse(403, "FORBIDDEN", "Admin wallet session is required.");
  }

  const body = await request.json().catch(() => null);
  const parsed = adminNotificationCampaignPreviewSchema.safeParse(body);

  if (!parsed.success) {
    return notificationErrorResponse(400, "INVALID_ADMIN_NOTIFICATION_CAMPAIGN", "Preview payload is invalid.");
  }

  try {
    const preview = await previewAdminNotificationCampaign({
      actorPubkey: role.pubkey,
      messageClass: parsed.data.messageClass,
      title: parsed.data.title,
      body: parsed.data.body,
      destinationUrl: parsed.data.destinationUrl ?? null,
      segment: parsed.data.segment ?? {}
    });

    return NextResponse.json(
      {
        ok: true,
        data: preview
      },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not preview admin notification campaign.";
    return notificationErrorResponse(500, "ADMIN_NOTIFICATION_PREVIEW_FAILED", message);
  }
}
