import { z } from "zod";

export const ASSET_EXIT_STRATEGIES = [
  "sale",
  "refinance",
  "buyback",
  "hold",
  "token-redemption"
] as const;

export type AssetExitStrategy = (typeof ASSET_EXIT_STRATEGIES)[number];

const utf8ByteLength = (value: string): number => Buffer.byteLength(value, "utf8");

const collectionNameSchema = z.string().trim()
  .min(1, "collectionName is required.")
  .refine((value) => utf8ByteLength(value) <= 32, "collectionName must be <= 32 UTF-8 bytes.");

const collectionSymbolSchema = z.string().trim()
  .min(1, "collectionSymbol is required.")
  .max(10, "collectionSymbol must be <= 10 characters.")
  .regex(/^[A-Z0-9]{1,10}$/, "collectionSymbol must match ^[A-Z0-9]{1,10}$.");

const exitStrategySet = new Set<string>(ASSET_EXIT_STRATEGIES);

const exitStrategyAliases: Record<string, AssetExitStrategy> = {
  sale: "sale",
  sell: "sale",
  venta: "sale",
  "asset-sale": "sale",
  "property-sale": "sale",

  refinance: "refinance",
  refinancing: "refinance",
  refi: "refinance",
  refinanciacion: "refinance",
  refinanciamiento: "refinance",
  refinanciamento: "refinance",

  buyback: "buyback",
  "buy-back": "buyback",
  recompra: "buyback",
  "token-buyback": "buyback",
  "asset-buyback": "buyback",

  hold: "hold",
  holding: "hold",
  mantener: "hold",
  mantenimiento: "hold",
  manter: "hold",
  "long-hold": "hold",

  "token-redemption": "token-redemption",
  tokenredemption: "token-redemption",
  redemption: "token-redemption",
  redeem: "token-redemption",
  "token-redeem": "token-redemption",
  "token-redencion": "token-redemption",
  "token-redencao": "token-redemption",
  "rescate-token": "token-redemption"
};

function normalizeExitStrategyInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCanonicalExitStrategy(value: string): AssetExitStrategy | null {
  const normalized = normalizeExitStrategyInput(value);
  if (!normalized) {
    return null;
  }

  if (exitStrategySet.has(normalized)) {
    return normalized as AssetExitStrategy;
  }

  return exitStrategyAliases[normalized] ?? null;
}

const exitStrategySchema = z.string().trim().min(1, "exitStrategy is required.").transform((value, context) => {
  const canonical = toCanonicalExitStrategy(value);

  if (!canonical) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "exitStrategy is not allowed."
    });
    return z.NEVER;
  }

  return canonical;
});

const assetCompatibilitySchema = z.object({
  collectionName: collectionNameSchema,
  collectionSymbol: collectionSymbolSchema,
  exitStrategy: exitStrategySchema
});

export type AssetCompatibilityInput = z.input<typeof assetCompatibilitySchema>;
export type AssetCompatibility = z.output<typeof assetCompatibilitySchema>;

type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function toParseResult<T>(result: z.SafeParseReturnType<unknown, T>): ParseResult<T> {
  if (result.success) {
    return {
      ok: true,
      value: result.data
    };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => issue.message)
  };
}

export function parseCollectionName(value: unknown): ParseResult<string> {
  return toParseResult(collectionNameSchema.safeParse(value));
}

export function parseCollectionSymbol(value: unknown): ParseResult<string> {
  return toParseResult(collectionSymbolSchema.safeParse(value));
}

export function parseExitStrategy(value: unknown): ParseResult<AssetExitStrategy> {
  return toParseResult(exitStrategySchema.safeParse(value));
}

export function parseAssetCompatibility(input: unknown): ParseResult<AssetCompatibility> {
  return toParseResult(assetCompatibilitySchema.safeParse(input));
}
