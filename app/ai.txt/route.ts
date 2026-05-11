import { buildAiTxt } from "@/lib/ai";

const TEXT_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

export async function GET(): Promise<Response> {
  const payload = buildAiTxt();

  if (!payload) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  return new Response(payload, {
    status: 200,
    headers: TEXT_HEADERS
  });
}
