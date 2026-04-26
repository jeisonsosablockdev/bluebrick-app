"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import {
  AdminNavigation,
  buildAdminNavigation,
  resolveCurrentAdminLabel
} from "@/components/admin/admin-shell-navigation";
import { WalletModal } from "@/components/WalletModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminShellProps = {
  authenticatedPublicKey: string;
  walletLabel: string;
  children: ReactNode;
};

export function AdminShell({ authenticatedPublicKey, walletLabel, children }: AdminShellProps): ReactElement {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const adminNav = useMemo(() => buildAdminNavigation(t), [t]);

  const currentLabel = useMemo(() => resolveCurrentAdminLabel(pathname, adminNav), [adminNav, pathname]);

  return (
    <main className="min-h-screen overflow-x-hidden py-6 md:py-8">
      <div className="mx-auto mb-4 max-w-6xl px-4 md:px-6">
        <WalletModal
          initialAuth={{
            authenticated: true,
            pubkey: authenticatedPublicKey,
            role: "admin"
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:grid lg:grid-cols-[270px,1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <Card className="glass-surface admin-sidebar sticky top-6 h-[calc(100vh-3rem)] space-y-4 overflow-y-auto bg-transparent p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Admin Console", es: "Consola Admin", pt: "Console Admin" })}
              </p>
              <p className="admin-sidebar-wallet mt-1 text-xs">{walletLabel}</p>
            </div>
            <AdminNavigation pathname={pathname} sections={adminNav} />
          </Card>
        </aside>

        <section className="space-y-5">
          <header className="space-y-3 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                aria-label={t({ en: "Open admin menu", es: "Abrir menu admin", pt: "Abrir menu admin" })}
                className="min-h-11 min-w-11 px-0 lg:hidden"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                {t({ en: "Menu", es: "Menu", pt: "Menu" })}
              </Button>
              <div className="ml-auto rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80">{walletLabel}</div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-white/60">
              <span className="text-white/80">{t({ en: "Admin", es: "Admin", pt: "Admin" })}</span>
              <span className="px-1">/</span>
              <span>{currentLabel}</span>
            </nav>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Administrative operations", es: "Operacion administrativa", pt: "Operacao administrativa" })}
              </p>
              <h1 className="text-2xl font-semibold text-white">{currentLabel}</h1>
            </div>
          </header>

          {children}
        </section>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t({ en: "Close admin menu", es: "Cerrar menu admin", pt: "Fechar menu admin" })}
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsDrawerOpen(false)}
            type="button"
          />
          <aside className="glass-surface admin-sidebar relative h-full w-[88%] max-w-sm overflow-y-auto rounded-r-3xl border-l-0 bg-transparent p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Admin Console", es: "Consola Admin", pt: "Console Admin" })}
              </p>
              <Button className="min-h-11" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>

            <AdminNavigation
              onNavigate={() => setIsDrawerOpen(false)}
              pathname={pathname}
              sectionKeyPrefix="mobile"
              sections={adminNav}
            />
          </aside>
        </div>
      )}
    </main>
  );
}
