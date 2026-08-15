import { NextResponse } from "next/server";

import { buildEntitiesContract } from "@/lib/ai";

const JSON_HEADERS = {
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

export async function GET(): Promise<NextResponse> {
  const payload = await buildEntitiesContract();
  return NextResponse.json(payload, { headers: JSON_HEADERS });
}
