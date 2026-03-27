import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getWebhookEventsBySignatures } from "@/lib/mint-orchestrator-store";

type StatusRequestBody = {
  signatures?: unknown;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as StatusRequestBody | null;

  if (!body || !Array.isArray(body.signatures)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const signatures = body.signatures.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (signatures.length === 0) {
    return NextResponse.json({ error: "At least one signature is required." }, { status: 400 });
  }

  try {
    const statuses = getWebhookEventsBySignatures("helius", signatures);
    return NextResponse.json({ statuses });
  } catch {
    return NextResponse.json({ error: "Could not fetch statuses." }, { status: 500 });
  }
}
