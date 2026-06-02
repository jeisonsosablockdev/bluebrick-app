"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";
import { getSolscanTransactionUrl } from "@/lib/solana";

type PurchaseCtaProps = {
  propertyId: string;
  nftPriceUsd?: number;
};

type QuoteResponse = {
  ok?: boolean;
  data?: {
    cacheUpdatedAt: string;
    paymentCurrency: "SOL" | "USDC";
    priceLamports: number | null;
    priceUsdcAtomic: number | null;
    startDateIso: string | null;
    itemsRemaining: number;
    quantityMode?: "SINGLE_ONLY" | "MULTI_ENABLED";
    quantity?: number;
    totalPriceLamports?: number | null;
    totalPriceUsdcAtomic?: number | null;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type PrepareResponse = {
  ok?: boolean;
  data?: {
    attemptId: string;
    idempotencyKey: string;
    transactionBase64: string;
    paymentCurrency: "SOL" | "USDC";
    priceLamports: number | null;
    totalPriceLamports?: number | null;
    priceUsdcAtomic: number | null;
    totalPriceUsdcAtomic?: number | null;
    quantityMode?: "SINGLE_ONLY" | "MULTI_ENABLED";
    quantity?: number;
    cacheUpdatedAt: string;
  };
  error?: {
    code?: string;
    message?: string;
    details?: {
      suggestedMaxQuantity?: number;
      [key: string]: unknown;
    } | null;
  };
};

type ChallengeResponse = {
  ok?: boolean;
  data?: {
    quantityMode?: "SINGLE_ONLY" | "MULTI_ENABLED";
    quantity?: number;
    challengeId: string;
    message: string;
    expiresAt: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type SubmitResponse = {
  ok?: boolean;
  data?: {
    attemptId: string;
    status: "submitted" | "confirmed";
    txSignature: string;
    submittedAt: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type PurchaseErrorCode =
  | "MINT_NOT_STARTED"
  | "SOLD_OUT"
  | "PRICE_CHANGED"
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_CHALLENGE"
  | "RATE_LIMITED"
  | "TRANSACTION_FAILED"
  | "UNAUTHORIZED";

type QuoteState = {
  cacheUpdatedAt: string;
  paymentCurrency: "SOL" | "USDC";
  priceLamports: number | null;
  priceUsdcAtomic: number | null;
  startDateIso: string | null;
  itemsRemaining: number;
  quantityMode: "SINGLE_ONLY" | "MULTI_ENABLED";
  quantity: number;
  totalPriceLamports: number | null;
  totalPriceUsdcAtomic: number | null;
};

function parseBooleanEnv(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (typeof rawValue !== "string") {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parsePositiveIntEnv(rawValue: string | undefined, defaultValue: number): number {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return parsed;
}

const PURCHASE_TRACE_UI_ENABLED = parseBooleanEnv(process.env.NEXT_PUBLIC_PURCHASE_TRACE_UI, true);
const DEFAULT_PURCHASE_MAX_QUANTITY = 10;
const PURCHASE_MAX_QUANTITY = parsePositiveIntEnv(
  process.env.NEXT_PUBLIC_PURCHASE_MAX_QUANTITY_PER_ORDER,
  DEFAULT_PURCHASE_MAX_QUANTITY
);

function generateClientFlowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `flow-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(5);
}

function usdcAtomicToUsdc(amountAtomic: number): string {
  return (amountAtomic / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(base64Value: string): Uint8Array {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isWalletUserRejectedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("user rejected") || message.includes("rejected the request");
}

async function parseResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

export function PurchaseCta({ propertyId, nftPriceUsd }: PurchaseCtaProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { connected, publicKey, signMessage, signTransaction } = useWallet();
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [submittedSignature, setSubmittedSignature] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(() => (
    PURCHASE_TRACE_UI_ENABLED ? generateClientFlowId() : null
  ));
  const [lastFlowId, setLastFlowId] = useState<string | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState(1);

  const maxSelectableQuantity = useMemo(() => {
    if (quote?.quantityMode === "SINGLE_ONLY") {
      return 1;
    }

    return PURCHASE_MAX_QUANTITY;
  }, [quote?.quantityMode]);

  const canAttemptPurchase = useMemo(() => {
    return quote ? quote.itemsRemaining >= requestedQuantity : false;
  }, [quote, requestedQuantity]);

  const priceLabel = useMemo(() => {
    if (!quote) {
      return "--";
    }

    if (typeof nftPriceUsd === "number" && Number.isFinite(nftPriceUsd) && nftPriceUsd > 0) {
      return `${formatUsd(nftPriceUsd)} USD`;
    }

    if (quote.paymentCurrency === "USDC" && typeof quote.priceUsdcAtomic === "number") {
      return `${usdcAtomicToUsdc(quote.priceUsdcAtomic)} USDC`;
    }

    if (quote.paymentCurrency === "SOL" && typeof quote.priceLamports === "number") {
      return `${lamportsToSol(quote.priceLamports)} SOL`;
    }

    return "--";
  }, [nftPriceUsd, quote]);

  const totalPriceLabel = useMemo(() => {
    if (!quote) {
      return "--";
    }

    if (typeof nftPriceUsd === "number" && Number.isFinite(nftPriceUsd) && nftPriceUsd > 0) {
      return `${formatUsd(nftPriceUsd * requestedQuantity)} USD`;
    }

    if (quote.paymentCurrency === "USDC") {
      const totalAtomic = Number.isFinite(quote.totalPriceUsdcAtomic)
        ? quote.totalPriceUsdcAtomic
        : (Number.isFinite(quote.priceUsdcAtomic) ? (quote.priceUsdcAtomic as number) * requestedQuantity : null);

      return typeof totalAtomic === "number"
        ? `${usdcAtomicToUsdc(totalAtomic)} USDC`
        : "--";
    }

    const totalLamports = Number.isFinite(quote.totalPriceLamports)
      ? quote.totalPriceLamports
      : (Number.isFinite(quote.priceLamports) ? (quote.priceLamports as number) * requestedQuantity : null);
    return typeof totalLamports === "number"
      ? `${lamportsToSol(totalLamports)} SOL`
      : "--";
  }, [nftPriceUsd, quote, requestedQuantity]);

  const refreshQuote = useCallback(async (flowId?: string | null) => {
    setIsLoadingQuote(true);
    setQuoteError(null);
    const effectiveFlowId = flowId ?? activeFlowId;

    try {
      const response = await fetch("/api/purchase/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PURCHASE_TRACE_UI_ENABLED && effectiveFlowId ? { "x-flow-id": effectiveFlowId } : {})
        },
        body: JSON.stringify({ propertyId, quantity: requestedQuantity })
      });
      const payload = await parseResponse<QuoteResponse>(response);

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message
          ?? t({
            en: "Could not load mint quote.",
            es: "No se pudo cargar el quote de mint.",
            pt: "Nao foi possivel carregar a cotacao de mint."
          })
        );
      }

      setQuote({
        cacheUpdatedAt: payload.data.cacheUpdatedAt,
        paymentCurrency: payload.data.paymentCurrency,
        priceLamports: payload.data.priceLamports,
        priceUsdcAtomic: payload.data.priceUsdcAtomic,
        startDateIso: payload.data.startDateIso,
        itemsRemaining: payload.data.itemsRemaining,
        quantityMode: payload.data.quantityMode ?? "SINGLE_ONLY",
        quantity: payload.data.quantity ?? requestedQuantity,
        totalPriceLamports: payload.data.totalPriceLamports ?? (
          typeof payload.data.priceLamports === "number"
            ? payload.data.priceLamports * requestedQuantity
            : null
        ),
        totalPriceUsdcAtomic: payload.data.totalPriceUsdcAtomic ?? (
          typeof payload.data.priceUsdcAtomic === "number"
            ? payload.data.priceUsdcAtomic * requestedQuantity
            : null
        )
      });
    } catch (error) {
      setQuote(null);
      setQuoteError(
        error instanceof Error
          ? error.message
          : t({
            en: "Could not load mint quote.",
            es: "No se pudo cargar el quote de mint.",
            pt: "Nao foi possivel carregar a cotacao de mint."
          })
      );
    } finally {
      setIsLoadingQuote(false);
    }
  }, [activeFlowId, propertyId, requestedQuantity, t]);

  useEffect(() => {
    void refreshQuote();
  }, [refreshQuote]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshQuote();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshQuote]);

  useEffect(() => {
    if (requestedQuantity < 1) {
      setRequestedQuantity(1);
      return;
    }

    if (requestedQuantity > maxSelectableQuantity) {
      setRequestedQuantity(maxSelectableQuantity);
    }
  }, [maxSelectableQuantity, requestedQuantity]);

  function toBusinessMessage(
    code: string | undefined,
    fallback: string | undefined,
    details?: { suggestedMaxQuantity?: number } | null
  ): string {
    const normalizedCode = (code ?? "") as PurchaseErrorCode;

    if (normalizedCode === "MINT_NOT_STARTED") {
      return t({
        en: "Mint has not started yet.",
        es: "El mint aun no ha iniciado.",
        pt: "O mint ainda nao comecou."
      });
    }

    if (normalizedCode === "SOLD_OUT") {
      return t({
        en: "Sold out.",
        es: "Agotado.",
        pt: "Esgotado."
      });
    }

    if (normalizedCode === "PRICE_CHANGED") {
      return t({
        en: "Price changed. Please refresh and try again.",
        es: "El precio cambio. Actualiza e intenta de nuevo.",
        pt: "O preco mudou. Atualize e tente novamente."
      });
    }

    if (normalizedCode === "INVALID_QUANTITY") {
      if (typeof details?.suggestedMaxQuantity === "number" && details.suggestedMaxQuantity >= 1) {
        return t({
          en: `Requested quantity is too large for one transaction. Suggested max: ${details.suggestedMaxQuantity}.`,
          es: `La cantidad solicitada es demasiado grande para una sola transaccion. Maximo sugerido: ${details.suggestedMaxQuantity}.`,
          pt: `A quantidade solicitada e grande demais para uma unica transacao. Maximo sugerido: ${details.suggestedMaxQuantity}.`
        });
      }

      return fallback
        ?? t({
          en: "Requested quantity is too large for a single transaction. Reduce quantity and retry.",
          es: "La cantidad solicitada es demasiado grande para una sola transaccion. Reduce la cantidad y vuelve a intentar.",
          pt: "A quantidade solicitada e grande demais para uma unica transacao. Reduza a quantidade e tente novamente."
        });
    }

    if (normalizedCode === "INSUFFICIENT_FUNDS") {
      return t({
        en: "Insufficient balance for mint and network fees.",
        es: "Saldo insuficiente para el mint y fees de red.",
        pt: "Saldo insuficiente para mint e taxas de rede."
      });
    }

    if (normalizedCode === "UNAUTHORIZED") {
      return t({
        en: "Sign in with your wallet before purchasing.",
        es: "Inicia sesion con tu wallet antes de comprar.",
        pt: "Faca login com sua wallet antes de comprar."
      });
    }

    if (normalizedCode === "INVALID_CHALLENGE") {
      return t({
        en: "Security challenge expired or invalid. Please try again.",
        es: "El challenge de seguridad expiro o es invalido. Intenta de nuevo.",
        pt: "O desafio de seguranca expirou ou e invalido. Tente novamente."
      });
    }

    if (normalizedCode === "RATE_LIMITED") {
      return t({
        en: "Too many attempts. Please wait a moment and retry.",
        es: "Demasiados intentos. Espera un momento y vuelve a intentar.",
        pt: "Muitas tentativas. Aguarde um momento e tente novamente."
      });
    }

    return (
      fallback
      ?? t({
        en: "Transaction failed. Please try again.",
        es: "La transaccion fallo. Intenta nuevamente.",
        pt: "A transacao falhou. Tente novamente."
      })
    );
  }

  async function handlePurchase(): Promise<void> {
    if (!connected || !publicKey || !signTransaction) {
      setPurchaseError(
        t({
          en: "Connect Phantom and sign in before purchasing.",
          es: "Conecta Phantom e inicia sesion antes de comprar.",
          pt: "Conecte a Phantom e faca login antes de comprar."
        })
      );
      return;
    }

    if (!quote) {
      setPurchaseError(
        t({
          en: "Quote is required before purchase.",
          es: "Se requiere quote antes de comprar.",
          pt: "A cotacao e obrigatoria antes da compra."
        })
      );
      return;
    }

    setPurchaseError(null);
    setSubmittedSignature(null);
    setIsSubmitting(true);
    const flowId = PURCHASE_TRACE_UI_ENABLED ? generateClientFlowId() : null;
    if (flowId) {
      setActiveFlowId(flowId);
    }
    setLastFlowId(flowId);
    const quantityToBuy = requestedQuantity;

    try {
      if (!signMessage) {
        throw new Error(
          t({
            en: "Wallet does not support challenge signing.",
            es: "La wallet no soporta la firma del challenge.",
            pt: "A wallet nao suporta assinatura de desafio."
          })
        );
      }

      const challengeResponse = await fetch("/api/purchase/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PURCHASE_TRACE_UI_ENABLED && flowId ? { "x-flow-id": flowId } : {})
        },
        body: JSON.stringify({ propertyId, quantity: quantityToBuy })
      });
      const challenge = await parseResponse<ChallengeResponse>(challengeResponse);

      if (!challengeResponse.ok || !challenge.data) {
        throw new Error(toBusinessMessage(challenge.error?.code, challenge.error?.message));
      }

      const challengeMessageBytes = new TextEncoder().encode(challenge.data.message);
      const challengeSignature = await signMessage(challengeMessageBytes);
      const challengeSignatureBase64 = toBase64(challengeSignature);

      const quotedPricePayload = quote.paymentCurrency === "USDC"
        ? { quotedPriceUsdcAtomic: quote.priceUsdcAtomic ?? undefined }
        : { quotedPriceLamports: quote.priceLamports ?? undefined };

      const prepareResponse = await fetch("/api/purchase/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PURCHASE_TRACE_UI_ENABLED && flowId ? { "x-flow-id": flowId } : {})
        },
        body: JSON.stringify({
          propertyId,
          quantity: quantityToBuy,
          ...quotedPricePayload,
          challengeId: challenge.data.challengeId,
          challengeSignatureBase64
        })
      });
      const prepared = await parseResponse<PrepareResponse>(prepareResponse);

      if (!prepareResponse.ok || !prepared.data) {
        if (
          prepared.error?.code === "INVALID_QUANTITY"
          && typeof prepared.error?.details?.suggestedMaxQuantity === "number"
          && prepared.error.details.suggestedMaxQuantity >= 1
        ) {
          setRequestedQuantity(prepared.error.details.suggestedMaxQuantity);
        }

        throw new Error(toBusinessMessage(prepared.error?.code, prepared.error?.message, prepared.error?.details));
      }

      const unsignedTx = deserializeLegacyVersionedTransaction(fromBase64(prepared.data.transactionBase64));
      const signedTx = await signTransaction(unsignedTx);
      const signedTxBase64 = toBase64(serializeLegacyVersionedTransaction(signedTx));

      const submitResponse = await fetch("/api/purchase/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PURCHASE_TRACE_UI_ENABLED && flowId ? { "x-flow-id": flowId } : {})
        },
        body: JSON.stringify({
          attemptId: prepared.data.attemptId,
          idempotencyKey: prepared.data.idempotencyKey,
          signedTransactionBase64: signedTxBase64
        })
      });
      const submitted = await parseResponse<SubmitResponse>(submitResponse);

      if (!submitResponse.ok || !submitted.data?.txSignature) {
        throw new Error(toBusinessMessage(submitted.error?.code, submitted.error?.message));
      }

      setSubmittedSignature(submitted.data.txSignature);
      await refreshQuote(flowId);
    } catch (error) {
      if (isWalletUserRejectedError(error)) {
        setPurchaseError(
          t({
            en: "Signature request canceled in wallet.",
            es: "Cancelaste la solicitud de firma en la wallet.",
            pt: "Voce cancelou a solicitacao de assinatura na wallet."
          })
        );
        return;
      }

      setPurchaseError(
        error instanceof Error
          ? error.message
          : t({
            en: "Could not complete purchase flow.",
            es: "No se pudo completar el flujo de compra.",
            pt: "Nao foi possivel concluir o fluxo de compra."
          })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddToCart(): Promise<void> {
    setAddToCartError(null);
    setIsAddingToCart(true);

    try {
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          propertyId,
          quantity: requestedQuantity
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? "Could not add item to cart.");
      }

      router.push("/checkout");
    } catch (error) {
      setAddToCartError(
        error instanceof Error
          ? error.message
          : t({
            en: "Could not continue to checkout.",
            es: "No se pudo continuar al checkout.",
            pt: "Nao foi possivel continuar para o checkout."
          })
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/15 bg-white/[0.02] p-3">
        <p className="text-sm text-slate-200">
          {t({ en: "Mint price", es: "Precio de mint", pt: "Preco de mint" })}: <span className="font-semibold text-cyan-300">{priceLabel}</span>
        </p>
        <p className="text-sm text-slate-200">
          {t({ en: "Total", es: "Total", pt: "Total" })}: <span className="font-semibold text-cyan-300">{totalPriceLabel}</span>
        </p>
        <p className="text-xs text-slate-400">
          {t({ en: "Quantity mode", es: "Modo de cantidad", pt: "Modo de quantidade" })}: {quote?.quantityMode ?? "--"}
        </p>
        <p className="text-xs text-slate-400">
          {quote?.cacheUpdatedAt
            ? t({
              en: "Quote cache updated at",
              es: "Cache de quote actualizado en",
              pt: "Cache da cotacao atualizada em"
            })
            : t({
              en: "Quote unavailable",
              es: "Quote no disponible",
              pt: "Cotacao indisponivel"
            })}{" "}
          {quote?.cacheUpdatedAt
            ? new Date(quote.cacheUpdatedAt).toLocaleString(
              locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO"
            )
            : "--"}
        </p>
        <p className="text-xs text-slate-400">
          {t({ en: "Items remaining", es: "Items restantes", pt: "Itens restantes" })}: {quote?.itemsRemaining ?? "--"}
        </p>
      </div>

      {quoteError ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-100">{quoteError}</p>
      ) : null}

      {purchaseError ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-100">{purchaseError}</p>
      ) : null}

      {addToCartError ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-100">{addToCartError}</p>
      ) : null}

      {submittedSignature ? (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2 text-sm text-emerald-100">
          {t({
            en: "Purchase submitted:",
            es: "Compra enviada:",
            pt: "Compra enviada:"
          })}{" "}
          <a
            href={getSolscanTransactionUrl(submittedSignature)}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-emerald-200/70 underline-offset-2"
          >
            {submittedSignature.slice(0, 8)}...{submittedSignature.slice(-8)}
          </a>
        </p>
      ) : null}

      {PURCHASE_TRACE_UI_ENABLED && (lastFlowId || activeFlowId) ? (
        <p className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-2 text-xs text-cyan-100">
          {t({
            en: "Trace flow ID (current):",
            es: "Flow ID de trazado (actual):",
            pt: "Flow ID de rastreio (atual):"
          })}{" "}
          <span className="font-mono">{lastFlowId ?? activeFlowId}</span>
        </p>
      ) : null}

      <div className="rounded-xl border border-white/15 bg-white/[0.02] p-3">
        <p className="mb-2 text-xs text-slate-300">
          {t({ en: "Quantity", es: "Cantidad", pt: "Quantidade" })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            className="min-h-11 w-11 px-0"
            variant="outline"
            disabled={isLoadingQuote || isSubmitting || requestedQuantity <= 1}
            onClick={() => {
              setRequestedQuantity((current) => Math.max(1, current - 1));
            }}
          >
            -
          </Button>
          <input
            type="number"
            min={1}
            max={maxSelectableQuantity}
            value={requestedQuantity}
            className="h-11 w-24 rounded-md border border-white/20 bg-black/20 px-3 text-center text-sm text-slate-100 outline-none focus:border-cyan-400"
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isFinite(parsed)) {
                setRequestedQuantity(1);
                return;
              }

              const normalized = Math.floor(parsed);
              setRequestedQuantity(Math.max(1, Math.min(maxSelectableQuantity, normalized)));
            }}
          />
          <Button
            className="min-h-11 w-11 px-0"
            variant="outline"
            disabled={isLoadingQuote || isSubmitting || requestedQuantity >= maxSelectableQuantity}
            onClick={() => {
              setRequestedQuantity((current) => Math.min(maxSelectableQuantity, current + 1));
            }}
          >
            +
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {t({ en: "Max per order", es: "Maximo por orden", pt: "Maximo por pedido" })}: {maxSelectableQuantity}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11"
          disabled={isLoadingQuote || isSubmitting || !canAttemptPurchase}
          onClick={() => {
            void handlePurchase();
          }}
        >
          {isSubmitting
            ? t({ en: "Processing...", es: "Procesando...", pt: "Processando..." })
            : t({
              en: "Buy with crypto",
              es: "Comprar con crypto",
              pt: "Comprar com crypto"
            })}
        </Button>
        <Button
          className="min-h-11"
          variant="outline"
          disabled={isLoadingQuote || isSubmitting || isAddingToCart || !canAttemptPurchase}
          onClick={() => {
            void handleAddToCart();
          }}
        >
          {isAddingToCart
            ? t({ en: "Starting...", es: "Iniciando...", pt: "Iniciando..." })
            : t({ en: "Add to cart", es: "Agregar al carrito", pt: "Adicionar ao carrinho" })}
        </Button>
      </div>
    </div>
  );
}
