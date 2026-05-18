import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getNotificationHealthSnapshot } from "@/lib/notifications/health";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return notificationErrorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const snapshot = await getNotificationHealthSnapshot();

  return NextResponse.json(
    {
      ok: true,
      data: snapshot
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
