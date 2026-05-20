import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthEntryActionCardProps = {
  title: string;
  mailLabel: string;
  walletLabel: string;
  mailIcon: ReactNode;
  walletIcon: ReactNode;
  onMailClick: () => void;
  onWalletClick: () => void;
  disabled?: boolean;
};

const ACTION_BUTTON_CLASS_NAME =
  "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border px-5 text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 border-transparent bg-gradientPrimary text-white shadow-glow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthEntryActionCard({
  title,
  mailLabel,
  walletLabel,
  mailIcon,
  walletIcon,
  onMailClick,
  onWalletClick,
  disabled = false
}: AuthEntryActionCardProps): ReactElement {
  return (
    <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 sm:p-6">
      <p className="text-base font-semibold text-white md:text-xl md:leading-tight lg:text-2xl lg:leading-tight">
        {title}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label={title}>
        <button type="button" onClick={onMailClick} disabled={disabled} className={cn(ACTION_BUTTON_CLASS_NAME)}>
          {mailIcon}
          <span>{mailLabel}</span>
        </button>
        <button type="button" onClick={onWalletClick} disabled={disabled} className={cn(ACTION_BUTTON_CLASS_NAME)}>
          {walletIcon}
          <span>{walletLabel}</span>
        </button>
      </div>
    </div>
  );
}
