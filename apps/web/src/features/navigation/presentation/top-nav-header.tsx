"use client";

/**
 * features/navigation/presentation/top-nav-header.tsx
 * Layer 1 — Presentation: sticky header JSX.
 * Extracted from main-top-navigation-modal.tsx.
 *
 * Renders: logo, primary nav, mobile menu toggle, theme/lang,
 * wallet CTA button, Phantom open pill, and mobile nav expansion.
 *
 * Zero business logic — all values passed as props.
 */

import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { recordNavigationOriginFromClick } from "@/components/motion/navigation-origin";
import { PHANTOM_INSTALL_URL } from "@/components/wallet-modal/constants";
import { WalletCtaIcon } from "@/features/navigation/presentation/nav-modal-icons";
import { isActivePath } from "@/features/navigation/application/nav-modal-utils";
import {
  PRIMARY_NAV_LINK_BASE_CLASSNAME,
  PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME,
} from "@/features/navigation/domain/nav-modal-constants";
import { cn } from "@/lib/utils";
import type { NavEntry, Translate } from "@/features/navigation/domain/nav-modal-types";

type TopNavHeaderProps = {
  pathname: string;
  t: Translate;
  menuEntries: NavEntry[];
  headerWalletCtaLabel: string;
  accountStatusText: string;
  hasAccountSession: boolean;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenWalletModal: () => void;
  // Phantom mobile
  shouldShowPhantomOpenPill: boolean;
  showPhantomFallback: boolean;
  onOpenInPhantom: () => void;
  onClosePhantomFallback: () => void;
};

export function TopNavHeader({
  pathname,
  t,
  menuEntries,
  headerWalletCtaLabel,
  accountStatusText,
  hasAccountSession,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onOpenWalletModal,
  shouldShowPhantomOpenPill,
  showPhantomFallback,
  onOpenInPhantom,
  onClosePhantomFallback,
}: TopNavHeaderProps) {
  return (
    <header className="sticky top-3 z-40 mb-5 w-full max-w-5xl mx-auto px-6 lg:px-12">
      <div className="landing-header-surface px-3 py-3 md:px-4">
        <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="brand-pill landing-header-pill inline-flex min-h-11 shrink-0 items-center rounded-full px-3 transition"
            aria-label={t({ en: "Back to home", es: "Volver al inicio", pt: "Voltar para inicio" })}
          >
            <Image
              src="/brand/brids-mark.svg"
              alt="BRIDS mark"
              width={24}
              height={24}
              className="sm:hidden"
              style={{ height: "24px", width: "auto" }}
              priority
            />
            <Image src="/brand/brids-logo.svg" alt="BRIDS" width={124} height={41} className="hidden h-7 w-auto sm:block" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden min-w-0 flex-1 sm:block" aria-label="Primary">
            <div className="no-scrollbar -my-2 flex items-center gap-2 overflow-x-auto py-2">
              {menuEntries.map((entry) => {
                const active = isActivePath(pathname, entry.href);
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={(event) => recordNavigationOriginFromClick(event, entry.href)}
                    className={cn(
                      PRIMARY_NAV_LINK_BASE_CLASSNAME,
                      PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME,
                      active
                        ? "landing-header-active-pill bg-gradientPrimary text-white"
                        : "landing-header-pill text-white/80 hover:text-white"
                    )}
                  >
                    {entry.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="landing-header-pill inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:text-white sm:hidden"
            onClick={onToggleMobileMenu}
            aria-label={
              isMobileMenuOpen
                ? t({ en: "Close navigation menu", es: "Cerrar menu de navegacion", pt: "Fechar menu de navegacao" })
                : t({ en: "Open navigation menu", es: "Abrir menu de navegacion", pt: "Abrir menu de navegacao" })
            }
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? "×" : "☰"}
          </button>

          {/* Theme + Language (desktop) */}
          <div className="hidden shrink-0 sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden shrink-0 sm:block">
            <LanguageSwitcher />
          </div>

          {/* Wallet CTA button */}
          <div className="group relative shrink-0">
            <Button
              data-testid="wallet-modal-open-button"
              onClick={onOpenWalletModal}
              className="min-h-11 px-4"
            >
              <span className="inline-flex items-center gap-2">
                <WalletCtaIcon />
                <span>{headerWalletCtaLabel}</span>
              </span>
            </Button>
            {hasAccountSession ? (
              <div
                className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-max max-w-[22rem] rounded-xl border border-white/20 bg-slate-950/90 px-3 py-2 text-xs text-white/80 opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition group-hover:opacity-100 group-focus-within:opacity-100"
                role="status"
              >
                {accountStatusText}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile menu expansion */}
        {isMobileMenuOpen ? (
          <nav className="relative z-10 mt-3 flex flex-wrap items-center gap-2 sm:hidden" aria-label="Mobile navigation">
            <div className="w-full">
              <ThemeToggle />
            </div>
            <div className="w-full">
              <LanguageSwitcher />
            </div>
            {menuEntries.map((entry) => {
              const active = isActivePath(pathname, entry.href);
              return (
                <Link
                  key={`mobile-${entry.href}`}
                  href={entry.href}
                  onClick={(event) => recordNavigationOriginFromClick(event, entry.href)}
                  className={cn(
                    PRIMARY_NAV_LINK_BASE_CLASSNAME,
                    PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME,
                    active
                      ? "landing-header-active-pill bg-gradientPrimary text-white"
                      : "landing-header-pill text-white/80 hover:text-white"
                  )}
                >
                  {entry.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* Phantom open pill (mobile) */}
        {shouldShowPhantomOpenPill ? (
          <div className="relative z-10 mt-3 sm:hidden">
            <button
              type="button"
              onClick={onOpenInPhantom}
              className="quick-tour-pill inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-medium"
            >
              {t({
                en: "Do you use Phantom? Open in app.",
                es: "¿Usas Phantom? Abrir en la app.",
                pt: "Usa Phantom? Abrir no app.",
              })}
            </button>
          </div>
        ) : null}

        {/* Phantom fallback (mobile) */}
        {showPhantomFallback && shouldShowPhantomOpenPill ? (
          <div className="relative z-10 mt-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100 sm:hidden">
            <p>
              {t({
                en: "Could not open Phantom automatically.",
                es: "No se pudo abrir Phantom automaticamente.",
                pt: "Nao foi possivel abrir o Phantom automaticamente.",
              })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={PHANTOM_INSTALL_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200/50 px-4 font-medium text-amber-50 transition hover:bg-amber-200/10"
              >
                {t({ en: "Install Phantom", es: "Instalar Phantom", pt: "Instalar Phantom" })}
              </a>
              <button
                type="button"
                onClick={onClosePhantomFallback}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-4 font-medium text-white/90 transition hover:bg-white/10"
              >
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
