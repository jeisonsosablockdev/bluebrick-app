/**
 * @file tests/unit/project-phase-progress-multi-phase.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for Continuous Multi-Phase Carousel
 * Transitions and Animated Phase Header (Carrollwood multi-phase photo case).
 * @spec BBC-020-SPEC-06
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProjectPhaseProgress } from "@/components/dashboard/project-phase-progress";
import { I18nProvider } from "@/features/i18n";
import { ThemeProvider } from "@/components/theme";
import type { PortfolioItem } from "@/lib/types/db";

// ─── Test Fixture: Carrollwood with photos in different phases ────────────────

const mockCarrollwoodProperty: PortfolioItem = {
  id: "prop-carrollwood-cw04",
  propertyId: "CW-04",
  propertyName: "CARROLLWOOD",
  city: "TAMPA",
  propertyType: "Residencial",
  investedAmount: 60000,
  roi: 16.0,
  status: "activa",
  timing: "Q2 2027",
  monthsLeft: 6,
  gradient: "linear-gradient(135deg, #1C4D38, #0F3124)",
  phaseProgressPct: 50,
  phases: [
    {
      id: "cw-ph-1",
      projectId: "CW-04",
      order: 1,
      name: "1. Adquisición y Licencias",
      status: "Completada",
      images: ["https://example.com/cw-phase1-photo1.jpg"], // 1 photo
    },
    {
      id: "cw-ph-2",
      projectId: "CW-04",
      order: 2,
      name: "2. Demolición y Limpieza",
      status: "Completada",
      images: [], // 0 photos (should be skipped by photo carousel)
    },
    {
      id: "cw-ph-3",
      projectId: "CW-04",
      order: 3,
      name: "3. Cimentación y Estructura",
      status: "En curso",
      images: [
        "https://example.com/cw-phase3-photo1.jpg",
        "https://example.com/cw-phase3-photo2.jpg",
      ], // 2 photos
    },
    {
      id: "cw-ph-4",
      projectId: "CW-04",
      order: 4,
      name: "4. Acabados Interiores",
      status: "Pendiente",
      images: [], // 0 photos
    },
  ],
};

function renderProgress(property: PortfolioItem = mockCarrollwoodProperty) {
  return render(
    <ThemeProvider>
      <I18nProvider initialLocale="es">
        <ProjectPhaseProgress property={property} />
      </I18nProvider>
    </ThemeProvider>
  );
}

describe("BBC-020 SPEC-06: Continuous Multi-Phase Carousel & Animated Header", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Automatic Multi-Phase Carousel Cycling", () => {
    it("should advance from Phase 1 to Phase 3 (skipping Phase 2 without photos) on 4s timer tick", () => {
      // Step 1: Render Carrollwood property starting at Phase 1 by selecting it
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");
      expect(dotButtons.length).toBe(4);

      // Select Phase 1 explicitly
      fireEvent.click(dotButtons[0]);
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("1. Adquisición y Licencias");
      expect(screen.getByText(/Fase 1 de 4/i)).toBeInTheDocument();

      // Step 2: Advance time by 4 seconds (timer tick)
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // Step 3: Verify it advanced to Phase 3 (skipping Phase 2 which has 0 photos)
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("3. Cimentación y Estructura");
      expect(screen.getByText(/Fase 3 de 4/i)).toBeInTheDocument();
    });

    it("should cycle through multiple photos in Phase 3 before looping back to Phase 1", () => {
      // Step 1: Render component and select Phase 3
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");
      fireEvent.click(dotButtons[2]); // Phase 3

      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("3. Cimentación y Estructura");
      const realImg = screen.getByTestId("phase-real-image");
      expect(realImg.getAttribute("src")).toBe("https://example.com/cw-phase3-photo1.jpg");

      // Step 2: 4s tick -> Photo 2 of Phase 3
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("3. Cimentación y Estructura");
      expect(screen.getByTestId("phase-real-image").getAttribute("src")).toBe("https://example.com/cw-phase3-photo2.jpg");

      // Step 3: Next 4s tick -> Loops circularly to Phase 1 (first phase with photos)
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("1. Adquisición y Licencias");
      expect(screen.getByTestId("phase-real-image").getAttribute("src")).toBe("https://example.com/cw-phase1-photo1.jpg");
    });
  });

  describe("Manual Cross-Phase Arrow Navigation in ProjectPhaseMediaCard", () => {
    it("should show corner navigation arrows on Phase 1 because total project photos > 1", () => {
      // Step 1: Render and select Phase 1 (1 photo, but project has 3 photos total)
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");
      fireEvent.click(dotButtons[0]);

      // Step 2: Verify next arrow exists even though Phase 1 only has 1 local photo
      const nextArrow = screen.getByTestId("phase-media-arrow-next");
      expect(nextArrow).toBeInTheDocument();

      // Step 3: Clicking next arrow jumps to Phase 3 (next phase with photos)
      fireEvent.click(nextArrow);
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("3. Cimentación y Estructura");
    });

    it("should allow navigating backward to Phase 3 photo 2 when on Phase 1 photo 1", () => {
      // Step 1: Render and select Phase 1
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");
      fireEvent.click(dotButtons[0]);

      // Step 2: Prev arrow exists and clicking it goes backward to Phase 3 photo 2
      const prevArrow = screen.getByTestId("phase-media-arrow-prev");
      expect(prevArrow).toBeInTheDocument();

      fireEvent.click(prevArrow);
      expect(screen.getByTestId("phase-header-title")).toHaveTextContent("3. Cimentación y Estructura");
      expect(screen.getByTestId("phase-real-image").getAttribute("src")).toBe("https://example.com/cw-phase3-photo2.jpg");
    });
  });

  describe("Animated Phase Header Feedback", () => {
    it("should render phase header with animated container wrapper (data-testid='phase-header-info')", () => {
      // Step 1: Render component
      renderProgress();

      // Step 2: Verify phase info block is rendered with dedicated testid and title
      const headerInfo = screen.getByTestId("phase-header-info");
      expect(headerInfo).toBeInTheDocument();
      const phaseTitle = screen.getByTestId("phase-header-title");
      expect(phaseTitle).toBeInTheDocument();
    });
  });
});
