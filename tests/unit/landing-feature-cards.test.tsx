/**
 * @file tests/unit/landing-feature-cards.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for Landing Feature Cards Grid (BBC-20).
 * @spec BBC-20-LANDING-CARDS-REORGANIZATION
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { LandingFeatureCards } from "@/components/landing/landing-feature-cards";
import { I18nProvider } from "@/features/i18n";
import { ThemeProvider } from "@/components/theme";

describe("BBC-20: Landing Feature Cards Grid (@spec BBC-20-LANDING-CARDS-REORGANIZATION)", () => {
  describe("1. 2x2 Grid Composition & Value Pillars (@spec BBC-20-REQ-1)", () => {
    it("should render exactly 4 informative cards in the 2x2 grid", () => {
      // Step 1: Render in Spanish
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      // Step 2: Assert presence of the 4 cards by data-testid or role
      const cards = container.querySelectorAll("[data-feature-card]");
      expect(cards.length).toBe(4);
    });
  });

  describe("2. Card 1: Acceso Exclusivo & Private Portal Badge (@spec BBC-20-REQ-2)", () => {
    it("should display exclusive access title, management subtitle, and green portal badge in Spanish", () => {
      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Acceso Exclusivo/i)).toBeInTheDocument();
      expect(screen.getByText(/Gestione sus inversiones/i)).toBeInTheDocument();
      expect(screen.getByText(/Portal Privado/i)).toBeInTheDocument();
    });
  });

  describe("3. Card 2: Consultar Rendimiento (@spec BBC-20-REQ-3)", () => {
    it("should display Consultar Rendimiento title and performance indicator icon", () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Consultar Rendimiento/i)).toBeInTheDocument();
      expect(container.querySelector('[data-icon="performance"]')).toBeInTheDocument();
    });
  });

  describe("4. Card 3: Monitorear Distribuciones (@spec BBC-20-REQ-4)", () => {
    it("should display Monitorear Distribuciones title and distributions indicator icon", () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Monitorear Distribuciones/i)).toBeInTheDocument();
      expect(container.querySelector('[data-icon="distributions"]')).toBeInTheDocument();
    });
  });

  describe("5. Card 4: Reinvertir Capital (@spec BBC-20-REQ-5)", () => {
    it("should display Reinvertir Capital title and partnership indicator icon", () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Reinvertir Capital/i)).toBeInTheDocument();
      expect(container.querySelector('[data-icon="reinvest"]')).toBeInTheDocument();
    });
  });

  describe("6. Purely Informative Presentation (@spec BBC-20-REQ-6)", () => {
    it("should NOT contain interactive hyperlinks or buttons in feature cards (purely informative)", () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      const links = container.querySelectorAll("a");
      const buttons = container.querySelectorAll("button");
      expect(links.length).toBe(0);
      expect(buttons.length).toBe(0);
    });
  });

  describe("7. Multi-language Localization (ES / EN / PT) (@spec BBC-20-REQ-7)", () => {
    it("should localize card titles when rendered in English", () => {
      render(
        <ThemeProvider>
          <I18nProvider initialLocale="en">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Exclusive Access/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage your investments/i)).toBeInTheDocument();
      expect(screen.getByText(/Private Portal/i)).toBeInTheDocument();
      expect(screen.getByText(/Check Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitor Distributions/i)).toBeInTheDocument();
      expect(screen.getByText(/Reinvest Capital/i)).toBeInTheDocument();
    });

    it("should localize card titles when rendered in Portuguese", () => {
      render(
        <ThemeProvider>
          <I18nProvider initialLocale="pt">
            <LandingFeatureCards />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByText(/Acesso Exclusivo/i)).toBeInTheDocument();
      expect(screen.getByText(/Gerencie seus investimentos/i)).toBeInTheDocument();
      expect(screen.getByText(/Portal Privado/i)).toBeInTheDocument();
      expect(screen.getByText(/Consultar Rendimento/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitorar Distribuições/i)).toBeInTheDocument();
      expect(screen.getByText(/Reinvestir Capital/i)).toBeInTheDocument();
    });
  });
});
