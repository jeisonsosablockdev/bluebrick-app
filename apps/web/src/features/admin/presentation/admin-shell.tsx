"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Admin Shell Layout
 * Component: AdminShell
 * Description: Master administrative navigation shell matching the exact visual design,
 *              glassmorphism tokens, and sidebar pill styling of /profile (protected-shell).
 * =========================================================================================
 */

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import {
  AdminNavigation,
  buildAdminNavigation,
  resolveCurrentAdminLabel
} from "@/features/admin/presentation/admin-shell-navigation";
import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { RouteTransition } from "@/components/motion/route-transition";
import { FooterSection } from "@/features/landing/presentation/footer";
import { Button } from "@/components/ui/button";
import { createPanelMotionVariants, MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";

type AdminShellProps = {
  authenticatedPublicKey: string;
  walletLabel: string;
  children: ReactNode;
};

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export function AdminShell({ authenticatedPublicKey, walletLabel: _walletLabel, children }: AdminShellProps): ReactElement {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const adminNav = useMemo(() => buildAdminNavigation(t), [t]);
  const currentLabel = useMemo(() => resolveCurrentAdminLabel(pathname, adminNav), [adminNav, pathname]);

  return (
    <main className="min-h-screen overflow-x-hidden py-6 md:py-8">
      <div className="mx-auto mb-4 max-w-6xl px-4 md:px-6">
        <Suspense fallback={null}>
          <MainTopNavigationModal
            initialAuth={{
              authenticated: true,
              walletAuthenticated: true,
              accountAuthenticated: true,
              pubkey: authenticatedPublicKey,
              role: "admin"
            }}
          />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 md:px-6 lg:grid lg:grid-cols-[260px,minmax(0,1fr)] lg:gap-6">
        {/* Desktop Sidebar — 100% Identical to /profile */}
        <aside className="hidden lg:block">
          <div className="dashboard-sidebar marketplace-depth-card sticky top-6 h-[calc(100vh-3rem)] space-y-4 border-none bg-transparent p-3 rounded-[28px] backdrop-blur-xl">
            <div>
              <p className="dashboard-sidebar-title px-2 text-xs uppercase tracking-[0.2em]">
                {t({ en: "Navigation", es: "Navegacion", pt: "Navegacao" })}
              </p>
            </div>
            <AdminNavigation pathname={pathname} sections={adminNav} />
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="min-w-0 space-y-5">
          <header className="space-y-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                aria-label={t({ en: "Open admin menu", es: "Abrir menu admin", pt: "Abrir menu admin" })}
                className="min-h-11 min-w-11 px-0 lg:hidden"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                {t({ en: "Menu", es: "Menu", pt: "Menu" })}
              </Button>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-white">
                  {truncatePublicKey(authenticatedPublicKey)}
                </span>
              </div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-white/60">
              <span className="text-white/80">{t({ en: "Admin", es: "Admin", pt: "Admin" })}</span>
              <span className="px-1">/</span>
              <span>{currentLabel}</span>
            </nav>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Administrative Console", es: "Consola de Administracion", pt: "Console de Administracao" })}
              </p>
              <h1 className="text-2xl font-semibold text-white">{currentLabel}</h1>
              <p className="mt-1 text-sm text-white/70">
                {t({
                  en: "Administrative operations and protocol governance.",
                  es: "Operaciones administrativas y gobernanza del protocolo.",
                  pt: "Operacoes administrativas e governanca do protocolo."
                })}
              </p>
            </div>
          </header>

          <RouteTransition routeKey={pathname} className="min-w-0 space-y-5" mode="navigation-origin">
            {children}
          </RouteTransition>
        </section>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
        <FooterSection />
      </div>

      {/* Mobile Drawer with Motion */}
      <AnimatePresence>
        {isDrawerOpen ? (
          <motion.div
            key="admin-mobile-nav"
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_FAST_OPACITY_TRANSITION}
          >
            <motion.button
              aria-label={t({ en: "Close menu", es: "Cerrar menu", pt: "Fechar menu" })}
              className="absolute inset-0 bg-black/70"
              onClick={() => setIsDrawerOpen(false)}
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOTION_FAST_OPACITY_TRANSITION}
            />
            <motion.aside
              className="dashboard-sidebar marketplace-depth-card relative h-full w-[84%] max-w-xs rounded-r-3xl border-none bg-transparent p-4 backdrop-blur-xl"
              variants={createPanelMotionVariants()}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="dashboard-sidebar-title text-xs uppercase tracking-[0.2em]">
                  {t({ en: "Navigation", es: "Navegacion", pt: "Navegacao" })}
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
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
