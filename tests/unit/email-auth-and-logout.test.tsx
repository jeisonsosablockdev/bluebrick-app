/**
 * @file tests/unit/email-auth-and-logout.test.tsx
 * @description Layer 1, 2, 3 & QA: Comprehensive TDD Unit & Integration Test Suite for BBC-10
 * (Universal Email Authentication & Institutional Dashboard Header Logout Flow).
 * @spec BBC-10
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { InvestmentDashboard } from "@/components/dashboard/investment-dashboard";
import { I18nProvider } from "@/features/i18n/presentation/components/i18n-provider";
import { es } from "@/features/i18n/domain/dictionaries/es";
import { en } from "@/features/i18n/domain/dictionaries/en";
import { pt } from "@/features/i18n/domain/dictionaries/pt";
import { DictionarySchema } from "@/features/i18n/domain/schemas/i18n-dictionary-schema";
import type { DashboardViewModel } from "@/lib/types/dashboard";

// Mock server actions from @/lib/auth/actions
vi.mock("@/lib/auth/actions", () => ({
  signOutAction: vi.fn().mockResolvedValue(undefined),
  signInWithEmailAction: vi.fn().mockResolvedValue(undefined),
  signInWithGoogleAction: vi.fn().mockResolvedValue(undefined),
}));

// Mock mock dashboard data
const mockDashboardData: DashboardViewModel = {
  investor: {
    id: "user_sofia_martinez",
    email: "sofia.martinez@bluebrick.investments",
    firstName: "Sofía",
    lastName: "Martínez",
    avatarUrl: null,
    tier: "Inversionista Privado",
    createdAt: new Date("2021-01-01"),
  },
  properties: [
    {
      id: "prop-1",
      propertyId: "prop-1",
      propertyName: "Torre Reforma 404",
      propertyType: "Comercial",
      city: "CDMX",
      investedAmount: 50000,
      roi: 14.5,
      status: "activa",
      timing: "18 meses restantes",
      monthsLeft: 18,
      gradient: "linear-gradient(135deg, #173F30 0%, #0A1220 100%)",
    },
  ],
  totalInvested: 50000,
  weightedRoi: 14.5,
  activeCount: 1,
  concludedCount: 0,
  reinvestmentOpportunities: [],
};

describe("BBC-10: Universal Email Authentication & Dashboard Logout (@spec BBC-10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Landing Page Universal Email Login Card", () => {
    it("should render universal email login button and NOT render Google-specific button", () => {
      // Step 1: Render InvestorLoginCard with Spanish i18n context
      render(
        <I18nProvider initialLocale="es">
          <InvestorLoginCard />
        </I18nProvider>
      );

      // Step 2: Verify universal email login button exists
      const emailLoginBtn = screen.getByRole("link", {
        name: /Continuar con Correo Electrónico|Iniciar sesión con Correo Electrónico|Entrar con Correo Electrónico/i,
      });
      expect(emailLoginBtn).toBeInTheDocument();
      expect(emailLoginBtn).toHaveAttribute("href", "/auth/login");

      // Step 3: Verify Google-specific text is completely eliminated
      expect(screen.queryByText(/Iniciar sesión con Google/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
    });

    it("should localize email login button in English and Portuguese", () => {
      // English rendering
      const { unmount } = render(
        <I18nProvider initialLocale="en">
          <InvestorLoginCard />
        </I18nProvider>
      );
      expect(
        screen.getByRole("link", { name: /Sign in with Email|Continue with Email/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
      unmount();

      // Portuguese rendering
      render(
        <I18nProvider initialLocale="pt">
          <InvestorLoginCard />
        </I18nProvider>
      );
      expect(
        screen.getByRole("link", { name: /Entrar com E-mail|Continuar com E-mail/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
    });
  });

  describe("2. Dashboard Header Logout Button & Responsive Mobile Design", () => {
    it("should render the logout button in the dashboard top navigation header", () => {
      // Step 1: Render InvestmentDashboard with i18n provider
      render(
        <I18nProvider initialLocale="es">
          <InvestmentDashboard initialData={mockDashboardData} />
        </I18nProvider>
      );

      // Step 2: Assert presence of logout button with accessible label
      const logoutBtn = screen.getByRole("button", { name: /Cerrar sesión|Salir|Logout/i });
      expect(logoutBtn).toBeInTheDocument();
    });

    it("should invoke signOutAction when the logout button is clicked", async () => {
      const { signOutAction } = await import("@/lib/auth/actions");

      // Step 1: Render dashboard
      render(
        <I18nProvider initialLocale="es">
          <InvestmentDashboard initialData={mockDashboardData} />
        </I18nProvider>
      );

      // Step 2: Click logout button
      const logoutBtn = screen.getByRole("button", { name: /Cerrar sesión|Salir|Logout/i });
      fireEvent.click(logoutBtn);

      // Step 3: Verify server action execution
      expect(signOutAction).toHaveBeenCalledTimes(1);
    });

    it("should localize logout button label in English and Portuguese", () => {
      // English
      const { unmount } = render(
        <I18nProvider initialLocale="en">
          <InvestmentDashboard initialData={mockDashboardData} />
        </I18nProvider>
      );
      expect(
        screen.getByRole("button", { name: /Sign out|Log out|Logout/i })
      ).toBeInTheDocument();
      unmount();

      // Portuguese
      render(
        <I18nProvider initialLocale="pt">
          <InvestmentDashboard initialData={mockDashboardData} />
        </I18nProvider>
      );
      expect(
        screen.getByRole("button", { name: /Sair|Encerrar sessão|Logout/i })
      ).toBeInTheDocument();
    });
  });

  describe("3. Dictionary Schema & Translation Tokens Parity", () => {
    it("should validate all dictionaries contain emailLoginButton and logout keys", () => {
      // Validate schema parsing
      expect(DictionarySchema.safeParse(es).success).toBe(true);
      expect(DictionarySchema.safeParse(en).success).toBe(true);
      expect(DictionarySchema.safeParse(pt).success).toBe(true);

      // Check specific tokens
      expect(es.loginCard.emailLoginButton).toBeTruthy();
      expect(en.loginCard.emailLoginButton).toBeTruthy();
      expect(pt.loginCard.emailLoginButton).toBeTruthy();

      expect(es.common.logout).toBeTruthy();
      expect(en.common.logout).toBeTruthy();
      expect(pt.common.logout).toBeTruthy();
    });
  });
});
