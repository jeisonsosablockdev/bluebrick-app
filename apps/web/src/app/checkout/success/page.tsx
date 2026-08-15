import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout Success",
  description: "Payment redirect confirmation page pending asynchronous webhook finalization.",
  path: "/checkout/success",
  section: "checkout",
  explicitNoIndex: true
});

type SuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = readValue(params.orderId)?.trim() || "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-bold text-white">Payment submitted</h1>
        <p className="text-sm text-slate-300">
          We received the payment redirect response. Final order status is confirmed asynchronously by webhook.
        </p>
        {orderId ? (
          <p className="text-sm text-slate-300">Order ID: <span className="font-mono">{orderId}</span></p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href="/checkout" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Back to checkout
          </Link>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Marketplace
          </Link>
        </div>
      </Card>
    </main>
  );
}
