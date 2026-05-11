import "server-only";

import { cookies, headers } from "next/headers";

import type { AdminCollectionHealthRow } from "@/lib/admin/collection-health-read-model";
import { getSiteOrigin } from "@/lib/seo/site";

type AdminCollectionsHealthSuccessResponse = {
  ok: true;
  data: AdminCollectionHealthRow[];
};

type AdminCollectionsHealthErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionsHealthResponse = AdminCollectionsHealthSuccessResponse | AdminCollectionsHealthErrorResponse;

export type AdminCollectionsHealthPageState =
  | {
      kind: "success";
      rows: AdminCollectionHealthRow[];
    }
  | {
      kind: "empty";
    }
  | {
      kind: "error";
      message: string;
    };

function serializeCookieHeader(values: { name: string; value: string }[]): string {
  return values.map(({ name, value }) => `${name}=${value}`).join("; ");
}

function resolveRequestOrigin(headerStore: Headers): string {
  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!forwardedHost) {
    return getSiteOrigin();
  }

  const host = forwardedHost.split(",")[0]?.trim();
  if (!host) {
    return getSiteOrigin();
  }

  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export function toAdminCollectionsHealthPageState(
  response: AdminCollectionsHealthResponse | null
): AdminCollectionsHealthPageState {
  if (!response) {
    return {
      kind: "error",
      message: "Could not load collections health."
    };
  }

  if ("error" in response) {
    return {
      kind: "error",
      message: response.error.message
    };
  }

  if (response.data.length === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "success",
    rows: response.data
  };
}

export async function loadAdminCollectionsHealthPageState(): Promise<AdminCollectionsHealthPageState> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const cookieHeader = serializeCookieHeader(cookieStore.getAll());

    const response = await fetch(new URL("/api/admin/health/collections", resolveRequestOrigin(headerStore)), {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined
    });

    const payload = (await response.json()) as AdminCollectionsHealthResponse;

    if (!response.ok && !("error" in payload)) {
      return {
        kind: "error",
        message: "Could not load collections health."
      };
    }

    return toAdminCollectionsHealthPageState(payload);
  } catch {
    return {
      kind: "error",
      message: "Could not load collections health."
    };
  }
}
