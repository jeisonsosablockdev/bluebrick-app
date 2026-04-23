import "server-only";

import { cookies, headers } from "next/headers";

import type { AdminCollectionReadModel } from "@/lib/admin/collections-read-model";
import { getSiteOrigin } from "@/lib/seo/site";

type AdminCollectionsListSuccessResponse = {
  ok: true;
  data: AdminCollectionReadModel[];
};

type AdminCollectionsListErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type AdminCollectionsListResponse = AdminCollectionsListSuccessResponse | AdminCollectionsListErrorResponse;

type AdminCollectionsSummary = {
  total: number;
  linked: number;
  reviewRequired: number;
};

export type AdminCollectionsPageState =
  | {
      kind: "success";
      collections: AdminCollectionReadModel[];
      summary: AdminCollectionsSummary;
    }
  | {
      kind: "empty";
    }
  | {
      kind: "error";
      message: string;
    };

function buildSummary(collections: AdminCollectionReadModel[]): AdminCollectionsSummary {
  const linked = collections.filter((collection) => collection.validationState === "linked").length;

  return {
    total: collections.length,
    linked,
    reviewRequired: collections.length - linked
  };
}

export function toAdminCollectionsPageState(
  response: AdminCollectionsListResponse | null
): AdminCollectionsPageState {
  if (!response) {
    return {
      kind: "error",
      message: "Could not load admin collections."
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
    collections: response.data,
    summary: buildSummary(response.data)
  };
}

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

export async function loadAdminCollectionsPageState(): Promise<AdminCollectionsPageState> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const cookieHeader = serializeCookieHeader(cookieStore.getAll());

    const response = await fetch(new URL("/api/admin/collections", resolveRequestOrigin(headerStore)), {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined
    });

    const payload = (await response.json()) as AdminCollectionsListResponse;

    if (!response.ok && !("error" in payload)) {
      return {
        kind: "error",
        message: "Could not load admin collections."
      };
    }

    return toAdminCollectionsPageState(payload);
  } catch {
    return {
      kind: "error",
      message: "Could not load admin collections."
    };
  }
}
