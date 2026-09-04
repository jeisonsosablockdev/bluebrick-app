/**
 * @file tests/unit/blue-brick-brand.test.tsx
 * @description Layer 1 & QA: Behavioral Unit Test Suite for BlueBrick Official Brand Identity & Adaptive Emblem.
 * @spec BBC-019
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Presentation Layer imports
import { BlueBrickMark } from "@/components/dashboard/blue-brick-mark";
import { BlueBrickLogo } from "@/components/dashboard/blue-brick-logo";
import { ThemeProvider } from "@/components/theme";

// Domain Layer imports
import {
  BRAND_COLORS,
  BRAND_BARS,
  BRAND_GEOMETRY,
  getBarFill,
} from "@/features/shared";

describe("BBC-019: Official Brand Visual Identity & Geometry Specifications", () => {
  describe("1. Brand Tokens & Invariant Contracts (@spec BBC-019-REQ-1)", () => {
    it("should strictly enforce official sampled hex color tokens", () => {
      // Step 1: Assert official sampled hex color tokens
      expect(BRAND_COLORS.crimsonRed).toBe("#FC040C");
      expect(BRAND_COLORS.deepNavy).toBe("#04283C");
      expect(BRAND_COLORS.pureWhite).toBe("#FFFFFF");
      expect(BRAND_COLORS.typographyNavy).toBe("#102838");
      expect(BRAND_COLORS.canvasGrey).toBe("#F7F7F7");
    });

    it("should enforce canonical capsule bars geometry and heights", () => {
      // Step 1: Assert canonical capsule bars geometry and heights
      expect(BRAND_GEOMETRY.angleDeg).toBe(-24);
      expect(BRAND_GEOMETRY.barWidth).toBe(6);
      expect(BRAND_GEOMETRY.barGap).toBe(3);
      expect(BRAND_GEOMETRY.borderRadius).toBe(3);

      expect(BRAND_BARS.length).toBe(4);
      expect(BRAND_BARS[0].height).toBe(16);
      expect(BRAND_BARS[0].role).toBe("structural");
      expect(BRAND_BARS[1].height).toBe(26);
      expect(BRAND_BARS[1].role).toBe("structural");
      expect(BRAND_BARS[2].height).toBe(32);
      expect(BRAND_BARS[2].role).toBe("structural");
      expect(BRAND_BARS[3].height).toBe(26);
      expect(BRAND_BARS[3].role).toBe("accent");
    });

    it("should resolve correct fills based on theme mode", () => {
      // Step 1: In light mode, structural bars use Deep Navy and accent bar uses Crimson Red
      expect(getBarFill(BRAND_BARS[0], "light")).toBe("#04283C");
      expect(getBarFill(BRAND_BARS[3], "light")).toBe("#FC040C");

      // Step 2: In dark mode, structural bars use Pure White and accent bar uses Crimson Red
      expect(getBarFill(BRAND_BARS[0], "dark")).toBe("#FFFFFF");
      expect(getBarFill(BRAND_BARS[3], "dark")).toBe("#FC040C");
    });
  });

  describe("2. Adaptive Vector BlueBrickMark in Light Mode (@spec BBC-019-REQ-2)", () => {
    it("should render 4 capsule bars with -24deg rotation and Deep Navy structural bars", () => {
      // Step 1: Render BlueBrickMark within Light theme provider
      const { container } = render(
        <ThemeProvider defaultTheme="light">
          <BlueBrickMark />
        </ThemeProvider>
      );

      // Step 2: Verify root wrapper and -24deg rotation
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper.style.transform).toContain("-24deg");

      // Step 3: Verify 4 stadium capsule bars are rendered
      const bars = container.querySelectorAll("span");
      expect(bars.length).toBe(4);

      // Step 4: Verify structural bars have Deep Navy fill and accent bar has Crimson Red fill
      expect(bars[0].style.backgroundColor || bars[0].style.background).toMatch(/(#04283C|rgb\(4,\s*40,\s*60\))/i);
      expect(bars[1].style.backgroundColor || bars[1].style.background).toMatch(/(#04283C|rgb\(4,\s*40,\s*60\))/i);
      expect(bars[2].style.backgroundColor || bars[2].style.background).toMatch(/(#04283C|rgb\(4,\s*40,\s*60\))/i);
      expect(bars[3].style.backgroundColor || bars[3].style.background).toMatch(/(#FC040C|rgb\(252,\s*4,\s*12\))/i);
    });
  });

  describe("3. Adaptive Vector BlueBrickMark in Dark Mode (@spec BBC-019-REQ-3)", () => {
    it("should render 4 capsule bars with -24deg rotation and Pure White structural bars", () => {
      // Step 1: Render BlueBrickMark within Dark theme provider
      const { container } = render(
        <ThemeProvider defaultTheme="dark">
          <BlueBrickMark />
        </ThemeProvider>
      );

      // Step 2: Verify root wrapper and -24deg rotation
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper.style.transform).toContain("-24deg");

      // Step 3: Verify 4 stadium capsule bars are rendered
      const bars = container.querySelectorAll("span");
      expect(bars.length).toBe(4);

      // Step 4: Verify structural bars have Pure White fill and accent bar has Crimson Red fill
      expect(bars[0].style.backgroundColor || bars[0].style.background).toMatch(/(#FFFFFF|rgb\(255,\s*255,\s*255\))/i);
      expect(bars[1].style.backgroundColor || bars[1].style.background).toMatch(/(#FFFFFF|rgb\(255,\s*255,\s*255\))/i);
      expect(bars[2].style.backgroundColor || bars[2].style.background).toMatch(/(#FFFFFF|rgb\(255,\s*255,\s*255\))/i);
      expect(bars[3].style.backgroundColor || bars[3].style.background).toMatch(/(#FC040C|rgb\(252,\s*4,\s*12\))/i);
    });
  });

  describe("4. Shared Common Assets Physical Presence (@spec BBC-019-REQ-4)", () => {
    it("should verify official brand files exist in apps/web/public/brand/", () => {
      // Step 1: Locate public brand directory
      const publicBrandDir = path.resolve(process.cwd(), "apps/web/public/brand");

      // Step 2: Verify directory exists
      expect(fs.existsSync(publicBrandDir)).toBe(true);

      // Step 3: Verify all canonical brand asset files exist and are non-empty
      const requiredFiles = [
        "bluebrick-logo-horizontal.png",
        "bluebrick-logo-horizontal.svg",
        "bluebrick-logo-horizontal-white.png",
        "bluebrick-logo-horizontal-white.svg",
        "bluebrick-mark-dark.png",
        "bluebrick-mark-dark.svg",
        "bluebrick-mark-white.png",
        "bluebrick-mark-white.svg",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(publicBrandDir, file);
        expect(fs.existsSync(filePath), `Missing asset: ${file}`).toBe(true);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(100);
      }
    });
  });

  describe("5. Official Horizontal BlueBrickLogo Component (@spec BBC-019-REQ-5)", () => {
    it("should render official horizontal navy vector logo in Light Mode", () => {
      // Step 1: Render BlueBrickLogo in light mode
      const { container } = render(
        <ThemeProvider defaultTheme="light">
          <BlueBrickLogo height={32} />
        </ThemeProvider>
      );

      // Step 2: Verify logo image is present with canonical navy horizontal SVG asset
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toContain("bluebrick-logo-horizontal.svg");
      expect(img?.getAttribute("alt")).toBe("Blue Brick");

      // Step 3: Verify screen reader text is present
      const srSpan = container.querySelector("span");
      expect(srSpan).not.toBeNull();
      expect(srSpan?.textContent).toBe("Blue Brick");
    });

    it("should render official horizontal white vector logo in Dark Mode", () => {
      // Step 1: Render BlueBrickLogo in dark mode
      const { container } = render(
        <ThemeProvider defaultTheme="dark">
          <BlueBrickLogo height={32} />
        </ThemeProvider>
      );

      // Step 2: Verify logo image is present with canonical white horizontal SVG asset
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toContain("bluebrick-logo-horizontal-white.svg");
      expect(img?.getAttribute("alt")).toBe("Blue Brick");

      // Step 3: Verify screen reader text is present
      const srSpan = container.querySelector("span");
      expect(srSpan).not.toBeNull();
      expect(srSpan?.textContent).toBe("Blue Brick");
    });
  });
});
