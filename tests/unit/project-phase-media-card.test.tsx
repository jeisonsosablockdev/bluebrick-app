/**
 * @file tests/unit/project-phase-media-card.test.tsx
 * @description Layer 1 & QA: TDD Primal RED Phase — Structural and Behavioral Unit Tests
 *   for the ProjectPhaseMediaCard component (BBC-015 / BBC-15).
 *
 * SPEC TRACEABILITY:
 *   @spec BBC-015-MEDIA-CARD-STRUCTURAL   Structural: Component file and named export exist.
 *   @spec BBC-015-MEDIA-CARD-REAL-IMAGE   Behavioral: When images provided, renders <img> with correct src and alt.
 *   @spec BBC-015-MEDIA-CARD-CAROUSEL     Behavioral: Multi-image dot pagination and click-to-switch work.
 *   @spec BBC-015-MEDIA-CARD-FALLBACK     Behavioral: Phases without images render fallback icon state.
 *   @spec BBC-015-MEDIA-CARD-ERROR        Behavioral: Image load error degrades gracefully to fallback.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Step 1: Structural contract — the module and named export must exist.
// NOTE: This import will fail (RED) until the scaffold file is created (Architect Gate 1).
import { ProjectPhaseMediaCard } from "@/components/dashboard/project-phase-media-card";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const PHASE_NAME = "6. Construcción de estructuras y muros";

const noImagesProps = {
  phaseName: PHASE_NAME,
  images: [] as string[],
  isDark: true,
  onHoverChange: (_hovered: boolean) => { /* no-op */ },
};

const singleImageProps = {
  phaseName: PHASE_NAME,
  images: ["https://example.com/phase-6-construction-01.jpg"],
  isDark: true,
  onHoverChange: (_hovered: boolean) => { /* no-op */ },
};

const multiImageProps = {
  phaseName: PHASE_NAME,
  images: [
    "https://example.com/phase-6-construction-01.jpg",
    "https://example.com/phase-6-construction-02.jpg",
    "https://example.com/phase-6-construction-03.jpg",
  ],
  isDark: true,
  onHoverChange: (_hovered: boolean) => { /* no-op */ },
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("BBC-015: ProjectPhaseMediaCard (@spec BBC-015-MEDIA-CARD-*)", () => {

  // ─── STRUCTURAL TESTS ───────────────────────────────────────────────────────

  describe("Structural Contract (@spec BBC-015-MEDIA-CARD-STRUCTURAL)", () => {
    it("should export ProjectPhaseMediaCard as a named React component", () => {
      // Arrange & Act
      const result = typeof ProjectPhaseMediaCard;
      // Assert: The export must be a function (React FC)
      expect(result).toBe("function");
    });

    it("should render without crashing given minimal props", () => {
      // Arrange, Act & Assert: No error thrown during render
      expect(() => render(<ProjectPhaseMediaCard {...noImagesProps} />)).not.toThrow();
    });
  });

  // ─── FALLBACK STATE TESTS ───────────────────────────────────────────────────

  describe("Fallback State (no images) (@spec BBC-015-MEDIA-CARD-FALLBACK)", () => {
    it("should NOT render a real photograph <img> element when images array is empty", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...noImagesProps} />);
      // Assert: No real photograph rendered in the fallback state
      expect(screen.queryByTestId("phase-real-image")).toBeNull();
    });

    it("should render a fallback placeholder container with the phase name text when images is empty", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...noImagesProps} />);
      // Assert: The phase name text must appear as fallback label
      expect(screen.getByText(new RegExp(PHASE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))).toBeInTheDocument();
    });

    it("should NOT render the pagination dot bar when images array is empty", () => {
      // Arrange & Act
      const { queryByTestId } = render(<ProjectPhaseMediaCard {...noImagesProps} />);
      // Assert: Pagination is invisible for fallback state
      expect(queryByTestId("phase-images-pagination")).not.toBeInTheDocument();
    });

    it("should render BlueBrick official brand logo with text and NO generic ImageIcon in fallback state (BBC-020 SPEC-07)", () => {
      // Arrange & Act
      const { container } = render(<ProjectPhaseMediaCard {...noImagesProps} />);
      // Assert 1: Generic ImageIcon is NOT rendered
      expect(container.querySelector("svg.lucide-image")).toBeNull();
      // Assert 2: Official brand logo is rendered in foreground
      const brandLogo = screen.getByTestId("phase-media-fallback-brand-logo");
      expect(brandLogo).toBeInTheDocument();
      expect(screen.getAllByText(/Blue Brick/i).length).toBeGreaterThanOrEqual(1);
    });

    it("should render diffused brand logo mesh in background layer (BBC-020 SPEC-07)", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...noImagesProps} />);
      // Assert 1: Ambient background mesh container exists
      const bgMesh = screen.getByTestId("phase-media-card-fallback-brand");
      expect(bgMesh).toBeInTheDocument();
      // Assert 2: Blurred logo element inside mesh applies blur filter
      const blurEl = screen.getByTestId("phase-media-card-fallback-brand-blur");
      expect(blurEl.style.filter).toContain("blur");
    });
  });

  // ─── SINGLE IMAGE TESTS ─────────────────────────────────────────────────────

  describe("Single Image Rendering (@spec BBC-015-MEDIA-CARD-REAL-IMAGE)", () => {
    it("should render an <img> element with correct src when exactly one image is provided", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...singleImageProps} />);
      // Assert: The real photograph URL is used as the image source
      const imgEl = screen.getByTestId("phase-real-image");
      expect(imgEl).not.toBeNull();
      expect(imgEl.getAttribute("src")).toBe(singleImageProps.images[0]);
    });

    it("should render an accessible alt attribute on the <img> element", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...singleImageProps} />);
      // Assert: Screen readers can identify the image content
      const imgEl = screen.getByTestId("phase-real-image");
      expect(imgEl.getAttribute("alt")).toBeTruthy();
      expect(imgEl.getAttribute("alt")).toMatch(/foto.*avance|avance.*obra|construcción/i);
    });

    it("should NOT render the pagination dot bar when only one image is provided", () => {
      // Arrange & Act
      const { queryByTestId } = render(<ProjectPhaseMediaCard {...singleImageProps} />);
      // Assert: Single image never shows pagination controls
      expect(queryByTestId("phase-images-pagination")).not.toBeInTheDocument();
    });
  });

  // ─── MULTI-IMAGE CAROUSEL TESTS ─────────────────────────────────────────────

  describe("Multi-Image Carousel (@spec BBC-015-MEDIA-CARD-CAROUSEL)", () => {
    it("should render the pagination dot bar when multiple images are provided", () => {
      // Arrange & Act
      const { getByTestId } = render(<ProjectPhaseMediaCard {...multiImageProps} />);
      // Assert: Pagination indicator present for multi-image carousels
      expect(getByTestId("phase-images-pagination")).toBeInTheDocument();
    });

    it("should render one pagination dot per image", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...multiImageProps} />);
      // Assert: Three dots rendered for three images
      expect(screen.getByTestId("phase-image-dot-0")).toBeInTheDocument();
      expect(screen.getByTestId("phase-image-dot-1")).toBeInTheDocument();
      expect(screen.getByTestId("phase-image-dot-2")).toBeInTheDocument();
    });

    it("should display the first image src initially (index 0)", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...multiImageProps} />);
      const imgEl = screen.getByTestId("phase-real-image");
      // Assert: First photograph is shown on mount
      expect(imgEl.getAttribute("src")).toBe(multiImageProps.images[0]);
    });

    it("should switch the <img> src to images[1] after clicking the second pagination dot", () => {
      // Arrange
      render(<ProjectPhaseMediaCard {...multiImageProps} />);
      const dot1 = screen.getByTestId("phase-image-dot-1");
      // Act: Click second dot
      fireEvent.click(dot1);
      // Assert: The displayed photo URL switches to the second image
      const imgEl = screen.getByTestId("phase-real-image");
      expect(imgEl.getAttribute("src")).toBe(multiImageProps.images[1]);
    });

    it("should switch the <img> src to images[2] after clicking the third pagination dot", () => {
      // Arrange
      render(<ProjectPhaseMediaCard {...multiImageProps} />);
      const dot2 = screen.getByTestId("phase-image-dot-2");
      // Act: Click third dot
      fireEvent.click(dot2);
      // Assert: The displayed photo URL switches to the third image
      const imgEl = screen.getByTestId("phase-real-image");
      expect(imgEl.getAttribute("src")).toBe(multiImageProps.images[2]);
    });

    it("should show the image counter label (e.g. '1/3') when multiple images exist", () => {
      // Arrange & Act
      render(<ProjectPhaseMediaCard {...multiImageProps} />);
      // Assert: Counter badge visible for multi-image carousel
      expect(screen.getByTestId("phase-image-counter")).toBeInTheDocument();
      expect(screen.getByTestId("phase-image-counter")).toHaveTextContent("1/3");
    });
  });

  // ─── ERROR HANDLING TESTS ───────────────────────────────────────────────────

  describe("Image Error Handling (@spec BBC-015-MEDIA-CARD-ERROR)", () => {
    it("should fall back to placeholder state when the <img> fires an onError event", () => {
      // Arrange
      render(<ProjectPhaseMediaCard {...singleImageProps} />);
      const imgEl = screen.getByTestId("phase-real-image");
      expect(imgEl).not.toBeNull();
      // Act: Simulate network/URL failure on the real image element
      fireEvent.error(imgEl);
      // Assert: After error, the real image element is removed from the DOM
      expect(screen.queryByTestId("phase-real-image")).not.toBeInTheDocument();
    });
  });
});
