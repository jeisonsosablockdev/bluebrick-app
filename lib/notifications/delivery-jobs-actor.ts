import type { NextRequest } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import type { DeliveryActorType } from "@/lib/notifications/delivery-jobs-domain";
import { getNotificationsWorkerToken } from "@/lib/notifications/runtime-config";

export function isNotificationsWorkerRequest(tokenFromRequest: string | null): boolean {
  const expectedToken = getNotificationsWorkerToken();
  if (!expectedToken) {
    return false;
  }
  return tokenFromRequest === expectedToken;
}

export function resolveNotificationActor(request: NextRequest): { createdByType: DeliveryActorType; createdById: string } | null {
  if (isNotificationsWorkerRequest(request.headers.get("x-notifications-worker-token"))) {
    return {
      createdByType: "system",
      createdById: "notifications_worker"
    };
  }

  const role = getRequestRole(request);
  if (role.authenticated && role.role === "admin" && role.pubkey) {
    return {
      createdByType: "admin",
      createdById: role.pubkey
    };
  }

  return null;
}
