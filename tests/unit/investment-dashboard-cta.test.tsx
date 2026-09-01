/**
 * @file tests/unit/investment-dashboard-cta.test.tsx
 * @description Layer 1: Presentation - Component test suite for Investment Dashboard CTA button.
 * Validates lead generation integration with submitInvestmentLeadAction, reactive states,
 * accessible feedback alerts, and rate limiting feedback under BBC-17.
 * @spec BBC-17
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvestmentDashboard } from "@/components/dashboard/investment-dashboard";
import { submitInvestmentLeadAction } from "@/lib/auth/investment-actions";
import { I18nProvider } from "@/features/i18n/presentation/components/i18n-provider";
import { ThemeProvider } from "@/components/theme";
import type { DashboardViewModel } from "@/lib/types/dashboard";

// Mock server auth actions to avoid next/cache runtime import in unit tests
vi.mock("@/lib/auth/actions", () => ({
  signOutAction: vi.fn().mockResolvedValue(undefined),
  signInWithEmailAction: vi.fn().mockResolvedValue(undefined),
  signInWithGoogleAction: vi.fn().mockResolvedValue(undefined),
}));

// Mock investment lead server action for presentation layer testing
vi.mock("@/lib/auth/investment-actions", () => ({
  submitInvestmentLeadAction: vi.fn(),
}));

/**
 * Fixture: Canonical valid dashboard view model for component rendering.
 */
const mockDashboardData: Readonly<DashboardViewModel> = {
  investor: {
    id: "usr_01HXYZ123456789",
    email: "sofia.martinez@bluebrick.investments",
    firstName: "Sofía",
    lastName: "Martínez",
    avatarUrl: null,
    tier: "BRONZE",
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
  },
  totalInvested: 150000,
  weightedRoi: 14.5,
  activeCount: 1,
  concludedCount: 0,
  properties: [
    {
      id: "prop-1",
      propertyId: "prop-1",
      propertyName: "Torre Alvear",
      propertyType: "Residencial",
      city: "Buenos Aires",
      investedAmount: 150000,
      roi: 14.5,
      status: "activa",
      timing: "18 meses restantes",
      gradient: "linear-gradient(135deg,#1E3A8A,#172554)",
      monthsLeft: 18,
      phases: [],
    },
  ],
  reinvestmentOpportunities: [
    {
      id: "opp-1",
      title: "Residencial Palmas",
      city: "Miami, FL",
      projectedRoi: 16.2,
      minInvestment: 25000,
      daysLeft: 14,
      gradient: "linear-gradient(135deg,#10B981,#047857)",
    },
  ],
};

/**
 * Helper to render InvestmentDashboard within required Theme and I18n context providers.
 *
 * @param data Optional dashboard view model overrides.
 * @returns Render result with testing utilities.
 */
function renderDashboard(data: DashboardViewModel = mockDashboardData as DashboardViewModel) {
  return render(
    <ThemeProvider>
      <I18nProvider initialLocale="es">
        <InvestmentDashboard initialData={data} />
      </I18nProvider>
    </ThemeProvider>
  );
}

describe("SPEC BBC-17: Investment Dashboard CTA Lead Generation (@spec BBC-17)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock matchMedia for responsive / motion hooks
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("should invoke submitInvestmentLeadAction and render success feedback when clicking 'Invertir ahora'", async () => {
    // Arrange: Mock successful lead submission response contract
    // Step 1: Setup mock server action response
    const mockSuccessMessage =
      "Solicitud de inversión enviada con éxito. Nuestro equipo se comunicará a la brevedad.";
    vi.mocked(submitInvestmentLeadAction).mockResolvedValueOnce({
      success: true,
      message: mockSuccessMessage,
    });

    // Step 2: Render dashboard with initial data
    renderDashboard();

    // Step 3: Locate reinvestment CTA button
    const ctaButton = screen.getByRole("button", { name: /invertir ahora/i });
    expect(ctaButton).toBeDefined();
    expect(ctaButton).not.toBeDisabled();

    // Act: Click the reinvestment CTA button
    // Step 4: Dispatch click event
    fireEvent.click(ctaButton);

    // Assert: Verify action invocation and reactive UI updates
    // Step 5: Verify server action was called with source metadata
    expect(submitInvestmentLeadAction).toHaveBeenCalledTimes(1);
    expect(submitInvestmentLeadAction).toHaveBeenCalledWith({
      metadata: { source: "dashboard_reinvestment_cta" },
    });

    // Step 6: Verify success feedback is rendered with accessible role
    await waitFor(() => {
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
      expect(feedback.textContent).toContain(mockSuccessMessage);
      expect(feedback.getAttribute("aria-live")).toBe("polite");
    });
  });

  it("should render error feedback when submitInvestmentLeadAction returns rate limit cooldown", async () => {
    // Arrange: Mock cooldown rate-limiting error response contract
    // Step 1: Setup mock server action returning active cooldown error
    const mockErrorMessage =
      "Por favor espere antes de enviar una nueva solicitud de inversión.";
    vi.mocked(submitInvestmentLeadAction).mockResolvedValueOnce({
      success: false,
      message: mockErrorMessage,
      error: "RATE_LIMIT_COOLDOWN_ACTIVE: Submission cooldown period has not elapsed",
    });

    // Step 2: Render dashboard
    renderDashboard();

    // Step 3: Locate CTA button
    const ctaButton = screen.getByRole("button", { name: /invertir ahora/i });

    // Act: Click CTA button
    // Step 4: Dispatch click event
    fireEvent.click(ctaButton);

    // Assert: Verify server action called and error feedback rendered
    // Step 5: Verify server action dispatch
    expect(submitInvestmentLeadAction).toHaveBeenCalledTimes(1);

    // Step 6: Verify error alert message displayed
    await waitFor(() => {
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
      expect(feedback.textContent).toContain(mockErrorMessage);
    });
  });

  it("should disable button and display loading spinner while lead submission is pending", async () => {
    // Arrange: Mock deferred server action response to hold pending state
    // Step 1: Create promise resolver to control response resolution
    let resolveSubmission: (value: { success: boolean; message: string }) => void = () => {};
    const deferredPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      resolveSubmission = resolve;
    });
    vi.mocked(submitInvestmentLeadAction).mockReturnValueOnce(deferredPromise);

    // Step 2: Render dashboard
    renderDashboard();
    const ctaButton = screen.getByRole("button", { name: /invertir ahora/i });

    // Act: Click CTA button to transition to pending state
    // Step 3: Dispatch click event
    fireEvent.click(ctaButton);

    // Assert: Verify loading state indicators
    // Step 4: Verify button is disabled and shows loading indicator
    expect(ctaButton).toBeDisabled();
    expect(screen.getByText(/enviando solicitud\.\.\./i)).toBeInTheDocument();
    expect(ctaButton.getAttribute("aria-busy")).toBe("true");

    // Act: Resolve pending submission
    // Step 5: Complete async resolution
    resolveSubmission({
      success: true,
      message: "Lead processed",
    });

    // Assert: Verify button re-enables after completion
    // Step 6: Verify restoration of interactive controls
    await waitFor(() => {
      expect(ctaButton).not.toBeDisabled();
      expect(screen.getByText("Lead processed")).toBeInTheDocument();
    });
  });

  it("should gracefully handle unexpected network exception and render error message", async () => {
    // Arrange: Mock unexpected network rejection
    // Step 1: Configure mock rejection
    vi.mocked(submitInvestmentLeadAction).mockRejectedValueOnce(
      new Error("Servicio no disponible temporalmente.")
    );

    // Step 2: Render dashboard
    renderDashboard();
    const ctaButton = screen.getByRole("button", { name: /invertir ahora/i });

    // Act: Click CTA button
    // Step 3: Dispatch click event
    fireEvent.click(ctaButton);

    // Assert: Verify graceful exception presentation
    // Step 4: Verify error status announcement
    await waitFor(() => {
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
      expect(feedback.textContent).toContain("Servicio no disponible temporalmente.");
    });

    // Step 5: Verify button is re-enabled following exception
    expect(ctaButton).not.toBeDisabled();
  });
});
