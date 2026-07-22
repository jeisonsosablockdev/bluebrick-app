import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

const FORBIDDEN_RPC_MARKERS = ["mainnet", "testnet", "localnet", "localhost", "127.0.0.1"];

type DasRpcError = {
  code?: number;
  message?: string;
};

type DasRpcResponse<T> = {
  result?: T;
  error?: DasRpcError;
};

type DasAssetListResponse = {
  items?: unknown[];
};

type DasPaginationInput = {
  page: number;
  limit: number;
};

type DasAssetPageResult = {
  items: unknown[];
  page: number;
  limit: number;
};

export class DasClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = "DasClientError";
    this.code = code;
    this.status = status;
  }
}

function validateDevnetEndpoint(input: string): string {
  const endpoint = input.trim();
  const lowered = endpoint.toLowerCase();

  if (!lowered.includes("devnet")) {
    throw new DasClientError("INVALID_DAS_ENDPOINT", "DAS endpoint must target devnet.", 500);
  }

  if (FORBIDDEN_RPC_MARKERS.some((marker) => lowered.includes(marker) && marker !== "devnet")) {
    throw new DasClientError("INVALID_DAS_ENDPOINT", "Only devnet DAS endpoints are allowed.", 500);
  }

  return endpoint;
}

function resolveDasEndpoint(): string {
  const explicit = process.env.SOLANA_DAS_URL?.trim();

  if (explicit) {
    return validateDevnetEndpoint(explicit);
  }

  const heliusApiKey = process.env.HELIUS_API_KEY?.trim();

  if (heliusApiKey) {
    return `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;
  }

  return validateDevnetEndpoint(getSolanaRpcUrl());
}

function normalizePagination(input: Partial<DasPaginationInput>): DasPaginationInput {
  const page = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? Number(input.page) : 1;
  const limitRaw = Number.isInteger(input.limit) && (input.limit ?? 0) > 0 ? Number(input.limit) : 100;
  const limit = Math.min(limitRaw, 1000);

  return { page, limit };
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (!payload) {
    throw new DasClientError("DAS_EMPTY_RESPONSE", "DAS endpoint returned an empty response.", 502);
  }

  return payload;
}

export class DasClient {
  private readonly endpoint: string;

  constructor(endpoint = resolveDasEndpoint()) {
    this.endpoint = endpoint;
  }

  private async call<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `${method}-${Date.now()}`,
        method,
        params
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new DasClientError("DAS_HTTP_ERROR", `DAS request failed with status ${response.status}.`, 502);
    }

    const payload = await readJson<DasRpcResponse<T>>(response);

    if (payload.error) {
      throw new DasClientError(
        "DAS_RPC_ERROR",
        payload.error.message ?? "Unknown DAS RPC error.",
        502
      );
    }

    if (typeof payload.result === "undefined") {
      throw new DasClientError("DAS_MISSING_RESULT", "DAS RPC response did not include a result.", 502);
    }

    return payload.result;
  }

  async getAssetsByOwner(ownerAddress: string, paginationInput: Partial<DasPaginationInput>): Promise<DasAssetPageResult> {
    const pagination = normalizePagination(paginationInput);
    const result = await this.call<DasAssetListResponse>("getAssetsByOwner", {
      ownerAddress,
      page: pagination.page,
      limit: pagination.limit,
      displayOptions: {
        showCollectionMetadata: true,
        showUnverifiedCollections: true
      }
    });

    return {
      items: Array.isArray(result.items) ? result.items : [],
      page: pagination.page,
      limit: pagination.limit
    };
  }

  async getAssetsByCollection(collectionAddress: string, paginationInput: Partial<DasPaginationInput>): Promise<DasAssetPageResult> {
    const pagination = normalizePagination(paginationInput);
    const result = await this.call<DasAssetListResponse>("getAssetsByGroup", {
      groupKey: "collection",
      groupValue: collectionAddress,
      page: pagination.page,
      limit: pagination.limit
    });

    return {
      items: Array.isArray(result.items) ? result.items : [],
      page: pagination.page,
      limit: pagination.limit
    };
  }
}

export function isDasClientError(error: unknown): error is DasClientError {
  return error instanceof DasClientError;
}
