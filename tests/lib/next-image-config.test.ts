import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("next image remote patterns", () => {
  it("allows Vercel Blob admin asset images rendered by marketplace pages", () => {
    expect(nextConfig.images?.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "*.public.blob.vercel-storage.com",
          pathname: "/admin-assets/**"
        })
      ])
    );
  });
});
