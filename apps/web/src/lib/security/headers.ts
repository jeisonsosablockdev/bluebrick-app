export type SecurityHeader = {
  key: string;
  value: string;
};

export type SecurityHeadersOptions = {
  isProduction: boolean;
  cspReportOnly: boolean;
  cspReportUri?: string;
};

function normalizeReportUri(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function buildCspValue(options: SecurityHeadersOptions): string {
  const reportUri = normalizeReportUri(options.cspReportUri);
  const scriptSrcValue = options.isProduction
    ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com";
  const googleMapsFrameSrc = "https://www.google.com https://maps.google.com";

  const directives: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    scriptSrcValue,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: https://va.vercel-scripts.com",
    "worker-src 'self' blob:",
    `frame-src 'self' ${googleMapsFrameSrc}`
  ];

  if (options.isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(options: SecurityHeadersOptions): SecurityHeader[] {
  const cspKey = options.cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  const cspValue = buildCspValue(options);

  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()"
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: cspKey, value: cspValue }
  ];
}

export function readSecurityHeadersOptionsFromEnv(): SecurityHeadersOptions {
  const nodeEnv = process.env.NODE_ENV?.trim();
  const isProduction = nodeEnv === "production";
  const cspReportOnly = process.env.CSP_REPORT_ONLY?.trim().toLowerCase() === "true";
  const cspReportUri = process.env.CSP_REPORT_URI?.trim();

  return {
    isProduction,
    cspReportOnly,
    cspReportUri
  };
}
