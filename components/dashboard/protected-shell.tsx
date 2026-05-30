"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { WalletModal } from "@/components/WalletModal";
import { OnboardingRewardReminder } from "@/components/dashboard/onboarding-reward-reminder";
import { QuickTourOverlay } from "@/components/dashboard/quick-tour-overlay";
import { RouteTransition } from "@/components/motion/route-transition";
import { FooterSection } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserRole } from "@/lib/rbac";
import type { LocaleText } from "@/lib/i18n";
import { createPanelMotionVariants, MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";
import { areDevOnlyModulesVisible } from "@/lib/release-module-visibility";

type ProtectedShellProps = {
  authenticatedPublicKey: string | null;
  authenticatedRole?: UserRole;
  accountAuthenticated: boolean;
  walletAuthenticated: boolean;
  federatedEmail: string | null;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  releaseControlled?: boolean;
};

type TranslateNavFn = (text: LocaleText) => string;

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/protected") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function buildProtectedNavigation(t: TranslateNavFn): NavItem[] {
  const showDevOnlyModules = areDevOnlyModulesVisible();

  return [
    {
      href: "/protected",
      label: t({ en: "Overview", es: "Resumen", pt: "Resumo" }),
      title: t({ en: "Overview", es: "Resumen", pt: "Resumo" }),
      description: t({
        en: "General account summary and main KPIs.",
        es: "Resumen general de cuenta y KPIs principales.",
        pt: "Resumo geral da conta e principais KPIs."
      })
    },
    {
      href: "/protected/referrals",
      label: t({ en: "Referral Rewards", es: "Recompensas por referidos", pt: "Recompensas por indicacoes" }),
      title: t({ en: "Referral Rewards", es: "Recompensas por referidos", pt: "Recompensas por indicacoes" }),
      description: t({
        en: "Share your referral code, track invitee progress, and review earned rewards.",
        es: "Comparte tu codigo de referido, sigue el progreso de invitados y revisa recompensas ganadas.",
        pt: "Compartilhe seu codigo de indicacao, acompanhe o progresso dos convidados e revise recompensas ganhas."
      })
    },
    {
      href: "/protected/portfolio",
      label: t({ en: "My Portfolio", es: "Mi Portfolio", pt: "Meu Portfolio" }),
      title: t({ en: "My Portfolio", es: "Mi Portfolio", pt: "Meu Portfolio" }),
      description: t({
        en: "Review your Fractions, valuation and position status.",
        es: "Consulta tus Fracciones, valor y estado de posiciones.",
        pt: "Consulte seus Frações, valor e estado das posicoes."
      }),
      releaseControlled: true
    },
    {
      href: "/protected/stake",
      label: t({ en: "Stake / Unstake", es: "Stake / Unstake", pt: "Stake / Unstake" }),
      title: t({ en: "Stake / Unstake", es: "Stake / Unstake", pt: "Stake / Unstake" }),
      description: t({
        en: "Manage staking status for your assets.",
        es: "Gestiona el estado de staking de tus activos.",
        pt: "Gerencie o status de staking dos seus ativos."
      }),
      releaseControlled: true
    },
    {
      href: "/protected/rentas",
      label: t({ en: "Yield / Claim", es: "Rentas / Claim", pt: "Rendas / Claim" }),
      title: t({ en: "Yield / Claim", es: "Rentas / Claim", pt: "Rendas / Claim" }),
      description: t({
        en: "Track available yield and claim actions.",
        es: "Monitorea rentas disponibles y acciones de claim.",
        pt: "Monitore rendas disponiveis e acoes de claim."
      }),
      releaseControlled: true
    },
    {
      href: "/protected/historial",
      label: t({ en: "History", es: "Historial", pt: "Historico" }),
      title: t({ en: "History", es: "Historial", pt: "Historico" }),
      description: t({
        en: "Audit recent events and account movements.",
        es: "Audita eventos recientes y movimientos de cuenta.",
        pt: "Audite eventos recentes e movimentacoes da conta."
      }),
      releaseControlled: true
    },
    {
      href: "/protected/perfil",
      label: t({ en: "Profile / Support", es: "Perfil / Soporte", pt: "Perfil / Suporte" }),
      title: t({ en: "Profile / Support", es: "Perfil / Soporte", pt: "Perfil / Suporte" }),
      description: t({
        en: "Manage profile settings and support channels.",
        es: "Administra configuracion de perfil y canales de soporte.",
        pt: "Gerencie configuracoes de perfil e canais de suporte."
      })
    }
  ].filter((item) => showDevOnlyModules || !item.releaseControlled);
}

export function isProtectedRouteActive(pathname: string, href: string): boolean {
  return isActive(pathname, href);
}

export function resolveCurrentProtectedModule(pathname: string, navigation: NavItem[]): NavItem {
  const active = navigation.find((item) => isProtectedRouteActive(pathname, item.href));
  return active ?? navigation[0];
}

export function ProtectedShell({
  authenticatedPublicKey,
  authenticatedRole,
  accountAuthenticated,
  walletAuthenticated,
  federatedEmail,
  children
}: ProtectedShellProps): ReactElement {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const dashboardNav = useMemo<NavItem[]>(() => buildProtectedNavigation(t), [t]);

  const currentModule = useMemo<NavItem>(() => {
    return resolveCurrentProtectedModule(pathname, dashboardNav);
  }, [dashboardNav, pathname]);

  return (
    <main className="min-h-screen overflow-x-hidden py-6 md:py-8">
      <div className="mx-auto mb-4 max-w-6xl px-4 md:px-6">
        <Suspense fallback={null}>
          <WalletModal
            initialAuth={{
              authenticated: walletAuthenticated,
              accountAuthenticated,
              federatedAuthenticated: Boolean(federatedEmail),
              walletAuthenticated,
              pubkey: authenticatedPublicKey,
              role: authenticatedRole,
              email: federatedEmail,
              authMethod: walletAuthenticated
                ? (federatedEmail ? "hybrid" : "wallet")
                : "federated"
            }}
          />
        </Suspense>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:grid lg:grid-cols-[260px,1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <Card className="glass-surface dashboard-sidebar sticky top-6 h-[calc(100vh-3rem)] space-y-4 bg-transparent p-3">
            <div>
              <p className="dashboard-sidebar-title px-2 text-xs uppercase tracking-[0.2em]">
                {t({ en: "Navigation", es: "Navegacion", pt: "Navegacao" })}
              </p>
            </div>
            <nav className="space-y-1">
              {dashboardNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                      active ? "dashboard-sidebar-link-active" : "dashboard-sidebar-link"
                    }`}
                    title={item.label}
                  >
                    <span className="block w-full truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>

        <section className="space-y-5">
          <header className="space-y-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                aria-label={t({ en: "Open dashboard menu", es: "Abrir menu del dashboard", pt: "Abrir menu do dashboard" })}
                className="min-h-11 min-w-11 px-0 lg:hidden"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                {t({ en: "Menu", es: "Menu", pt: "Menu" })}
              </Button>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-white">
                  {authenticatedPublicKey
                    ? truncatePublicKey(authenticatedPublicKey)
                    : federatedEmail ?? t({ en: "Account session", es: "Sesion de cuenta", pt: "Sessao de conta" })}
                </span>
              </div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-white/60">
              <span className="text-white/80">{t({ en: "Dashboard", es: "Dashboard", pt: "Dashboard" })}</span>
              <span className="px-1">/</span>
              <span>{currentModule.title}</span>
            </nav>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Investor Dashboard", es: "Dashboard de inversionista", pt: "Dashboard do investidor" })}
              </p>
              <h1 className="text-2xl font-semibold text-white">{currentModule.title}</h1>
              <p className="mt-1 text-sm text-white/70">{currentModule.description}</p>
            </div>
          </header>

          <RouteTransition routeKey={pathname} className="space-y-5" mode="navigation-origin">
            <OnboardingRewardReminder />
            {children}
          </RouteTransition>
        </section>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
        <FooterSection />
      </div>

      <AnimatePresence>
        {isDrawerOpen ? (
          <motion.div
            key="protected-mobile-nav"
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
              className="glass-surface dashboard-sidebar relative h-full w-[84%] max-w-xs rounded-r-3xl border-l-0 bg-transparent p-4"
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
              <nav className="space-y-1">
                {dashboardNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={`mobile-${item.href}`}
                      href={item.href}
                      className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${
                        active ? "dashboard-sidebar-link-active" : "dashboard-sidebar-link"
                      }`}
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <QuickTourOverlay />
    </main>
  );
}
