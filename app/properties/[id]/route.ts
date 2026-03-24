import { NextResponse } from "next/server";

import { PropertyRpcError } from "@/lib/property-service";
import { getMarketplacePropertyDetailOrThrowRpc } from "@/lib/property-marketplace-server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const property = await getMarketplacePropertyDetailOrThrowRpc(id);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    return NextResponse.json({ data: property }, { status: 200 });
  } catch (error) {
    if (error instanceof PropertyRpcError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error while fetching property detail.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
