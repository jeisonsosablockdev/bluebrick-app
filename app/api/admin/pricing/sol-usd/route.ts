import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";

type SolUsdCacheEntry = {
  solUsd: number;
  updatedAt: string;
  expiresAtMs: number;
};

const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 6_000;
const COINGECKO_SOL_USD_URL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

let cachedSolUsdQuote: SolUsdCacheEntry | null = null;

function isValidQuote(solUsd: unknown): solUsd is number {
  return typeof solUsd === "number" && Number.isFinite(solUsd) && solUsd > 0;
}

async function fetchSolUsdFromProvider(signal: AbortSignal): Promise<number> {
  const response = await fetch(COINGECKO_SOL_USD_URL, {
    method: "GET",
    headers: {
      "accept": "application/json"
    },
    cache: "no-store",
    signal
  });

  const payload = await response.json().catch(() => null) as {
    solana?: {
      usd?: unknown;
    };
  } | null;

  const solUsd = payload?.solana?.usd;

  if (!response.ok || !isValidQuote(solUsd)) {
    throw new Error("Could not resolve SOL/USD price from provider.");
  }

  return solUsd;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nowMs = Date.now();
  if (cachedSolUsdQuote && cachedSolUsdQuote.expiresAtMs > nowMs) {
    return NextResponse.json({
      solUsd: cachedSolUsdQuote.solUsd,
      updatedAt: cachedSolUsdQuote.updatedAt,
      source: "coingecko",
      cached: true,
      stale: false
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const solUsd = await fetchSolUsdFromProvider(controller.signal);
    const updatedAt = new Date().toISOString();

    cachedSolUsdQuote = {
      solUsd,
      updatedAt,
      expiresAtMs: nowMs + CACHE_TTL_MS
    };

    return NextResponse.json({
      solUsd,
      updatedAt,
      source: "coingecko",
      cached: false,
      stale: false
    });
  } catch (error) {
    if (cachedSolUsdQuote) {
      return NextResponse.json({
        solUsd: cachedSolUsdQuote.solUsd,
        updatedAt: cachedSolUsdQuote.updatedAt,
        source: "coingecko",
        cached: true,
        stale: true
      });
    }

    const message = error instanceof Error ? error.message : "Could not fetch SOL/USD quote.";

    return NextResponse.json({
      error: message
    }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
