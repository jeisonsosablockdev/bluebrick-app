"use client";

import { useMemo } from "react";
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

export function AppProviders({ locale, children }: AppProvidersProps) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <LocaleProvider initialLocale={locale}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </LocaleProvider>
  );
}
