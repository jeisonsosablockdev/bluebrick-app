/**
 * @file tests/unit/landing-mock-login.test.ts
 * @description Layer 1 & QA: Behavioral Unit Test Suite for Landing Page & Investor Entrypoint.
 * @spec BBC-6-SPEC-1
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

// Imports from the Presentation Layer
import { LandingHero } from "@/components/landing/landing-hero";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { BlueBrickMark } from "@/components/dashboard/blue-brick-mark";
import { I18nProvider } from "@/features/i18n";
import { ThemeProvider } from "@/components/theme";

describe("SPEC-1: Landing Page & Investor Entrypoint (@spec BBC-6-SPEC-1)", () => {
  describe("BlueBrickMark Branding", () => {
    it("should render the iconic 4-bar rotated branding emblem", () => {
      // Arrange & Act
      const { container } = render(React.createElement(BlueBrickMark));

      // Assert: 4 spans for bars with proper gradient styling
      const spans = container.querySelectorAll("span");
      expect(spans.length).toBe(4);
    });
  });

  describe("LandingHero Component", () => {
    it("should display the platform value proposition and luxury header", () => {
      // Arrange & Act
      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <LandingHero />
          </I18nProvider>
        </ThemeProvider>
      );

      // Assert
      expect(screen.getByText(/BLUE BRICK/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Plataforma Privada de Inversión Inmobiliaria/i)
      ).toBeInTheDocument();
    });
  });

  describe("InvestorLoginCard Component", () => {
    it("should present the exclusive investor access card and email login link targeting /auth/login", () => {
      // Arrange & Act
      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <InvestorLoginCard />
          </I18nProvider>
        </ThemeProvider>
      );

      // Assert: Exclusive access headline & private portal badge
      expect(screen.getByText(/Acceso exclusivo para inversionistas/i)).toBeInTheDocument();
      expect(screen.getByText(/Portal Privado/i)).toBeInTheDocument();

      // Assert: Primary CTA targeting /auth/login
      const loginButton = screen.getByRole("link", { name: /Ingresa con tu correo/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute("href", "/auth/login");
    });
  });
});
