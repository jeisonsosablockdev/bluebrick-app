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
    expect(screen.getByText(/En curso/i)).toBeInTheDocument();
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
});
