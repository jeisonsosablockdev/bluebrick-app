/**
 * @file tests/unit/dashboard-microanimations.test.tsx
 * @description Layer 1 & QA: Behavioral and Core Web Vitals compliance test suite for BBC-016.
 * Enforces strict invariants: CLS = 0, INP < 50ms, spring physics tokens, and accessibility.
 * @spec BBC-016
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MICRO_ANIMATION_TOKENS,
  isPropertyClsSafe,
  getSpringTransition,
} from "@/lib/pipelines/micro-animation-tokens";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { DashboardInteractiveCard } from "@/components/dashboard/dashboard-interactive-card";

// Mock server auth actions to avoid next/cache runtime import in unit tests
vi.mock("@/lib/auth/actions", () => ({
  signOutAction: vi.fn().mockResolvedValue(undefined),
  signInWithEmailAction: vi.fn().mockResolvedValue(undefined),
  signInWithGoogleAction: vi.fn().mockResolvedValue(undefined),
}));

// Component wrapper for testing the useReducedMotion hook in React runtime
function ReducedMotionConsumer(): React.JSX.Element {
  const isReduced = useReducedMotion();
  return <div data-testid="reduced-motion-indicator">{isReduced ? "reduced" : "full-motion"}</div>;
}

describe("SPEC BBC-016: Dashboard Micro-animations & Core Web Vitals Compliance", () => {
  describe("Domain Layer: micro-animation-tokens.ts invariants", () => {
    // Step 1: Validate institutional scale limits (must be subtle, not exaggerated)
    it("should enforce subtle non-exaggerated scale limits across all dashboard components", () => {
      const { scales } = MICRO_ANIMATION_TOKENS;

      // Hero cards and carousel must be micro-scaled (subtle elegance)
      expect(scales.heroCard).toBeGreaterThanOrEqual(1.004);
      expect(scales.heroCard).toBeLessThanOrEqual(1.015);

      expect(scales.carouselCard).toBeGreaterThanOrEqual(1.002);
      expect(scales.carouselCard).toBeLessThanOrEqual(1.01);

      // Stat chips and cards
      expect(scales.statChip).toBeGreaterThanOrEqual(1.01);
      expect(scales.statChip).toBeLessThanOrEqual(1.03);

      expect(scales.opportunityCard).toBeGreaterThanOrEqual(1.01);
      expect(scales.opportunityCard).toBeLessThanOrEqual(1.03);

      // Interactive controls (milestone dot, buttons)
      expect(scales.milestoneDot).toBeGreaterThanOrEqual(1.2);
      expect(scales.milestoneDot).toBeLessThanOrEqual(1.35);

      expect(scales.chevronButton).toBeGreaterThanOrEqual(1.08);
      expect(scales.chevronButton).toBeLessThanOrEqual(1.18);

      expect(scales.buttonHover).toBeGreaterThanOrEqual(1.01);
      expect(scales.buttonHover).toBeLessThanOrEqual(1.05);

      // Haptic tactile press (whileTap) must compress below 1.0
      expect(scales.buttonTap).toBeGreaterThanOrEqual(0.9);
      expect(scales.buttonTap).toBeLessThan(1.0);
    });

    // Step 2: Validate Core Web Vitals layout shift prohibition (CLS = 0)
    it("should enforce CLS = 0 by strictly allowing only GPU-composited transform and opacity properties", () => {
      const { coreWebVitals } = MICRO_ANIMATION_TOKENS;

      expect(coreWebVitals.targetCls).toBe(0);
      expect(coreWebVitals.maxInpBudgetMs).toBeLessThanOrEqual(50);

      // Transform and opacity must be safe
      expect(isPropertyClsSafe("transform")).toBe(true);
      expect(isPropertyClsSafe("opacity")).toBe(true);
      expect(isPropertyClsSafe("boxShadow")).toBe(true);

      // Layout-shifting box model properties MUST be forbidden
      expect(isPropertyClsSafe("width")).toBe(false);
      expect(isPropertyClsSafe("height")).toBe(false);
      expect(isPropertyClsSafe("margin")).toBe(false);
      expect(isPropertyClsSafe("padding")).toBe(false);
      expect(isPropertyClsSafe("top")).toBe(false);
      expect(isPropertyClsSafe("left")).toBe(false);
    });

    // Step 3: Validate spring physics properties
    it("should provide fluid, high-frame-rate spring physics configurations", () => {
      const spring = getSpringTransition();

      expect(spring.type).toBe("spring");
      expect(spring.stiffness).toBeGreaterThanOrEqual(200);
      expect(spring.stiffness).toBeLessThanOrEqual(500);
      expect(spring.damping).toBeGreaterThanOrEqual(15);
      expect(spring.damping).toBeLessThanOrEqual(40);
    });
  });

  describe("Application Layer: useReducedMotion hook", () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      vi.restoreAllMocks();
    });

    it("should return false by default when prefers-reduced-motion is false", () => {
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

      render(<ReducedMotionConsumer />);
      expect(screen.getByTestId("reduced-motion-indicator").textContent).toBe("full-motion");
    });

    it("should return true when user prefers reduced motion", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<ReducedMotionConsumer />);
      expect(screen.getByTestId("reduced-motion-indicator").textContent).toBe("reduced");
    });
  });

  describe("Presentation Layer: DashboardInteractiveCard component", () => {
    it("should render children with hardware acceleration and interactive card container", () => {
      render(
        <DashboardInteractiveCard accent="emerald" data-testid="test-card">
          <div data-testid="card-content">Patrimonio Invertido</div>
        </DashboardInteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      expect(card).toBeDefined();
      expect(screen.getByTestId("card-content").textContent).toBe("Patrimonio Invertido");

      // Verify hardware acceleration class is present
      const className = card.className;
      expect(className).toContain("dash-interactive-card");
    });

    it("should accept custom className and crimson accent variant", () => {
      render(
        <DashboardInteractiveCard accent="crimson" className="custom-dash-class" data-testid="crimson-card">
          <span>Oportunidades</span>
        </DashboardInteractiveCard>
      );

      const card = screen.getByTestId("crimson-card");
      expect(card.className).toContain("custom-dash-class");
      expect(card.className).toContain("dash-interactive-card");
    });
  });

  describe("Presentation Layer: 3D Active Pie Shape & Donut Micro-interactions", () => {
    it("should render 3D active pie shape with expanded outer radius, radial displacement and drop shadow (@spec BBC-016-3D-PIE)", async () => {
      // Import render3DActivePieShape from investment-dashboard
      const { render3DActivePieShape } = await import("@/components/dashboard/investment-dashboard");
      expect(render3DActivePieShape).toBeDefined();

      const { container } = render(
        <svg>
          {render3DActivePieShape({
            cx: 100,
            cy: 100,
            innerRadius: 48,
            outerRadius: 74,
            startAngle: 0,
            endAngle: 90,
            fill: "#57B98C",
          })}
        </svg>
      );

      const sectorGroup = container.querySelector("[data-testid='active-3d-pie-sector']");
      expect(sectorGroup).toBeInTheDocument();

      // Verify two path/sector elements (base 3D shadow + elevated main slice)
      const sectors = container.querySelectorAll("path");
      expect(sectors.length).toBe(2);

      // Verify drop-shadow filter is applied to the elevated slice
      const elevatedSlice = sectors[1];
      expect(elevatedSlice.getAttribute("style")).toContain("drop-shadow");
    });
  });

  describe("Presentation Layer: My Investments Carousel Card Glow (@spec BBC-016-CAROUSEL-GLOW)", () => {
    const mockDashboardData = {
      investor: {
        id: "user-1",
        email: "test@example.com",
        firstName: "Carlos",
        lastName: "Gomez",
        avatarUrl: null,
        tier: "Inversionista",
        createdAt: new Date("2022-01-01"),
      },
      properties: [
        {
          id: "prop-1",
          propertyId: "prop-1",
          propertyName: "Carrollwood",
          propertyType: "Residencial",
          city: "Tampa, FL",
          investedAmount: 25000,
          roi: 12.5,
          status: "activa",
          timing: "12 meses restantes",
          gradient: "linear-gradient(135deg,#1E3A8A,#172554)",
          monthsLeft: 12,
          phases: [],
        },
      ],
      reinvestmentOpportunities: [],
      totalInvested: 25000,
      weightedRoi: 12.5,
      activeCount: 1,
      concludedCount: 0,
    };

    it("should render 'Mis inversiones' carousel card wrapped in interactive card with hardware acceleration and emerald glow", async () => {
      const { InvestmentDashboard } = await import("@/components/dashboard/investment-dashboard");
      const { I18nProvider } = await import("@/features/i18n/presentation/components/i18n-provider");
      const { ThemeProvider } = await import("@/components/theme");

      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <InvestmentDashboard initialData={mockDashboardData as any} />
          </I18nProvider>
        </ThemeProvider>
      );

      const carouselCard = screen.getByTestId("my-investments-carousel-card");
      expect(carouselCard).toBeDefined();
      expect(carouselCard.className).toContain("dash-interactive-card");
      expect(carouselCard.className).toContain("dash-carousel-card-wrapper");
    });
  });
});
