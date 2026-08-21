"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Admin Shell Layout
 * Component: AdminShell
 * Description: Master administrative navigation shell with clean, sober dark aesthetics,
 *              matching the profile design language with zero emoticons.
 * =========================================================================================
 */

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { Suspense, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import {
  AdminNavigationSectionBlock,
  buildAdminNavigation,
  resolveCurrentAdminLabel
} from "@/features/admin/presentation/admin-shell-navigation";
import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { RouteTransition } from "@/components/motion/route-transition";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  authenticatedPublicKey: string;
  walletLabel: string;
  children: ReactNode;
};

function AdminSidebarHeader({
  title,
  walletLabel,
  action
}: {
  title: string;
  walletLabel: string;
  action?: ReactNode;
}): ReactElement {
  return (
    <div className="space-y-3 border-b border-slate-800 pb-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-200">{title}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400 font-mono">Devnet</span>
          </div>
        </div>
        {action}
      </div>

      <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Operator</div>
        <div className="mt-0.5 font-mono text-xs text-slate-300 truncate">{walletLabel}</div>
      </div>
    </div>
  );
}

export function AdminShell({ authenticatedPublicKey, walletLabel, children }: AdminShellProps): ReactElement {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const adminNav = useMemo(() => buildAdminNavigation(t), [t]);
  const currentLabel = useMemo(() => resolveCurrentAdminLabel(pathname, adminNav), [adminNav, pathname]);

  return (
    <main className="min-h-screen overflow-x-hidden py-6 md:py-8 bg-slate-950 text-slate-100">
      <div className="mx-auto mb-4 max-w-6xl px-4 md:px-6">
        <Suspense fallback={null}>
          <MainTopNavigationModal
            initialAuth={{
              authenticated: true,
              pubkey: authenticatedPublicKey,
              role: "admin"
            }}
          />
        </Suspense>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:grid lg:grid-cols-[240px,1fr] lg:gap-6">
        {/* Desktop Sober Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-xl">
            <AdminSidebarHeader
              title={t({ en: "Admin Console", es: "Consola Admin", pt: "Console Admin" })}
              walletLabel={walletLabel}
            />
            <div className="no-scrollbar mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
              {adminNav.map((section) => (
                <AdminNavigationSectionBlock
                  key={section.section}
                  section={section}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="space-y-6">
          <header className="space-y-3 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                aria-label={t({ en: "Open admin menu", es: "Abrir menu admin", pt: "Abrir menu admin" })}
                className="min-h-9 px-3 text-xs lg:hidden border border-slate-800 bg-slate-900"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                {t({ en: "Menu", es: "Menú", pt: "Menu" })}
              </Button>
              <div className="ml-auto rounded-full border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300">
                {walletLabel}
              </div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-slate-400">
              <span className="text-slate-400">{t({ en: "Admin", es: "Admin", pt: "Admin" })}</span>
              <span className="px-2 text-slate-600">/</span>
              <span className="text-slate-200">{currentLabel}</span>
            </nav>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t({ en: "Administrative operations", es: "Operación Administrativa", pt: "Operacao Administrativa" })}
              </p>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight sm:text-2xl">{currentLabel}</h1>
            </div>
          </header>

          <RouteTransition routeKey={pathname} className="space-y-6" mode="navigation-origin">
            {children}
          </RouteTransition>
        </section>
      </div>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            aria-label={t({ en: "Close admin menu", es: "Cerrar menu admin", pt: "Fechar menu admin" })}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
            type="button"
          />
          <aside className="relative z-10 flex h-full w-[85%] max-w-xs flex-col border-r border-slate-800 bg-slate-950 p-4">
            <AdminSidebarHeader
              title={t({ en: "Admin Console", es: "Consola Admin", pt: "Console Admin" })}
              walletLabel={walletLabel}
              action={(
                <Button className="h-8 px-2 text-xs" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                  ✕
                </Button>
              )}
            />

            <div className="no-scrollbar mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
              {adminNav.map((section) => (
                <AdminNavigationSectionBlock
                  key={`mobile-${section.section}`}
                  section={section}
                  pathname={pathname}
                  onNavigate={() => setIsDrawerOpen(false)}
                  sectionKeyPrefix="mobile"
                />
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
