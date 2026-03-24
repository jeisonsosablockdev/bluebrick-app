import { NextRequest, NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth-session";
import { getWebhookEventsBySignatures } from "@/lib/mint-orchestrator-store";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.signatures)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const statuses = getWebhookEventsBySignatures("helius", body.signatures);
    return NextResponse.json({ statuses });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch statuses." }, { status: 500 });
  }
}