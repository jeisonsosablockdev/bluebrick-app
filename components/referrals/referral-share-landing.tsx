"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReferralShareLandingProps = {
  referralCode: string;
  referrerWalletDisplay: string;
};

function buildReferralTarget(referralCode: string): string {
  return `/?ref=${encodeURIComponent(referralCode)}`;
}

export function ReferralShareLanding({
  referralCode,
  referrerWalletDisplay
}: ReferralShareLandingProps): ReactElement {
  const router = useRouter();
  const targetPath = buildReferralTarget(referralCode);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      router.replace(targetPath);
    }, 1200);

    return () => window.clearTimeout(timerId);
  }, [router, targetPath]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8 md:px-6">
      <Card className="w-full space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Referral Access</p>
        <h1 className="text-3xl font-semibold text-white">Invitation from {referrerWalletDisplay}</h1>
        <p className="text-sm text-white/75">
          Your referral link is being forwarded to the BRIDS onboarding flow. If the redirect does not happen automatically,
          continue manually below.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/55">Referral code</p>
          <code className="mt-2 block text-sm font-semibold text-white">{referralCode}</code>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={targetPath}>
            <Button className="min-h-11">Continue to BRIDS</Button>
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            href="/"
          >
            Return home
          </Link>
        </div>
      </Card>
    </main>
  );
}
