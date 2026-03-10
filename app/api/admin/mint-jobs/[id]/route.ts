import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getMintJobOverviewById } from "@/lib/mint-jobs/repository";

type MintJobParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: MintJobParams): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const jobId = id.trim();

  if (!jobId) {
    return NextResponse.json({ error: "job id is required." }, { status: 400 });
  }

  try {
    const overview = await getMintJobOverviewById(jobId);

    if (!overview) {
      return NextResponse.json({ error: "Mint job not found." }, { status: 404 });
    }

    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read mint job.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
