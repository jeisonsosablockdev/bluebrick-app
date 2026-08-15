import { buildRssFeed } from "@/lib/search";

export const dynamic = "force-static";

const TEXT_HEADERS = {
  "content-type": "application/rss+xml; charset=utf-8",
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

export async function GET(): Promise<Response> {
  const payload = await buildRssFeed();

  return new Response(payload, {
    status: 200,
    headers: TEXT_HEADERS
  });
}
