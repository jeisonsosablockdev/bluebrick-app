import { setTimeout as delay } from "node:timers/promises";

import type { AmlStatus } from "@/features/profile/domain/compliance-status-projector";

export type AmlProviderClassification = "clear" | "review_required" | "flagged" | "unavailable";
export type AmlFlagSeverity = "low" | "medium" | "high" | "unknown";

export type AmlFlag = {
  code: string;
  severity: AmlFlagSeverity;
  label?: string;
};

export type EvaluateHeliusAmlInput = {
  riskScore: number | null;
  flags: AmlFlag[];
  sanctionsHit?: boolean;
  providerClassification?: string | null;
};

export type EvaluatedAmlResult = {
  providerClassification: AmlProviderClassification;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  flags: AmlFlag[];
};

export type ScreenWalletWithHeliusInput = {
  walletPublicKey: string;
  reason: string;
};

export type HeliusAmlScreeningResult = EvaluatedAmlResult & {
  provider: "helius";
  ruleVersion: string;
  checkedAt: string;
};

type HeliusRequestConfig = {
  url: string;
  method: "GET" | "POST";
  body: string | undefined;
};

type FetchJsonResponse = {
  ok: boolean;
  status: number;
  payload: unknown;
};

type CachedResult = {
  expiresAt: number;
  result: HeliusAmlScreeningResult;
};

const amlResultCache = new Map<string, CachedResult>();

function nowIso(): string {
  return new Date().toISOString();
}

function asPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getCacheTtlSeconds(): number {
  return asPositiveInteger(process.env.HELIUS_AML_CACHE_TTL_SECONDS, 300);
}

function getRetryAttempts(): number {
  return asPositiveInteger(process.env.HELIUS_AML_RETRY_ATTEMPTS, 2);
}

function getRetryBaseDelayMs(): number {
  return asPositiveInteger(process.env.HELIUS_AML_RETRY_BASE_DELAY_MS, 250);
}

function getRuleVersion(): string {
  return process.env.HELIUS_AML_RULE_VERSION?.trim() || "helius-v1";
}

function getHeliusApiKey(): string {
  const apiKey = process.env.HELIUS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("HELIUS_API_KEY is required for AML screening.");
  }

  return apiKey;
}

function normalizeFlagSeverity(value: unknown): AmlFlagSeverity {
  if (typeof value !== "string") {
    return "unknown";
  }

  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "unknown";
}

function toRiskScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.round(parsed);
    }
  }

  return null;
}

function sanitizeFlags(input: unknown): AmlFlag[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const sanitized: AmlFlag[] = [];

  for (const item of input) {
    if (!item) {
      continue;
    }

    if (typeof item === "string") {
      const code = item.trim();
      if (code) {
        sanitized.push({ code, severity: "unknown" });
      }
      continue;
    }

    if (typeof item === "object") {
      const record = item as Record<string, unknown>;
      const code = typeof record.code === "string" ? record.code.trim() : "";
      if (!code) {
        continue;
      }

      const label = typeof record.label === "string" && record.label.trim() ? record.label.trim() : undefined;
      sanitized.push({
        code,
        label,
        severity: normalizeFlagSeverity(record.severity)
      });
    }
  }

  return sanitized.slice(0, 30);
}

function parseProviderClassification(value: unknown): AmlProviderClassification | null {
  if (value !== "clear" && value !== "review_required" && value !== "flagged" && value !== "unavailable") {
    return null;
  }

  return value;
}

function getWalletApiBaseUrl(): string {
  return process.env.HELIUS_WALLET_API_BASE_URL?.trim() || "https://api.helius.xyz";
}

function buildWalletApiUrl(routePath: string, apiKey: string): string {
  const baseUrl = getWalletApiBaseUrl().replace(/\/+$/, "");
  const full = new URL(`${baseUrl}${routePath.startsWith("/") ? routePath : `/${routePath}`}`);
  full.searchParams.set("api-key", apiKey);
  return full.toString();
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asNormalizedString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function classifyWalletApiSignals(identityResponse: FetchJsonResponse, fundedByResponse: FetchJsonResponse): EvaluateHeliusAmlInput {
  if (
    identityResponse.status === 401 ||
    identityResponse.status === 403 ||
    fundedByResponse.status === 401 ||
    fundedByResponse.status === 403
  ) {
    throw new Error("Wallet API authorization failed.");
  }

  const identity = asObject(identityResponse.payload);
  const fundedBy = asObject(fundedByResponse.payload);

  const identityType = asNormalizedString(identity?.type);
  const identityCategory = asNormalizedString(identity?.category);
  const identityName = asNormalizedString(identity?.name);
  const identityTags = asStringArray(identity?.tags);
  const funderType = asNormalizedString(fundedBy?.funderType);
  const funderName = asNormalizedString(fundedBy?.funderName);

  const signalText = [identityType, identityCategory, identityName, funderType, funderName, ...identityTags]
    .filter(Boolean)
    .join(" ");

  const highRiskMarkers = ["sanction", "mixer", "tornado", "illicit", "darknet"];
  const reviewMarkers = ["exchange", "bridge", "market maker", "custodian", "treasury"];

  if (includesAny(signalText, highRiskMarkers)) {
    return {
      providerClassification: "flagged",
      riskScore: 90,
      sanctionsHit: signalText.includes("sanction"),
      flags: [{ code: "wallet_api_high_risk_signal", severity: "high" }]
    };
  }

  if (includesAny(signalText, reviewMarkers)) {
    return {
      providerClassification: "review_required",
      riskScore: 52,
      flags: [{ code: "wallet_api_known_entity", severity: "medium" }]
    };
  }

  if (
    identityType === "unknown" &&
    (fundedByResponse.status === 404 || !funderType)
  ) {
    return {
      providerClassification: "review_required",
      riskScore: 40,
      flags: [{ code: "wallet_api_unknown_identity", severity: "medium" }]
    };
  }

  if (identityResponse.status === 404 && fundedByResponse.status === 404) {
    return {
      providerClassification: "review_required",
      riskScore: 40,
      flags: [{ code: "wallet_api_no_history", severity: "medium" }]
    };
  }

  return {
    providerClassification: "clear",
    riskScore: 20,
    flags: []
  };
}

function hasSanctionsFlag(flags: AmlFlag[]): boolean {
  return flags.some((flag) => flag.code.toLowerCase().includes("sanction"));
}

export function evaluateHeliusAmlClassification(input: EvaluateHeliusAmlInput): EvaluatedAmlResult {
  const flags = input.flags;
  const sanitizedRiskScore = input.riskScore;
  const providerClassification = parseProviderClassification(input.providerClassification);
  const sanctionsHit = input.sanctionsHit === true || hasSanctionsFlag(flags);

  if (providerClassification) {
    return {
      providerClassification,
      amlStatus: providerClassification === "flagged" ? "flagged" : providerClassification === "clear" ? "clear" : "pending",
      amlRiskScore: sanitizedRiskScore,
      flags
    };
  }

  if (sanitizedRiskScore === null) {
    return {
      providerClassification: "unavailable",
      amlStatus: "pending",
      amlRiskScore: null,
      flags: flags.length > 0 ? flags : [{ code: "provider_unavailable", severity: "unknown" }]
    };
  }

  if (sanctionsHit || sanitizedRiskScore >= 80) {
    return {
      providerClassification: "flagged",
      amlStatus: "flagged",
      amlRiskScore: sanitizedRiskScore,
      flags
    };
  }

  if (sanitizedRiskScore >= 40) {
    return {
      providerClassification: "review_required",
      amlStatus: "pending",
      amlRiskScore: sanitizedRiskScore,
      flags
    };
  }

  return {
    providerClassification: "clear",
    amlStatus: "clear",
    amlRiskScore: sanitizedRiskScore,
    flags
  };
}

function buildHeliusRequestConfig(walletPublicKey: string): HeliusRequestConfig {
  const apiKey = getHeliusApiKey();
  const configuredUrl = process.env.HELIUS_AML_API_URL?.trim();

  if (configuredUrl) {
    const url = configuredUrl
      .replaceAll("{walletPublicKey}", encodeURIComponent(walletPublicKey))
      .replaceAll("{apiKey}", encodeURIComponent(apiKey));

    return {
      url,
      method: "POST",
      body: JSON.stringify({ walletPublicKey })
    };
  }

  return {
    url: `https://api.helius.xyz/v0/addresses/${encodeURIComponent(walletPublicKey)}/risk?api-key=${encodeURIComponent(apiKey)}`,
    method: "GET",
    body: undefined
  };
}

function parseHeliusPayload(payload: unknown): EvaluateHeliusAmlInput {
  if (!payload || typeof payload !== "object") {
    return { riskScore: null, flags: [] };
  }

  const record = payload as Record<string, unknown>;
  const riskScore =
    toRiskScore(record.risk_score) ??
    toRiskScore(record.riskScore) ??
    toRiskScore(record.aml_risk_score) ??
    toRiskScore(record.score);

  const flags = sanitizeFlags(record.flags ?? record.risk_flags ?? record.alerts);
  const sanctionsHit =
    record.sanctions_hit === true ||
    record.sanctioned === true ||
    record.has_sanctions === true;

  const providerClassification =
    (typeof record.classification === "string" && record.classification) ||
    (typeof record.risk_level === "string" && record.risk_level) ||
    null;

  return {
    riskScore,
    flags,
    sanctionsHit,
    providerClassification
  };
}

async function fetchWithRetry(config: HeliusRequestConfig): Promise<Response> {
  const attempts = getRetryAttempts();
  const baseDelayMs = getRetryBaseDelayMs();

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          "Content-Type": "application/json"
        },
        body: config.body,
        cache: "no-store"
      });

      if (response.ok) {
        return response;
      }

      lastError = new Error(`Helius AML responded with status ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      const waitMs = baseDelayMs * attempt;
      await delay(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not fetch Helius AML data.");
}

async function fetchJson(url: string): Promise<FetchJsonResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const payload = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

async function resolveFallbackWalletSignals(walletPublicKey: string, apiKey: string): Promise<EvaluateHeliusAmlInput> {
  const identityUrl = buildWalletApiUrl(`/v1/wallet/${encodeURIComponent(walletPublicKey)}/identity`, apiKey);
  const fundedByUrl = buildWalletApiUrl(`/v1/wallet/${encodeURIComponent(walletPublicKey)}/funded-by`, apiKey);

  const [identityResponse, fundedByResponse] = await Promise.all([fetchJson(identityUrl), fetchJson(fundedByUrl)]);

  return classifyWalletApiSignals(identityResponse, fundedByResponse);
}

function toScreeningResult(evaluated: EvaluatedAmlResult): HeliusAmlScreeningResult {
  return {
    ...evaluated,
    provider: "helius",
    ruleVersion: getRuleVersion(),
    checkedAt: nowIso()
  };
}

function getUnavailableResult(code: string): HeliusAmlScreeningResult {
  return {
    provider: "helius",
    ruleVersion: getRuleVersion(),
    checkedAt: nowIso(),
    providerClassification: "unavailable",
    amlStatus: "pending",
    amlRiskScore: null,
    flags: [{ code, severity: "unknown" }]
  };
}

export async function screenWalletWithHelius(input: ScreenWalletWithHeliusInput): Promise<HeliusAmlScreeningResult> {
  const cached = amlResultCache.get(input.walletPublicKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const apiKey = process.env.HELIUS_API_KEY?.trim();
  if (!apiKey) {
    return getUnavailableResult("provider_unavailable");
  }

  try {
    const requestConfig = buildHeliusRequestConfig(input.walletPublicKey);
    const response = await fetchWithRetry(requestConfig);
    const payload = await response.json().catch(() => null);
    const parsed = parseHeliusPayload(payload);
    let evaluated = evaluateHeliusAmlClassification(parsed);

    if (evaluated.providerClassification === "unavailable") {
      const fallbackInput = await resolveFallbackWalletSignals(input.walletPublicKey, apiKey);
      evaluated = evaluateHeliusAmlClassification(fallbackInput);
    }

    const result = toScreeningResult(evaluated);
    amlResultCache.set(input.walletPublicKey, {
      result,
      expiresAt: now + getCacheTtlSeconds() * 1000
    });

    return result;
  } catch {
    try {
      const fallbackInput = await resolveFallbackWalletSignals(input.walletPublicKey, apiKey);
      const evaluated = evaluateHeliusAmlClassification(fallbackInput);
      const result = toScreeningResult(evaluated);

      amlResultCache.set(input.walletPublicKey, {
        result,
        expiresAt: now + getCacheTtlSeconds() * 1000
      });

      return result;
    } catch {
      return getUnavailableResult("provider_unavailable");
    }
  }
}
