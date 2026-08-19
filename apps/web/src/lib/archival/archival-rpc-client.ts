/**
 * SPEC-S02-C (EPIC-014): Archival RPC Client
 *
 * Multi-provider archival Solana RPC client with:
 * - Helius Archive as primary endpoint
 * - Alchemy Archive as secondary endpoint
 * - minimumLedgerSlot validation per endpoint
 * - Staleness guards: max_slot_lag=100, max_age=5000ms
 * - dual_provider_gap block reason when both providers lack coverage
 *
 * Business rule P3: No self-hosted nodes. Only Helius and Alchemy.
 */

const MAX_SLOT_LAG = 100;
const MAX_AGE_MS = 5000;

export type ArchivalEndpointName = "helius-archive" | "alchemy-archive";

export type ArchivalEndpointConfig = {
  name: ArchivalEndpointName;
  url: string;
  isPrimary: boolean;
};

export type ArchivalTransactionResult = {
  tx: unknown;
  endpointName: ArchivalEndpointName;
  contextSlot: number;
};

export type ArchivalSignatureResult = {
  signature: string;
  slot: number | null;
  blockTime: number | null;
  err: unknown;
};

export type ArchivalHealthResult = {
  name: ArchivalEndpointName;
  healthy: boolean;
  minLedgerSlot: number | null;
  currentSlot: number | null;
  checkedAt: string;
  errorMessage: string | null;
};

export type ArchivalGapError = {
  code: "dual_provider_gap";
  message: string;
  requiredSlot: number | null;
};

export class ArchivalRpcError extends Error {
  readonly code: string;
  readonly endpointName: ArchivalEndpointName | null;

  constructor(code: string, message: string, endpointName: ArchivalEndpointName | null = null) {
    super(message);
    this.name = "ArchivalRpcError";
    this.code = code;
    this.endpointName = endpointName;
  }
}

export class DualProviderGapError extends Error {
  readonly code = "dual_provider_gap" as const;
  readonly requiredSlot: number | null;

  constructor(requiredSlot: number | null) {
    super(
      `Both archival providers (Helius Archive + Alchemy Archive) lack coverage for slot ${requiredSlot ?? "unknown"}. ` +
        "Distribution run must be BLOCKED with reason dual_provider_gap and requires committee manual review."
    );
    this.name = "DualProviderGapError";
    this.requiredSlot = requiredSlot;
  }
}

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: unknown[];
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: { code: number; message: string };
  context?: { slot: number };
};

type GetTransactionResponse = {
  blockTime: number | null;
  slot: number;
  meta: { err: unknown } | null;
  transaction: unknown;
} | null;

type GetSignaturesForAddressResponse = Array<{
  signature: string;
  slot: number;
  blockTime: number | null;
  err: unknown;
}>;

type GetMinimumLedgerSlotResponse = number;
type GetSlotResponse = number;

function buildEndpoints(): ArchivalEndpointConfig[] {
  const heliusKey = process.env.HELIUS_API_KEY?.trim();
  const alchemyKey = process.env.ALCHEMY_API_KEY?.trim();

  if (!heliusKey) {
    throw new ArchivalRpcError(
      "MISSING_HELIUS_KEY",
      "HELIUS_API_KEY is required for archival RPC. Set it in environment variables."
    );
  }

  if (!alchemyKey) {
    throw new ArchivalRpcError(
      "MISSING_ALCHEMY_KEY",
      "ALCHEMY_API_KEY is required for archival RPC (secondary provider). Set it in environment variables."
    );
  }

  return [
    {
      name: "helius-archive",
      url: `https://devnet.helius-rpc.com/?api-key=${heliusKey}`,
      isPrimary: true
    },
    {
      name: "alchemy-archive",
      url: `https://solana-devnet.g.alchemy.com/v2/${alchemyKey}`,
      isPrimary: false
    }
  ];
}

async function callRpc<T>(
  url: string,
  method: string,
  params: unknown[],
  signal?: AbortSignal
): Promise<JsonRpcResponse<T>> {
  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: `${method}-${Date.now()}`,
    method,
    params
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }

  return response.json() as Promise<JsonRpcResponse<T>>;
}

/**
 * ArchivalRpcClient: multi-provider archival RPC with staleness guards.
 *
 * Instantiate once and reuse. Endpoints are resolved from env vars.
 */
export class ArchivalRpcClient {
  private readonly endpoints: ArchivalEndpointConfig[];
  private readonly maxSlotLag: number;
  private readonly maxAgeMs: number;

  constructor(
    endpoints: ArchivalEndpointConfig[] = buildEndpoints(),
    maxSlotLag = MAX_SLOT_LAG,
    maxAgeMs = MAX_AGE_MS
  ) {
    this.endpoints = [...endpoints].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    this.maxSlotLag = maxSlotLag;
    this.maxAgeMs = maxAgeMs;
  }

  /**
   * Get the minimumLedgerSlot for a single endpoint.
   * This is the oldest slot the endpoint *claims* to have.
   * It is necessary but not sufficient to guarantee continuous coverage.
   */
  async getMinimumLedgerSlot(endpoint: ArchivalEndpointConfig): Promise<number | null> {
    try {
      const res = await callRpc<GetMinimumLedgerSlotResponse>(
        endpoint.url,
        "minimumLedgerSlot",
        []
      );
      return typeof res.result === "number" ? res.result : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate an endpoint has archival coverage back to the required slot.
   * Returns false if minimumLedgerSlot > requiredSlot (gap confirmed).
   */
  async validateEndpoint(
    endpoint: ArchivalEndpointConfig,
    requiredSlot: number
  ): Promise<boolean> {
    const minSlot = await this.getMinimumLedgerSlot(endpoint);
    if (minSlot === null) return false;
    return minSlot <= requiredSlot;
  }

  /**
   * Get a transaction from archival RPC.
   * Tries primary first, falls back to secondary.
   * Throws DualProviderGapError if neither provider has coverage.
   */
  async getTransaction(
    signature: string,
    requiredSlot?: number
  ): Promise<ArchivalTransactionResult> {
    const errors: string[] = [];

    for (const endpoint of this.endpoints) {
      if (requiredSlot !== undefined) {
        const valid = await this.validateEndpoint(endpoint, requiredSlot);
        if (!valid) {
          errors.push(`${endpoint.name}: insufficient archival coverage for slot ${requiredSlot}`);
          continue;
        }
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.maxAgeMs);

        const res = await callRpc<GetTransactionResponse>(
          endpoint.url,
          "getTransaction",
          [
            signature,
            {
              commitment: "finalized",
              maxSupportedTransactionVersion: 0,
              ...(requiredSlot !== undefined ? { minContextSlot: requiredSlot } : {})
            }
          ],
          controller.signal
        ).finally(() => clearTimeout(timeout));

        if (res.result) {
          const contextSlot =
            typeof res.context?.slot === "number" ? res.context.slot : res.result.slot;

          if (requiredSlot !== undefined && contextSlot < requiredSlot - this.maxSlotLag) {
            errors.push(`${endpoint.name}: context slot ${contextSlot} is stale (required ${requiredSlot})`);
            continue;
          }

          return {
            tx: res.result,
            endpointName: endpoint.name,
            contextSlot
          };
        }

        errors.push(`${endpoint.name}: transaction not found`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${endpoint.name}: ${msg}`);
      }
    }

    throw new DualProviderGapError(requiredSlot ?? null);
  }

  /**
   * Get signatures for an address from archival RPC.
   * Used for freeze interval reconstruction in Final Calculation.
   */
  async getSignaturesForAddress(
    address: string,
    options: {
      before?: string;
      until?: string;
      limit?: number;
      requiredSlot?: number;
    } = {}
  ): Promise<ArchivalSignatureResult[]> {
    const { before, until, limit = 1000, requiredSlot } = options;

    for (const endpoint of this.endpoints) {
      if (requiredSlot !== undefined) {
        const valid = await this.validateEndpoint(endpoint, requiredSlot);
        if (!valid) continue;
      }

      try {
        const params: Record<string, unknown> = {
          commitment: "finalized",
          limit
        };
        if (before) params.before = before;
        if (until) params.until = until;

        const res = await callRpc<GetSignaturesForAddressResponse>(
          endpoint.url,
          "getSignaturesForAddress",
          [address, params]
        );

        if (Array.isArray(res.result)) {
          return res.result.map((s) => ({
            signature: s.signature,
            slot: typeof s.slot === "number" ? s.slot : null,
            blockTime: typeof s.blockTime === "number" ? s.blockTime : null,
            err: s.err
          }));
        }
      } catch {
        // Try next endpoint
      }
    }

    throw new DualProviderGapError(requiredSlot ?? null);
  }

  /**
   * Health check for all configured endpoints.
   * Returns status of both Helius Archive and Alchemy Archive.
   */
  async healthCheck(): Promise<ArchivalHealthResult[]> {
    return Promise.all(
      this.endpoints.map(async (endpoint): Promise<ArchivalHealthResult> => {
        const checkedAt = new Date().toISOString();

        try {
          const [minLedgerSlot, currentSlot] = await Promise.all([
            this.getMinimumLedgerSlot(endpoint),
            callRpc<GetSlotResponse>(endpoint.url, "getSlot", [{ commitment: "finalized" }]).then(
              (r) => (typeof r.result === "number" ? r.result : null)
            )
          ]);

          return {
            name: endpoint.name,
            healthy: minLedgerSlot !== null && currentSlot !== null,
            minLedgerSlot,
            currentSlot,
            checkedAt,
            errorMessage: null
          };
        } catch (err: unknown) {
          return {
            name: endpoint.name,
            healthy: false,
            minLedgerSlot: null,
            currentSlot: null,
            checkedAt,
            errorMessage: err instanceof Error ? err.message : String(err)
          };
        }
      })
    );
  }
}

export function isDualProviderGapError(error: unknown): error is DualProviderGapError {
  return error instanceof DualProviderGapError;
}

export function isArchivalRpcError(error: unknown): error is ArchivalRpcError {
  return error instanceof ArchivalRpcError;
}

/**
 * Singleton factory. Call once per request context.
 * Reads HELIUS_API_KEY and ALCHEMY_API_KEY from environment.
 */
export function createArchivalRpcClient(): ArchivalRpcClient {
  return new ArchivalRpcClient();
}
