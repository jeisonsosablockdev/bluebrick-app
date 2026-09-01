/**
 * @file tests/unit/project-phase-progress.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for ProjectPhaseProgress component.
 * @spec BBC-13-PROJECT-PHASE-PROGRESS
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
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
  });
});
