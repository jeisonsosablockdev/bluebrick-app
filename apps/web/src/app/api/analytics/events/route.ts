import { NextRequest, NextResponse } from "next/server";

import { recordAnalyticsEvent, recordOperabilityLog } from "@/lib/observability";
import type { AnalyticsEventInput, AnalyticsEventType } from "@/lib/observability";

function invalidPayloadResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_ANALYTICS_PAYLOAD",
        message
      }
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    recordOperabilityLog({
      level: "warn",
      event: "analytics.invalid_json",
      message: "Analytics event payload is not valid JSON.",
      context: {
        method: request.method,
        path: request.nextUrl.pathname
      }
    });

    return invalidPayloadResponse("Request body must be valid JSON.");
  }

  try {
    const payload = (typeof body === "object" && body !== null
      ? (body as Partial<AnalyticsEventInput>)
      : {}) as Partial<AnalyticsEventInput>;

    const event = recordAnalyticsEvent({
      eventType: (payload.eventType as AnalyticsEventType) ?? ("" as AnalyticsEventType),
      path: payload.path,
      fromPath: payload.fromPath,
      scrollDepth: payload.scrollDepth,
      ctaId: payload.ctaId,
      ctaLabel: payload.ctaLabel,
      message: payload.message,
      viewportWidth: payload.viewportWidth,
      viewportHeight: payload.viewportHeight,
      occurredAt: payload.occurredAt
    });

    if (event.eventType === "client_error") {
      recordOperabilityLog({
        level: "error",
        event: "analytics.client_error",
        message: "Client error reported through analytics stream.",
        context: {
          path: event.path,
          message: event.message ?? "",
          viewportWidth: event.viewportWidth,
          viewportHeight: event.viewportHeight
        }
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          eventId: event.id,
          acceptedAt: event.recordedAt
        }
      },
      {
        status: 202,
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid analytics event.";

    recordOperabilityLog({
      level: "warn",
      event: "analytics.validation_failed",
      message: "Analytics payload failed validation.",
      context: {
        reason: message,
        path: request.nextUrl.pathname
      }
    });

    return invalidPayloadResponse(message);
  }
}
