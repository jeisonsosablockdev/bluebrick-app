import "server-only";

import { cookies, headers } from "next/headers";

import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import { getSiteOrigin } from "@/lib/seo/site";

type AdminCollectionDetailSuccessResponse = {
  ok: true;
  data: {
    ownership: AdminCollectionOwnership;
    content: AdminCollectionContentRecord;
  };
};

type AdminCollectionDetailErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionDetailResponse = AdminCollectionDetailSuccessResponse | AdminCollectionDetailErrorResponse;

export type AdminCollectionDetailPageState =
  | {
      kind: "success";
      ownership: AdminCollectionOwnership;
      content: AdminCollectionContentRecord;
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

export async function loadAdminCollectionDetailPageState(
  entryId: string
): Promise<AdminCollectionDetailPageState> {
  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) {
    return {
      kind: "error",
      message: "Collection was not found."
    };
  }

  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const cookieHeader = serializeCookieHeader(cookieStore.getAll());

    const response = await fetch(new URL(`/api/admin/collections/${normalizedEntryId}`, resolveRequestOrigin(headerStore)), {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined
    });

    const payload = (await response.json()) as AdminCollectionDetailResponse;

    if (!response.ok) {
      return {
        kind: "error",
        message: "error" in payload ? payload.error.message : "Could not load admin collection detail."
      };
    }

    if ("error" in payload) {
      return {
        kind: "error",
        message: payload.error.message
      };
    }

    return {
      kind: "success",
      content: payload.data.content,
      ownership: payload.data.ownership
    };
  } catch {
    return {
      kind: "error",
      message: "Could not load admin collection detail."
    };
  }
}
