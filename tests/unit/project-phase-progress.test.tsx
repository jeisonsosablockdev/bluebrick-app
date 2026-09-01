/**
 * @file tests/unit/project-phase-progress.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for ProjectPhaseProgress component.
 * @spec BBC-13-PROJECT-PHASE-PROGRESS
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectPhaseProgress } from "@/components/dashboard/project-phase-progress";
import { I18nProvider } from "@/features/i18n";
import { ThemeProvider } from "@/components/theme";
import type { PortfolioItem } from "@/lib/types/db";

const mockActiveProperty: PortfolioItem = {
  id: "prop-1",
  propertyId: "p-1",
  propertyName: "Torre Alvear Premium",
  city: "Buenos Aires",
  propertyType: "Residencial",
  investedAmount: 50000,
  roi: 12.5,
  status: "activa",
  timing: "Q4 2026",
  monthsLeft: 6,
  gradient: "linear-gradient(135deg, #1A365D, #2A4365)",
  phases: Array.from({ length: 12 }, (_, i) => ({
    id: `ph-${i + 1}`,
    projectId: "p-1",
    order: i + 1,
    name: `Fase ${i + 1}`,
    status: i < 7 ? "Completada" : i === 7 ? "En curso" : "Pendiente",
    images: [],
  })),
};

const mockCompletedProperty: PortfolioItem = {
  id: "prop-2",
  propertyId: "p-2",
  propertyName: "Parque Logístico Industrial",
  city: "Bogotá",
  propertyType: "Industrial",
  investedAmount: 75000,
  roi: 15.0,
  status: "concluida",
  timing: "Concluido",
  monthsLeft: 0,
  gradient: "linear-gradient(135deg, #2D3748, #1A202C)",
};

describe("BBC-13: ProjectPhaseProgress Unit Suite (@spec BBC-13-PROJECT-PHASE-PROGRESS)", () => {
  it("should render phase progress header and completion percentage", () => {
    // Step 1: Render component with active property
    render(
      <ThemeProvider>
        <I18nProvider initialLocale="es">
          <ProjectPhaseProgress property={mockActiveProperty} />
        </I18nProvider>
      </ThemeProvider>
    );

    // Step 2: Assert header title and completion percentage
    expect(screen.getByText(/AVANCE DE OBRA POR FASES|AVANCE DEL PROYECTO/i)).toBeInTheDocument();
    expect(screen.getByText(/% completado/i)).toBeInTheDocument();
  });

  it("should render milestone dots for all project phases", () => {
    // Step 1: Render component
    const { container } = render(
      <ThemeProvider>
        <I18nProvider initialLocale="es">
          <ProjectPhaseProgress property={mockActiveProperty} />
        </I18nProvider>
      </ThemeProvider>
    );

    // Step 2: Assert phase dots exist
    const dots = container.querySelectorAll("[data-testid='phase-dot']");
    expect(dots.length).toBeGreaterThanOrEqual(8);
  });

  it("should display the current phase count, title, and in-progress status tag", () => {
    // Step 1: Render active property
    render(
      <ThemeProvider>
        <I18nProvider initialLocale="es">
          <ProjectPhaseProgress property={mockActiveProperty} />
        </I18nProvider>
      </ThemeProvider>
    );

    // Step 2: Assert current phase details
    expect(screen.getByText(/Fase \d+ de \d+/i)).toBeInTheDocument();
    expect(screen.getAllByText(/En curso/i).length).toBeGreaterThanOrEqual(1);
  });

  it("should display 100% completed status for concluded properties", () => {
    // Step 1: Render completed property
    render(
      <ThemeProvider>
        <I18nProvider initialLocale="es">
          <ProjectPhaseProgress property={mockCompletedProperty} />
        </I18nProvider>
      </ThemeProvider>
    );

    // Step 2: Assert 100% completed
    expect(screen.getByText(/100% completado/i)).toBeInTheDocument();
  });

  describe("BBC-14: Dynamic Phases & 100% Full Fallback (@spec BBC-14-DYNAMIC-PHASES)", () => {
    const mockPropertyWith14Phases: PortfolioItem = {
      id: "inv-bg-001",
      propertyId: "BG-01",
      propertyName: "BUSH GARDEN",
      city: "TAMPA BAY",
      propertyType: "Residencial",
      investedAmount: 60000,
      roi: 16.0,
      status: "activa",
      timing: "Q1 2027",
      monthsLeft: 4,
      gradient: "linear-gradient(135deg, #1C4D38, #0F3124)",
      currentPhase: "9. Acabados",
      phaseProgressPct: 57.14,
      phases: [
        { id: "F1", projectId: "BG-01", order: 1, name: "1. Adquisición", status: "Completada", images: ["https://img1.jpg"] },
        { id: "F2", projectId: "BG-01", order: 2, name: "2. Preliminares", status: "Completada", images: [] },
        { id: "F3", projectId: "BG-01", order: 3, name: "3. Permisos", status: "Completada", images: [] },
        { id: "F4", projectId: "BG-01", order: 4, name: "4. Inicio de obra", status: "Completada", images: [] },
        { id: "F5", projectId: "BG-01", order: 5, name: "5. Demoliciones y/o cimentación", status: "Completada", images: [] },
        { id: "F6", projectId: "BG-01", order: 6, name: "6. Construcción de estructuras y muros", status: "Completada", images: [] },
        { id: "F7", projectId: "BG-01", order: 7, name: "7. Cubierta o techos", status: "Completada", images: [] },
        { id: "F8", projectId: "BG-01", order: 8, name: "8. Instalaciones", status: "Completada", images: [] },
        { id: "F9", projectId: "BG-01", order: 9, name: "9. Acabados", status: "En curso", images: ["https://acabados.jpg"] },
        { id: "F10", projectId: "BG-01", order: 10, name: "10. Inspecciones", status: "En curso", images: [] },
        { id: "F11", projectId: "BG-01", order: 11, name: "11. Listada para renta o venta", status: "Pendiente", images: [] },
        { id: "F12", projectId: "BG-01", order: 12, name: "12. Vendida o rentada", status: "Pendiente", images: [] },
        { id: "F13", projectId: "BG-01", order: 13, name: "13. Liquidación", status: "Pendiente", images: [] },
        { id: "F14", projectId: "BG-01", order: 14, name: "14. Dispersión de pagos", status: "Pendiente", images: [] },
      ],
    };

    it("should render all 14 dynamic phases and highlight the active in-progress phase (Acabados)", () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={mockPropertyWith14Phases} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Verify 14 milestone dots
      const dots = container.querySelectorAll("[data-testid='phase-dot']");
      expect(dots.length).toBe(14);

      // Verify completion percentage from phaseProgressPct
      expect(screen.getByText(/57% completado/i)).toBeInTheDocument();

      // Verify active phase name and count (Fase 9 de 14)
      expect(screen.getByText(/Fase 9 de 14/i)).toBeInTheDocument();
      expect(screen.getAllByText(/9\. Acabados/i).length).toBeGreaterThanOrEqual(1);
    });

    it("should render as completely full (100% completado) when property has NO phases", () => {
      const propertyWithoutPhases: PortfolioItem = {
        ...mockActiveProperty,
        phases: undefined,
      };

      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={propertyWithoutPhases} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Rule from user: If no phases, render as completely full (100% completado)
      expect(screen.getByText(/100% completado/i)).toBeInTheDocument();
    });

    it("should re-sync active phase and details when carousel active property changes (@spec BBC-015-REQ-2)", () => {
      const mockPropertyCarrollwood: PortfolioItem = {
        id: "inv-cw-004",
        propertyId: "CW-04",
        propertyName: "CARROLLWOOD",
        city: "TAMPA",
        propertyType: "Residencial",
        investedAmount: 50000,
        roi: 16.0,
        status: "activa",
        timing: "Q2 2027",
        monthsLeft: 6,
        gradient: "linear-gradient(135deg, #1C4D38, #0F3124)",
        currentPhase: "6. Construcción de estructuras y muros",
        phaseProgressPct: 42.86,
        phases: [
          { id: "CW1", projectId: "CW-04", order: 1, name: "1. Adquisición", status: "Completada", images: [] },
          { id: "CW2", projectId: "CW-04", order: 2, name: "2. Preliminares", status: "Completada", images: [] },
          { id: "CW3", projectId: "CW-04", order: 3, name: "3. Permisos", status: "Completada", images: [] },
          { id: "CW4", projectId: "CW-04", order: 4, name: "4. Demolición", status: "Completada", images: [] },
          { id: "CW5", projectId: "CW-04", order: 5, name: "5. Cimentación", status: "Completada", images: [] },
          { id: "CW6", projectId: "CW-04", order: 6, name: "6. Construcción de estructuras y muros", status: "En curso", images: [] },
          { id: "CW7", projectId: "CW-04", order: 7, name: "7. Acabados", status: "Pendiente", images: [] },
          { id: "CW8", projectId: "CW-04", order: 8, name: "8. Inspecciones", status: "Pendiente", images: [] },
          { id: "CW9", projectId: "CW-04", order: 9, name: "9. Venta", status: "Pendiente", images: [] },
          { id: "CW10", projectId: "CW-04", order: 10, name: "10. Cierre", status: "Pendiente", images: [] },
        ],
      };

      const { rerender } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={mockPropertyWith14Phases} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Initially Bush Garden (Fase 9 de 14)
      expect(screen.getByText(/Fase 9 de 14/i)).toBeInTheDocument();
      expect(screen.getAllByText(/9\. Acabados/i).length).toBeGreaterThanOrEqual(1);

      // Act: Re-render with Carrollwood property (Fase 2 de 2)
      rerender(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={mockPropertyCarrollwood} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Assert: Must re-sync to Carrollwood active phase (Fase 6 de 10 - 6. Construcción de estructuras y muros)
      expect(screen.getByText(/Fase 6 de 10/i)).toBeInTheDocument();
      expect(screen.getAllByText(/6\. Construcción de estructuras y muros/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/43% completado/i)).toBeInTheDocument();
    });

    it("should display tooltip with nombre_fase and estado on milestone dot hover (@spec BBC-015-HOVER-TOOLTIP)", async () => {
      const { container } = render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={mockPropertyWith14Phases} />
          </I18nProvider>
        </ThemeProvider>
      );

      const dots = container.querySelectorAll("[data-testid='phase-dot']");
      expect(dots.length).toBe(14);

      // Act: Hover over the 9th dot (Fase 9: 9. Acabados, En curso)
      const dot9 = dots[8];
      fireEvent.mouseEnter(dot9);

      // Assert: Tooltip shows exact 2-line layout: arriba (nombre_fase), abajo (estado)
      const tooltip = screen.getByTestId("phase-dot-tooltip");
      expect(tooltip).toBeInTheDocument();
      const tooltipName = screen.getByTestId("phase-dot-tooltip-name");
      const tooltipStatus = screen.getByTestId("phase-dot-tooltip-status");
      expect(tooltipName).toHaveTextContent("9. Acabados");
      expect(tooltipStatus).toHaveTextContent("En curso");

      // Act: Mouse leave removes tooltip
      fireEvent.mouseLeave(dot9);
      await waitFor(() => {
        expect(screen.queryByTestId("phase-dot-tooltip")).not.toBeInTheDocument();
      });
    });

    it("should NOT render image pagination dots when phase has 0 or 1 image (@spec BBC-015-DYNAMIC-MEDIA-CAROUSEL)", () => {
      const propertySingleImage: PortfolioItem = {
        ...mockActiveProperty,
        phases: [
          { id: "P1", projectId: "P1", order: 1, name: "1. Adquisición", status: "En curso", images: ["https://single.jpg"] },
        ],
      };

      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={propertySingleImage} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Assert: No pagination controls should be rendered when images <= 1
      expect(screen.queryByTestId("phase-images-pagination")).not.toBeInTheDocument();
    });

    it("should render dynamic clickable pagination dots and support image switching when phase has multiple images (@spec BBC-015-DYNAMIC-MEDIA-CAROUSEL)", () => {
      const propertyMultiImages: PortfolioItem = {
        ...mockActiveProperty,
        phases: [
          {
            id: "P1",
            projectId: "P1",
            order: 1,
            name: "1. Adquisición",
            status: "En curso",
            images: [
              "https://drive.blue-brick.com/vn/adquisicion-1.jpg",
              "https://drive.blue-brick.com/vn/adquisicion-2.jpg",
              "https://drive.blue-brick.com/vn/adquisicion-3.jpg",
            ],
          },
        ],
      };

      render(
        <ThemeProvider>
          <I18nProvider initialLocale="es">
            <ProjectPhaseProgress property={propertyMultiImages} />
          </I18nProvider>
        </ThemeProvider>
      );

      // Assert: Pagination dots are rendered matching image count (3 images)
      const pagination = screen.getByTestId("phase-images-pagination");
      expect(pagination).toBeInTheDocument();
      const dot0 = screen.getByTestId("phase-image-dot-0");
      const dot1 = screen.getByTestId("phase-image-dot-1");
      const dot2 = screen.getByTestId("phase-image-dot-2");
      expect(dot0).toBeInTheDocument();
      expect(dot1).toBeInTheDocument();
      expect(dot2).toBeInTheDocument();

      // Click dot 1 to switch to second image
      fireEvent.click(dot1);
      expect(screen.getByText(/foto 2 de 3/i)).toBeInTheDocument();
    });
  });
});
