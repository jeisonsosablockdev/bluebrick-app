"use client";

import { useCallback, useMemo } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import type { AppLocale } from "@/lib/i18n";
import { getSolanaRpcUrl } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

type AppProvidersProps = {
  locale: AppLocale;
  children: React.ReactNode;
};

function isUserRejectedWalletError(error: WalletError): boolean {
  const message = error.message.toLowerCase();
  return message.includes("user rejected") || message.includes("rejected the request");
}

export function AppProviders({ locale, children }: AppProvidersProps) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const handleWalletError = useCallback((error: WalletError) => {
    if (isUserRejectedWalletError(error)) {
      return;
    }
  }, []);

  return (
    <LocaleProvider initialLocale={locale}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false} onError={handleWalletError}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </LocaleProvider>
  );
}
