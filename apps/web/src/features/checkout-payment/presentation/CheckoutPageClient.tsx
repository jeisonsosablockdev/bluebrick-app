"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatUsdByLocale,
  type OnboardingRewardStatus
} from "@/lib/onboarding-reward-copy";

type CartItem = {
  propertyId: string;
  title: string;
  imageUrl: string;
  locationLabel: string;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
};

type CartPayload = {
  cartId: string;
  walletPublicKey: string;
  items: CartItem[];
  totalItems: number;
  totalAmountUsd: number;
  onboardingReward: {
    id: string;
    status: OnboardingRewardStatus;
    rewardAmountUsdSnapshot: number;
    shouldShowReminder: boolean;
  } | null;
};

type OrderPayload = {
  orderId: string;
  status: string;
  paymentMethod: "crypto" | "airwallex" | null;
  currency: string;
  subtotalAmountUsd: number;
  discountAmountUsd: number;
  totalAmountUsd: number;
  appliedOnboardingRewardId: string | null;
  expiresAt: string | null;
  items: Array<{
    propertyId: string;
    quantity: number;
    unitPriceUsd: number;
    lineTotalUsd: number;
  }>;
};

type StartPaymentPayload = {
  orderId: string;
  paymentMethod: "crypto";
  paymentAttemptId: string;
  status: string;
  crypto?: {
    mode: "existing_flow";
    message: string;
  };
};

type ApiResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json().catch(() => null)) as ApiResponse<T>;
}

export function CheckoutPageClient() {
  const { locale, t } = useI18n();
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyOnboardingReward, setApplyOnboardingReward] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/cart", { method: "GET" });
      const payload = await parseJson<CartPayload>(response);

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message
          ?? t({ en: "Could not load cart.", es: "No se pudo cargar el carrito.", pt: "Nao foi possivel carregar o carrinho." })
        );
      }

      setCart(payload.data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t({ en: "Could not load cart.", es: "No se pudo cargar el carrito.", pt: "Nao foi possivel carregar o carrinho." })
      );
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const totalAmountLabel = useMemo(() => {
    if (!cart) {
      return "--";
    }

    const rewardDiscount =
      applyOnboardingReward && cart.onboardingReward?.status === "earned"
        ? Math.min(cart.onboardingReward.rewardAmountUsdSnapshot, cart.totalAmountUsd)
        : 0;
    return formatUsdByLocale(Math.max(0, cart.totalAmountUsd - rewardDiscount), locale);
  }, [applyOnboardingReward, cart, locale]);

  async function handleRemoveItem(propertyId: string): Promise<void> {
    setError(null);
    setInfo(null);

    const response = await fetch("/api/checkout/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ propertyId })
    });

    const payload = await parseJson<CartPayload>(response);
    if (!response.ok || !payload.data) {
      setError(
        payload.error?.message
        ?? t({ en: "Could not remove item.", es: "No se pudo quitar el item.", pt: "Nao foi possivel remover o item." })
      );
      return;
    }

    setCart(payload.data);
    setOrder(null);
  }

  async function handleCreateOrder(): Promise<void> {
    if (!cart || cart.items.length === 0) {
      setError(t({ en: "Cart is empty.", es: "El carrito está vacío.", pt: "O carrinho está vazio." }));
      return;
    }

    setIsProcessing(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/checkout/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentMethod: "crypto", applyOnboardingReward })
      });

      const payload = await parseJson<OrderPayload>(response);
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message
          ?? t({ en: "Could not create order.", es: "No se pudo crear la orden.", pt: "Nao foi possivel criar o pedido." })
        );
      }

      setOrder(payload.data);
      setInfo(
        t({
          en: `Order ${payload.data.orderId} created. Starting payment...`,
          es: `Orden ${payload.data.orderId} creada. Iniciando pago...`,
          pt: `Pedido ${payload.data.orderId} criado. Iniciando pagamento...`
        })
      );

      const startPaymentResponse = await fetch("/api/checkout/payment/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: payload.data.orderId,
          paymentMethod: "crypto"
        })
      });

      const startPaymentPayload = await parseJson<StartPaymentPayload>(startPaymentResponse);
      if (!startPaymentResponse.ok || !startPaymentPayload.data) {
        throw new Error(
          startPaymentPayload.error?.message
          ?? t({ en: "Could not start payment.", es: "No se pudo iniciar el pago.", pt: "Nao foi possivel iniciar o pagamento." })
        );
      }

      setInfo(
        startPaymentPayload.data.crypto?.message
        ?? t({
          en: "Crypto flow is available from property detail for now.",
          es: "El flujo crypto está disponible por ahora desde el detalle de la propiedad.",
          pt: "O fluxo cripto está disponível por enquanto a partir do detalhe da propriedade."
        })
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t({ en: "Could not continue checkout.", es: "No se pudo continuar con el checkout.", pt: "Nao foi possivel continuar com o checkout." })
      );
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 text-sm text-slate-300">
        {t({ en: "Loading cart...", es: "Cargando carrito...", pt: "Carregando carrinho..." })}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>
      ) : null}
      {info ? (
        <p className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">{info}</p>
      ) : null}

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Cart</h2>
          <span className="text-sm text-slate-300">{totalAmountLabel}</span>
        </div>

        {cart?.onboardingReward?.status === "earned" ? (
          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              {t({ en: "Onboarding credit", es: "Crédito de onboarding", pt: "Crédito de onboarding" })}
            </p>
            <p className="mt-1 text-sm text-white">
              {t({
                en: `You have ${formatUsdByLocale(cart.onboardingReward.rewardAmountUsdSnapshot, locale)} available for a one-time discount on this purchase.`,
                es: `Tienes ${formatUsdByLocale(cart.onboardingReward.rewardAmountUsdSnapshot, locale)} disponibles para un descuento único en esta compra.`,
                pt: `Você tem ${formatUsdByLocale(cart.onboardingReward.rewardAmountUsdSnapshot, locale)} disponíveis para um desconto único nesta compra.`
              })}
            </p>
            <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-white/85">
              <input
                checked={applyOnboardingReward}
                className="h-4 w-4"
                onChange={(event) => setApplyOnboardingReward(event.target.checked)}
                type="checkbox"
              />
              {t({
                en: "Apply onboarding credit to this order",
                es: "Aplicar crédito de onboarding a esta orden",
                pt: "Aplicar crédito de onboarding neste pedido"
              })}
            </label>
          </div>
        ) : null}

        {!cart || cart.items.length === 0 ? (
          <p className="text-sm text-slate-300">Your cart is empty. Add items from property details.</p>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.propertyId} className="rounded-lg border border-white/15 bg-white/[0.02] p-3">
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-400">{item.locationLabel}</p>
                <p className="mt-1 text-sm text-slate-200">{item.quantity} x {formatUsdByLocale(item.unitPriceUsd, locale)} = {formatUsdByLocale(item.lineTotalUsd, locale)}</p>
                <Button
                  className="mt-2 min-h-11"
                  variant="outline"
                  onClick={() => {
                    void handleRemoveItem(item.propertyId);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-4">
        {cart ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-3">
              <span>Subtotal</span>
              <span>{formatUsdByLocale(cart.totalAmountUsd, locale)}</span>
            </div>
            {applyOnboardingReward && cart.onboardingReward?.status === "earned" ? (
              <div className="flex items-center justify-between gap-3 text-emerald-200">
                <span>{t({ en: "Onboarding discount", es: "Descuento de onboarding", pt: "Desconto de onboarding" })}</span>
                <span>-{formatUsdByLocale(Math.min(cart.onboardingReward.rewardAmountUsdSnapshot, cart.totalAmountUsd), locale)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2 font-semibold text-white">
              <span>Total due</span>
              <span>{totalAmountLabel}</span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Payment method</h2>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100">
            {t({ en: "Crypto only", es: "Solo crypto", pt: "Somente crypto" })}
          </span>
        </div>

        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
          {t({
            en: "Card payments are temporarily unavailable. Checkout remains active for crypto orders.",
            es: "Los pagos con tarjeta están temporalmente inactivos. El checkout sigue activo para órdenes crypto.",
            pt: "Os pagamentos com cartão estão temporariamente indisponíveis. O checkout continua ativo para pedidos crypto."
          })}
        </p>

        <Button
          className="min-h-11 w-full"
          disabled={isProcessing || !cart || cart.items.length === 0}
          onClick={() => {
            void handleCreateOrder();
          }}
        >
          {isProcessing
            ? t({ en: "Processing...", es: "Procesando...", pt: "Processando..." })
            : t({ en: "Create crypto order and continue", es: "Crear orden crypto y continuar", pt: "Criar pedido crypto e continuar" })}
        </Button>

        {order ? (
          <p className="text-xs text-slate-400">
            {t({
              en: `Current order: ${order.orderId} (${order.status}) • subtotal ${formatUsdByLocale(order.subtotalAmountUsd, locale)} • discount ${formatUsdByLocale(order.discountAmountUsd, locale)} • total ${formatUsdByLocale(order.totalAmountUsd, locale)}`,
              es: `Orden actual: ${order.orderId} (${order.status}) • subtotal ${formatUsdByLocale(order.subtotalAmountUsd, locale)} • descuento ${formatUsdByLocale(order.discountAmountUsd, locale)} • total ${formatUsdByLocale(order.totalAmountUsd, locale)}`,
              pt: `Pedido atual: ${order.orderId} (${order.status}) • subtotal ${formatUsdByLocale(order.subtotalAmountUsd, locale)} • desconto ${formatUsdByLocale(order.discountAmountUsd, locale)} • total ${formatUsdByLocale(order.totalAmountUsd, locale)}`
            })}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
