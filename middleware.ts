import { NextRequest, NextResponse } from "next/server";

type AuthMePayload = {
  authenticated: boolean;
  role?: "user" | "admin";
};

function redirectToForbidden(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/403";
  url.search = "";
  return NextResponse.redirect(url);
}

async function readRequestRole(request: NextRequest): Promise<AuthMePayload> {
  const response = await fetch(new URL("/api/auth/me", request.url), {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return (await response.json()) as AuthMePayload;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const auth = await readRequestRole(request);

  if (!auth.authenticated || auth.role !== "admin") {
    return redirectToForbidden(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
