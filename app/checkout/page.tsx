import { WalletModal } from "@/components/WalletModal";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { H1, Lead } from "@/components/ui/typography";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import { getRoleForWallet } from "@/lib/rbac";

export default async function CheckoutPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();
  const locale = await getServerLocale();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <WalletModal
        initialAuth={{
          authenticated: Boolean(authenticatedPublicKey),
          pubkey: authenticatedPublicKey,
          role: authenticatedPublicKey ? getRoleForWallet(authenticatedPublicKey) : undefined
        }}
      />

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          {localize(locale, { en: "Checkout", es: "Checkout", pt: "Checkout" })}
        </p>
        <H1 className="text-white">
          {localize(locale, {
            en: "Cart and payment",
            es: "Carrito y pago",
            pt: "Carrinho e pagamento"
          })}
        </H1>
        <Lead>
          {localize(locale, {
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
