/**
 * @file tests/unit/theme-toggle.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for ThemeProvider & ThemeToggle (BBC-13).
 * @spec BBC-13-THEME-SUPPORT
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, ThemeToggle, useTheme } from "@/components/theme";
import { I18nProvider } from "@/features/i18n";

function TestConsumer(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
    </div>
  );
}

describe("BBC-13: ThemeProvider & ThemeToggle Unit Suite (@spec BBC-13-THEME-SUPPORT)", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    document.documentElement.className = "";
  });

  describe("1. ThemeProvider Context & DOM Sync (@spec BBC-13-REQ-7)", () => {
    it("should default to dark theme and apply 'dark' class to document root", () => {
      // Step 1: Render ThemeProvider wrapping consumer
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      );

      // Step 2: Assert default dark theme
      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should toggle between dark and light themes and persist to localStorage", () => {
      // Step 1: Render ThemeProvider wrapping consumer
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      );

      // Step 2: Toggle to light mode
      const toggleBtn = screen.getByTestId("toggle-btn");
      act(() => {
        fireEvent.click(toggleBtn);
      });

      // Step 3: Assert light theme
      expect(screen.getByTestId("current-theme").textContent).toBe("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(mockStorage["bluebrick_theme"]).toBe("light");

      // Step 4: Toggle back to dark mode
      act(() => {
        fireEvent.click(toggleBtn);
      });

      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(mockStorage["bluebrick_theme"]).toBe("dark");
    });
  });

  describe("2. ThemeToggle UI Component (@spec BBC-13-REQ-8)", () => {
    it("should render accessible theme toggle button with localized title or aria-label", () => {
      // Step 1: Render ThemeToggle within I18nProvider and ThemeProvider
      render(
        <I18nProvider initialLocale="es">
          <ThemeProvider defaultTheme="dark">
            <ThemeToggle />
          </ThemeProvider>
        </I18nProvider>
      );

      // Step 2: Assert toggle button exists and has accessible role
      const themeBtn = screen.getByRole("button");
      expect(themeBtn).toBeInTheDocument();
      expect(themeBtn).toHaveAttribute("aria-label");
    });

    it("should toggle theme when clicked", () => {
      // Step 1: Render ThemeToggle
      render(
        <I18nProvider initialLocale="es">
          <ThemeProvider defaultTheme="dark">
            <ThemeToggle />
          </ThemeProvider>
        </I18nProvider>
      );

      const themeBtn = screen.getByRole("button");

      // Step 2: Click to toggle to light
      act(() => {
        fireEvent.click(themeBtn);
      });
      expect(document.documentElement.classList.contains("light")).toBe(true);

      // Step 3: Click to toggle back to dark
      act(() => {
        fireEvent.click(themeBtn);
      });
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
