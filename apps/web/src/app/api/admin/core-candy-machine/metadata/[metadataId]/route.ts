import { NextRequest, NextResponse } from "next/server";

import { getCoreMetadataRecord } from "@/features/nft-minting/infrastructure/core-candy-machine-metadata-store";

type RouteParams = {
  params: Promise<{
    metadataId: string;
  }>;
};

function normalizeMetadataId(value: string): string {
  return value.trim().replace(/\.json$/i, "");
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { metadataId } = await params;
  const record = getCoreMetadataRecord(normalizeMetadataId(metadataId));

  if (!record) {
    return NextResponse.json({ error: "Metadata not found." }, { status: 404 });
  }

  return NextResponse.json(record.payload, {
    headers: {
      "Cache-Control": "public, max-age=60"
    }
  });
}
