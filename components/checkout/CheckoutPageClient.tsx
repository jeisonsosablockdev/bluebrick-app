"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
};

type OrderPayload = {
  orderId: string;
  status: string;
  paymentMethod: "crypto" | "airwallex" | null;
  currency: string;
  totalAmountUsd: number;
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
  paymentMethod: "crypto" | "airwallex";
  paymentAttemptId: string;
  status: string;
  airwallex?: {
    intentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    env: "demo" | "prod";
    successUrl: string;
  };
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

declare global {
  interface Window {
    AirwallexComponentsSDK?: {
      init: (input: {
        env: "demo" | "prod";
        enabledElements: string[];
      }) => Promise<{
        payments: {
          redirectToCheckout: (input: {
            env: "demo" | "prod";
            mode: "payment";
            currency: string;
            intent_id: string;
            client_secret: string;
            successUrl: string;
          }) => void;
        };
      }>;
    };
  }
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json().catch(() => null)) as ApiResponse<T>;
}

function loadAirwallexScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.AirwallexComponentsSDK) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-airwallex-sdk='1']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Airwallex SDK.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://static.airwallex.com/components/sdk/v1/index.js";
    script.async = true;
    script.dataset.airwallexSdk = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Airwallex SDK."));
    document.head.appendChild(script);
  });
}

export function CheckoutPageClient() {
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "airwallex">("airwallex");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // HARDENING-PREPROD: remove this UI toggle and force live mode only before production release.
  const [isSandboxModeEnabled, setIsSandboxModeEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/cart", { method: "GET" });
      const payload = await parseJson<CartPayload>(response);

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Could not load cart.");
      }

      setCart(payload.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load cart.");
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const totalAmountLabel = useMemo(() => {
    if (!cart) {
      return "--";
    }

    return formatUsd(cart.totalAmountUsd);
  }, [cart]);

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
      setError(payload.error?.message ?? "Could not remove item.");
      return;
    }

    setCart(payload.data);
    setOrder(null);
  }

  async function handleCreateOrder(): Promise<void> {
    if (!cart || cart.items.length === 0) {
      setError("Cart is empty.");
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
        body: JSON.stringify({ paymentMethod })
      });

      const payload = await parseJson<OrderPayload>(response);
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Could not create order.");
      }

      setOrder(payload.data);
      setInfo(`Order ${payload.data.orderId} created. Starting payment...`);

      const startPaymentResponse = await fetch("/api/checkout/payment/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: payload.data.orderId,
          paymentMethod,
          runtimeMode: isSandboxModeEnabled ? "sandbox" : "live"
        })
      });

      const startPaymentPayload = await parseJson<StartPaymentPayload>(startPaymentResponse);
      if (!startPaymentResponse.ok || !startPaymentPayload.data) {
        throw new Error(startPaymentPayload.error?.message ?? "Could not start payment.");
      }

      if (startPaymentPayload.data.paymentMethod === "crypto") {
        setInfo(startPaymentPayload.data.crypto?.message ?? "Crypto flow is available from property detail for now.");
        return;
      }

      const awx = startPaymentPayload.data.airwallex;
      if (!awx) {
        throw new Error("Airwallex payload was not returned.");
      }

      await loadAirwallexScript();
      if (!window.AirwallexComponentsSDK) {
        throw new Error("Airwallex SDK is not available.");
      }

      const sdk = await window.AirwallexComponentsSDK.init({
        env: awx.env,
        enabledElements: ["payments"]
      });

      sdk.payments.redirectToCheckout({
        env: awx.env,
        mode: "payment",
        currency: awx.currency,
        intent_id: awx.intentId,
        client_secret: awx.clientSecret,
        successUrl: awx.successUrl
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not continue checkout.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 text-sm text-slate-300">
        Loading cart...
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

        {!cart || cart.items.length === 0 ? (
          <p className="text-sm text-slate-300">Your cart is empty. Add items from property details.</p>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.propertyId} className="rounded-lg border border-white/15 bg-white/[0.02] p-3">
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-400">{item.locationLabel}</p>
                <p className="mt-1 text-sm text-slate-200">{item.quantity} x {formatUsd(item.unitPriceUsd)} = {formatUsd(item.lineTotalUsd)}</p>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Payment method</h2>
          <Button
            className="min-h-11"
            variant={isSandboxModeEnabled ? "outline" : "ghost"}
            onClick={() => {
              setIsSandboxModeEnabled((current) => !current);
            }}
          >
            {isSandboxModeEnabled ? "Modo pruebas: ON (Sandbox)" : "Modo pruebas: OFF (Live)"}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="min-h-11"
            variant={paymentMethod === "airwallex" ? "primary" : "outline"}
            onClick={() => {
              setPaymentMethod("airwallex");
            }}
          >
            Card / Account (Airwallex)
          </Button>
          <Button
            className="min-h-11"
            variant={paymentMethod === "crypto" ? "primary" : "outline"}
            onClick={() => {
              setPaymentMethod("crypto");
            }}
          >
            Crypto
          </Button>
        </div>

        <Button
          className="min-h-11 w-full"
          disabled={isProcessing || !cart || cart.items.length === 0}
          onClick={() => {
            void handleCreateOrder();
          }}
        >
          {isProcessing ? "Processing..." : "Create order and continue"}
        </Button>

        {order ? (
          <p className="text-xs text-slate-400">
            Current order: {order.orderId} ({order.status})
          </p>
        ) : null}
      </Card>
    </div>
  );
}
