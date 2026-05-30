import type { NextConfig } from "next";

import { getAllowedDevOrigins } from "./lib/dev-origins";
import { buildSecurityHeaders, readSecurityHeadersOptionsFromEnv } from "./lib/security/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/admin/assets/import-preview": [
      "./node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
    ]
  },
  allowedDevOrigins: getAllowedDevOrigins(),
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
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/admin-assets/**"
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
