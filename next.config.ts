import type { NextConfig } from "next";

import { buildSecurityHeaders, readSecurityHeadersOptionsFromEnv } from "./lib/security/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com"
      }
    ]
  },
  async headers() {
    const securityOptions = readSecurityHeadersOptionsFromEnv();
    const securityHeaders = buildSecurityHeaders(securityOptions);

    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
