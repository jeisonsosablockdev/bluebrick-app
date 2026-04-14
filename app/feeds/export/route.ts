import { NextResponse } from "next/server";

import { buildKnowledgeExport } from "@/lib/search";

export const dynamic = "force-static";

const JSON_HEADERS = {
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

export async function GET(): Promise<NextResponse> {
  const payload = await buildKnowledgeExport();
  return NextResponse.json(payload, { headers: JSON_HEADERS });
}
