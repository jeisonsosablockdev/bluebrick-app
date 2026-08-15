import { buildLlmsTxt } from "@/lib/ai";

const TEXT_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

export async function GET(): Promise<Response> {
  return new Response(buildLlmsTxt(), {
    status: 200,
    headers: TEXT_HEADERS
  });
}
