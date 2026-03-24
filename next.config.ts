import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
  }
};

export default nextConfig;
