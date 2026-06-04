export type StatusRequestBody = {
  signatures?: unknown;
};

export type DeploySignatureStatus = {
  confirmed: boolean;
  failed: boolean;
  confirmationStatus: string | null;
  observedByWebhook: boolean;
  source: "rpc" | "webhook";
};

export type StatusRequestParseResult = {
  ok: true;
  signatures: string[];
} | {
  ok: false;
  error: string;
};

export function parseCoreCandyMachineStatusRequestBody(
  body: StatusRequestBody | null
): StatusRequestParseResult {
  if (!body || !Array.isArray(body.signatures)) {
    return {
      ok: false,
      error: "Invalid request body."
    };
  }

  const signatures = body.signatures
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((signature) => signature.trim());

  if (signatures.length === 0) {
    return {
      ok: false,
      error: "At least one signature is required."
    };
  }

  return {
    ok: true,
    signatures
  };
}
