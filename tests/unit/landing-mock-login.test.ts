/**
 * @file tests/unit/landing-mock-login.test.ts
 * @description Layer 1 & QA: Behavioral Unit Test Suite for SPEC-1 (Landing Page & Mock Login Entrypoint).
 * @spec BBC-6-SPEC-1
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

// Imports from the projected Presentation Layer for SPEC-1
import { LandingHero } from "@/components/landing/landing-hero";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { BlueBrickMark } from "@/components/dashboard/blue-brick-mark";

describe("SPEC-1: Landing Page & Mock Login Entrypoint (@spec BBC-6-SPEC-1)", () => {
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
    it("should display the platform value proposition and luxury dark header", () => {
      // Arrange & Act
      render(React.createElement(LandingHero));

      // Assert
      expect(screen.getByText(/BLUE BRICK/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Inversión Inmobiliaria Fraccionada/i) ||
        screen.getByText(/Inversiones Inmobiliarias/i)
      ).toBeInTheDocument();
    });
  });

  describe("InvestorLoginCard Component", () => {
    it("should present the demo investor profile (Sofía Martínez) and 1-click dashboard entry", () => {
      // Arrange & Act
      render(React.createElement(InvestorLoginCard));

      // Assert
      expect(screen.getByText(/Sofía Martínez/i)).toBeInTheDocument();
      expect(screen.getByText(/Inversionista Privado/i)).toBeInTheDocument();
      expect(screen.getByText("SM")).toBeInTheDocument();

      // Assert: One-click entry button targeting /dashboard
      const loginButton = screen.getByRole("link", { name: /Entrar al Dashboard/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute("href", "/dashboard");
    });
  });
});
