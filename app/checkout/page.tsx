import type { Metadata } from "next";
import { Suspense } from "react";

import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { H1, Lead } from "@/components/ui/typography";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/seo";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout",
  description: "Secure checkout flow for cart confirmation and payment handoff.",
  path: "/checkout",
  section: "checkout",
  explicitNoIndex: true
});

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>
      </WalletRuntimeProvider>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          {localize(DEFAULT_LOCALE, { en: "Checkout", es: "Checkout", pt: "Checkout" })}
        </p>
        <H1 className="text-white">
          {localize(DEFAULT_LOCALE, {
            en: "Cart and payment",
            es: "Carrito y pago",
            pt: "Carrinho e pagamento"
          })}
        </H1>
        <Lead>
          {localize(DEFAULT_LOCALE, {
            en: "Select your payment method: Crypto (existing flow) or Card/Account via Airwallex.",
            es: "Selecciona tu metodo de pago: Crypto (flujo actual) o Tarjeta/Cuenta via Airwallex.",
            pt: "Selecione seu metodo de pagamento: Crypto (fluxo atual) ou Cartao/Conta via Airwallex."
          })}
        </Lead>
      </section>

      <section className="mt-6">
        <CheckoutPageClient />
      </section>
    </main>
  );
}
