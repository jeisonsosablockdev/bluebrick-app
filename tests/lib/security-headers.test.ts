import { describe, expect, it } from "vitest";

import { buildCspValue, buildSecurityHeaders } from "@/lib/security";

describe("lib/security headers", () => {
  it("builds strict baseline headers", () => {
    const headers = buildSecurityHeaders({
      isProduction: true,
      cspReportOnly: false,
      cspReportUri: "https://example.com/csp-report"
    });

    const headerMap = new Map(headers.map((item) => [item.key, item.value]));

    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.has("Content-Security-Policy")).toBe(true);
    expect(headerMap.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headerMap.get("Content-Security-Policy")).toContain("frame-src 'self' https://www.google.com https://maps.google.com");
    expect(headerMap.get("Content-Security-Policy")).toContain("https://fonts.googleapis.com");
    expect(headerMap.get("Content-Security-Policy")).toContain("https://fonts.gstatic.com");
  });

  it("uses report-only header when requested", () => {
    const headers = buildSecurityHeaders({
      isProduction: false,
      cspReportOnly: true,
      cspReportUri: undefined
    });

    const headerKeys = headers.map((item) => item.key);

    expect(headerKeys).toContain("Content-Security-Policy-Report-Only");
    expect(headerKeys).not.toContain("Content-Security-Policy");
  });

  it("adds upgrade-insecure-requests only in production", () => {
    const productionCsp = buildCspValue({
      isProduction: true,
      cspReportOnly: false,
      cspReportUri: undefined
    });

    const developmentCsp = buildCspValue({
      isProduction: false,
      cspReportOnly: false,
      cspReportUri: undefined
    });

    expect(productionCsp).toContain("upgrade-insecure-requests");
    expect(developmentCsp).not.toContain("upgrade-insecure-requests");
  });

  it("allows unsafe-eval only in non-production", () => {
    const productionCsp = buildCspValue({
      isProduction: true,
      cspReportOnly: false,
      cspReportUri: undefined
    });

    const developmentCsp = buildCspValue({
      isProduction: false,
      cspReportOnly: false,
      cspReportUri: undefined
    });

    expect(productionCsp).not.toContain("'unsafe-eval'");
    expect(developmentCsp).toContain("'unsafe-eval'");
  });
});
