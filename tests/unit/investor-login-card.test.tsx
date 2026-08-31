/**
 * @file tests/unit/investor-login-card.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for InvestorLoginCard Redesign (BBC-13).
 * @spec BBC-13-INVESTOR-LOGIN-REDESIGN
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { I18nProvider } from "@/features/i18n";
import { es } from "@/features/i18n/domain/dictionaries/es";
import { en } from "@/features/i18n/domain/dictionaries/en";
import { pt } from "@/features/i18n/domain/dictionaries/pt";

describe("BBC-13: Investor Login Redesign Unit Suite (@spec BBC-13-INVESTOR-LOGIN-REDESIGN)", () => {
  beforeEach(() => {
    // Clean up DOM between test executions
  });

  describe("1. Real Authentication Presentation & Removal of Mock Persona (@spec BBC-13-REQ-1, BBC-13-REQ-2)", () => {
    it("should render exclusive investor access headline and private portal badge in Spanish", () => {
      // Step 1: Render in Spanish
      render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert exclusive access headline and private portal badge
      expect(screen.getByText(es.loginCard.exclusiveAccessTitle)).toBeInTheDocument();
      expect(screen.getByText(es.loginCard.privatePortalBadge)).toBeInTheDocument();
      expect(screen.getByText(es.loginCard.headerTitle)).toBeInTheDocument();
    });

    it("should NOT render any mock persona elements (Sofía Martínez, SM initials, Demo Verificada, or 1-click dashboard bypass)", () => {
      // Step 1: Render in Spanish
      render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert absence of mock artifacts
      expect(screen.queryByText(/Sofía Martínez/i)).not.toBeInTheDocument();
      expect(screen.queryByText("SM")).not.toBeInTheDocument();
      expect(screen.queryByText(/Demo Verificada/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Verified Demo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Entrar al Dashboard/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Enter Dashboard/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Entrar al Dashboard/i })).not.toBeInTheDocument();
    });
  });

  describe("2. WorkOS Primary Action & Provider Compatibility Chips (@spec BBC-13-REQ-3, BBC-13-REQ-4)", () => {
    it("should render primary CTA email login button pointing strictly to /auth/login", () => {
      // Step 1: Render card
      render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert email CTA button presence and link destination
      const loginLink = screen.getByRole("link", { name: new RegExp(es.loginCard.emailLoginButton, "i") });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/auth/login");
    });

    it("should render multi-provider compatibility indicators (Google, Microsoft, Apple, Yahoo)", () => {
      // Step 1: Render card
      const { container } = render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert provider indicators exist in DOM
      expect(container.querySelector('[data-provider="google"]')).toBeInTheDocument();
      expect(container.querySelector('[data-provider="microsoft"]')).toBeInTheDocument();
      expect(container.querySelector('[data-provider="apple"]')).toBeInTheDocument();
      expect(container.querySelector('[data-provider="yahoo"]')).toBeInTheDocument();
    });

    it("should render institutional disclaimer note without mentioning demo or federated jargon", () => {
      // Step 1: Render card
      render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert institutional disclaimer
      expect(screen.getByText(es.loginCard.disclaimerNote)).toBeInTheDocument();
      expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/federado/i)).not.toBeInTheDocument();
    });
  });

  describe("3. Multi-Language Synchronization (@spec BBC-13-REQ-6)", () => {
    it("should localize all card tokens correctly in English", () => {
      // Step 1: Render in English
      render(
        <I18nProvider initialLocale="en">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert English tokens
      expect(screen.getByText(en.loginCard.headerTitle)).toBeInTheDocument();
      expect(screen.getByText(en.loginCard.exclusiveAccessTitle)).toBeInTheDocument();
      expect(screen.getByText(en.loginCard.privatePortalBadge)).toBeInTheDocument();
      expect(screen.getByText(en.loginCard.disclaimerNote)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp(en.loginCard.emailLoginButton, "i") })).toHaveAttribute(
        "href",
        "/auth/login"
      );
    });

    it("should localize all card tokens correctly in Portuguese", () => {
      // Step 1: Render in Portuguese
      render(
        <I18nProvider initialLocale="pt">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Assert Portuguese tokens
      expect(screen.getByText(pt.loginCard.headerTitle)).toBeInTheDocument();
      expect(screen.getByText(pt.loginCard.exclusiveAccessTitle)).toBeInTheDocument();
      expect(screen.getByText(pt.loginCard.privatePortalBadge)).toBeInTheDocument();
      expect(screen.getByText(pt.loginCard.disclaimerNote)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp(pt.loginCard.emailLoginButton, "i") })).toHaveAttribute(
        "href",
        "/auth/login"
      );
    });
  });
});
