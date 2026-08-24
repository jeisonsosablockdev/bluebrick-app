/**
 * @file apps/web/src/app/page.tsx
 * @description Layer 1: Presentation - Starter Landing Page.
 * Showcases Solana Devnet connection status, 4-layer architecture, and starter cards.
 */

import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card } from "@/components/ui/card";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

export default function HomePage() {
  // Step 1: Resolve active RPC endpoint info
  const rpcUrl = getSolanaRpcUrl();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-12 md:p-24">
      {/* Top Header Navigation */}
      <header className="flex w-full max-w-5xl items-center justify-between border-b border-neutral-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20" />
          <h1 className="text-xl font-bold tracking-tight text-white">Next.js + Solana</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <WalletConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="my-16 flex max-w-3xl flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Devnet Ready
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-neutral-100">
          Modular Functional Web3 Starter
        </h2>
        <p className="mt-4 text-base text-neutral-400 sm:text-lg">
          Powered by Next.js 16 App Router, Tailwind CSS, Solana Web3, and 4-Layer Architecture with
          Double-Gatekeeper Autonomous Governance.
        </p>
      </section>

      {/* Feature / Layer Cards */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-200">1. Presentation</h3>
          <p className="mt-2 text-xs text-neutral-400">
            UI components & App Router routes strictly decoupled from database and RPC connections.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-neutral-200">2. Application</h3>
          <p className="mt-2 text-xs text-neutral-400">
            Custom hooks (`useSolanaWallet`) and client state management.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-neutral-200">3. Domain Pipelines</h3>
          <p className="mt-2 text-xs text-neutral-400">
            Pure transaction construction pipelines and business rules.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-neutral-200">4. Infrastructure</h3>
          <p className="mt-2 text-xs text-neutral-400">
            Solana RPC client connector targeting:
            <span className="mt-1 block font-mono text-[10px] text-blue-400 break-all">{rpcUrl}</span>
          </p>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-neutral-500">
        Monorepo Starter &bull; Devnet Only &bull; Ready for Development
      </footer>
    </main>
  );
}
