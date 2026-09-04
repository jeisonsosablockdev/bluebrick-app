/**
 * @file tests/unit/project-phase-progress-dots.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for Milestone Photo Dot Indicators
 * and Progressive Hover Tooltips in ProjectPhaseProgress.
 * @spec BBC-020-SPEC-02
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectPhaseProgress } from "@/components/dashboard/project-phase-progress";
import { I18nProvider } from "@/features/i18n";
import { ThemeProvider } from "@/components/theme";
import type { PortfolioItem } from "@/lib/types/db";

// ─── Test Fixture ─────────────────────────────────────────────────────────────

const mockPropertyWithPhotoMilestones: PortfolioItem = {
  id: "prop-bbc-020",
  propertyId: "BBC-020-PROP",
  propertyName: "Torre Residencial Botanika",
  city: "Medellín",
  propertyType: "Residencial",
  investedAmount: 100000,
  roi: 14.5,
  status: "activa",
  timing: "Q4 2026",
  monthsLeft: 8,
  gradient: "linear-gradient(135deg, #1A365D, #2A4365)",
  phases: [
    {
      id: "ph-1",
      projectId: "BBC-020-PROP",
      order: 1,
      name: "1. Licencias y Diseños",
      status: "Completada",
      images: [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
        "https://example.com/img3.jpg",
      ], // Completed WITH 3 photos -> 15px dot, 9px check
    },
    {
      id: "ph-2",
      projectId: "BBC-020-PROP",
      order: 2,
      name: "2. Excavación y Tierras",
      status: "Completada",
      images: [
        "https://example.com/excavation.jpg",
      ], // Completed WITH 1 photo -> 15px dot, singular badge
    },
    {
      id: "ph-3",
      projectId: "BBC-020-PROP",
      order: 3,
      name: "3. Cimentación Profunda",
      status: "Completada",
      images: [], // Completed WITHOUT photos -> 10px dot, 7px check
    },
    {
      id: "ph-4",
      projectId: "BBC-020-PROP",
      order: 4,
      name: "4. Estructura y Muros",
      status: "En curso",
      images: [
        "https://example.com/struct1.jpg",
        "https://example.com/struct2.jpg",
      ], // In progress -> 14px dot with pulse
    },
    {
      id: "ph-5",
      projectId: "BBC-020-PROP",
      order: 5,
      name: "5. Acabados Finales",
      status: "Pendiente",
      images: [], // Pending -> 10px dot
    },
  ],
};

function renderProgress(property: PortfolioItem = mockPropertyWithPhotoMilestones) {
  return render(
    <ThemeProvider>
      <I18nProvider initialLocale="es">
        <ProjectPhaseProgress property={property} />
      </I18nProvider>
    </ThemeProvider>
  );
}

describe("BBC-020 SPEC-02: Milestone Photo Dot Indicators & Hover Tooltips", () => {
  describe("Milestone Dot Sizing (@invariants dot size & checkmark ratio)", () => {
    it("should render 15px diameter dot for completed phase WITH photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");
      expect(dotButtons.length).toBe(5);

      // Step 2: Query the inner dot element of phase 1 (completed with 3 photos)
      const phase1DotInner = dotButtons[0].querySelector("div");
      expect(phase1DotInner).not.toBeNull();
      expect(phase1DotInner?.style.width).toBe("15px");
      expect(phase1DotInner?.style.height).toBe("15px");
    });

    it("should render 9px checkmark icon inside 15px completed dot with photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Query SVG checkmark inside phase 1 (completed with photos)
      const checkIcon = dotButtons[0].querySelector("svg");
      expect(checkIcon).not.toBeNull();
      expect(checkIcon?.getAttribute("width")).toBe("9");
      expect(checkIcon?.getAttribute("height")).toBe("9");
    });

    it("should render standard 10px diameter dot for completed phase WITHOUT photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Query inner dot of phase 3 (completed without photos)
      const phase3DotInner = dotButtons[2].querySelector("div");
      expect(phase3DotInner).not.toBeNull();
      expect(phase3DotInner?.style.width).toBe("10px");
      expect(phase3DotInner?.style.height).toBe("10px");
    });

    it("should render 7px checkmark icon inside 10px completed dot without photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Query SVG checkmark inside phase 3 (completed without photos)
      const checkIcon = dotButtons[2].querySelector("svg");
      expect(checkIcon).not.toBeNull();
      expect(checkIcon?.getAttribute("width")).toBe("7");
      expect(checkIcon?.getAttribute("height")).toBe("7");
    });

    it("should preserve standard in-progress dot dimensions (14px) and pulse styling", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Query inner dot of phase 4 (in progress)
      const phase4DotInner = dotButtons[3].querySelector("div");
      expect(phase4DotInner).not.toBeNull();
      expect(phase4DotInner?.style.width).toBe("14px");
      expect(phase4DotInner?.style.height).toBe("14px");
    });
  });

  describe("Hover Tooltip Photo Badge (@invariants progressive disclosure)", () => {
    it("should display '📷 3 fotos de avance' badge on hover for completed phase with 3 photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Trigger hover on Phase 1
      fireEvent.mouseEnter(dotButtons[0]);

      // Step 3: Verify tooltip contains photo count badge
      const tooltip = screen.getByTestId("phase-dot-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(screen.getByText(/3 fotos de avance/i)).toBeInTheDocument();
    });

    it("should display singular '📷 1 foto de avance' badge on hover for completed phase with 1 photo", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Trigger hover on Phase 2 (1 photo)
      fireEvent.mouseEnter(dotButtons[1]);

      // Step 3: Verify singular wording
      expect(screen.getByText(/1 foto de avance/i)).toBeInTheDocument();
    });

    it("should NOT display any photo count badge on hover for completed phase WITHOUT photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Trigger hover on Phase 3 (0 photos)
      fireEvent.mouseEnter(dotButtons[2]);

      // Step 3: Verify tooltip displays name and status, but NO photo badge
      expect(screen.getByText("3. Cimentación Profunda")).toBeInTheDocument();
      expect(screen.queryByText(/foto.*avance/i)).toBeNull();
    });

    it("should display photo badge on hover for in-progress phase with photos", () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Trigger hover on Phase 4 (in progress with 2 photos)
      fireEvent.mouseEnter(dotButtons[3]);

      // Step 3: Verify photo badge appears
      expect(screen.getByText(/2 fotos de avance/i)).toBeInTheDocument();
    });

    it("should hide tooltip on mouseLeave", async () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Hover Phase 1
      fireEvent.mouseEnter(dotButtons[0]);
      expect(screen.getByTestId("phase-dot-tooltip")).toBeInTheDocument();

      // Step 3: Leave Phase 1
      fireEvent.mouseLeave(dotButtons[0]);
      await waitFor(() => {
        expect(screen.queryByTestId("phase-dot-tooltip")).not.toBeInTheDocument();
      });
    });

    it("should support keyboard accessibility via focus and blur", async () => {
      // Step 1: Render component
      const { container } = renderProgress();
      const dotButtons = container.querySelectorAll("[data-testid='phase-dot']");

      // Step 2: Focus Phase 1
      fireEvent.focus(dotButtons[0]);
      expect(screen.getByTestId("phase-dot-tooltip")).toBeInTheDocument();
      expect(screen.getByText(/3 fotos de avance/i)).toBeInTheDocument();

      // Step 3: Blur Phase 1
      fireEvent.blur(dotButtons[0]);
      await waitFor(() => {
        expect(screen.queryByTestId("phase-dot-tooltip")).not.toBeInTheDocument();
      });
    });
  });
});
