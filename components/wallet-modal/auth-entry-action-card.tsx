import { useState, type ReactElement, type ReactNode } from "react";

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
  "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border px-5 text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 border-white/25 bg-transparent text-white hover:bg-white/10 active:border-transparent active:bg-gradientPrimary active:shadow-glow disabled:cursor-not-allowed disabled:opacity-60";

type AuthEntryAction = "mail" | "wallet";

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
  const [activeAction, setActiveAction] = useState<AuthEntryAction | null>(null);

  const getButtonClassName = (action: AuthEntryAction): string => {
    return cn(
      ACTION_BUTTON_CLASS_NAME,
      activeAction === action && "border-transparent bg-gradientPrimary shadow-glow"
    );
  };

  const handleActionClick = (action: AuthEntryAction, onClick: () => void): void => {
    setActiveAction(action);
    onClick();
  };

  return (
    <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 sm:p-6">
      <p className="text-base font-semibold text-white md:text-xl md:leading-tight lg:text-2xl lg:leading-tight">
        {title}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label={title}>
        <button type="button" onClick={() => handleActionClick("mail", onMailClick)} disabled={disabled} className={getButtonClassName("mail")}>
          {mailIcon}
          <span>{mailLabel}</span>
        </button>
        <button type="button" onClick={() => handleActionClick("wallet", onWalletClick)} disabled={disabled} className={getButtonClassName("wallet")}>
          {walletIcon}
          <span>{walletLabel}</span>
        </button>
      </div>
    </div>
  );
}
