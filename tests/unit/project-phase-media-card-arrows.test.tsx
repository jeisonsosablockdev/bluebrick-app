/**
 * @file tests/unit/project-phase-media-card-arrows.test.tsx
 * @description Layer 1 & QA: TDD Primal RED Phase — Structural and Behavioral Unit Tests
 *   for Glassmorphic Corner Navigation Arrows in ProjectPhaseMediaCard (BBC-020 SPEC-01).
 *
 * SPEC TRACEABILITY:
 *   @spec BBC-020-SPEC-01-ARROWS-VISIBILITY     Behavioral: Arrows rendered ONLY when images.length > 1.
 *   @spec BBC-020-SPEC-01-ARROWS-ACCESSIBILITY  Behavioral: Accessible aria-labels and button types.
 *   @spec BBC-020-SPEC-01-ARROWS-NAV-NEXT       Behavioral: Next arrow advances index with circular wrapping.
 *   @spec BBC-020-SPEC-01-ARROWS-NAV-PREV       Behavioral: Prev arrow decrements index with circular wrapping.
 *   @spec BBC-020-SPEC-01-ARROWS-PROPAGATION    Behavioral: Clicks on arrows call stopPropagation.
 *   @spec BBC-020-SPEC-01-ARROWS-GLASSMORPHISM  Structural: Glassmorphism corner-spanning overlay classes/styles.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectPhaseMediaCard } from "@/components/dashboard/project-phase-media-card";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const PHASE_NAME = "6. Construcción de estructuras y muros";

const multiImages = [
  "https://example.com/phase-photo-01.jpg",
  "https://example.com/phase-photo-02.jpg",
  "https://example.com/phase-photo-03.jpg",
];

const singleImage = [
  "https://example.com/phase-photo-01.jpg",
];

const emptyImages: string[] = [];

describe("BBC-020 SPEC-01: Glassmorphic Corner Navigation Arrows in ProjectPhaseMediaCard", () => {
  // ─── 1. VISIBILITY TESTS ───────────────────────────────────────────────────

  describe("Visibility Constraints (@spec BBC-020-SPEC-01-ARROWS-VISIBILITY)", () => {
    it("should render both prev and next navigation arrows when images.length > 1", () => {
      // Arrange & Act
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      // Assert
      const prevBtn = screen.getByTestId("phase-media-arrow-prev");
      const nextBtn = screen.getByTestId("phase-media-arrow-next");
      expect(prevBtn).toBeInTheDocument();
      expect(nextBtn).toBeInTheDocument();
    });

    it("should NOT render navigation arrows when images array has only 1 image", () => {
      // Arrange & Act
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={singleImage}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      // Assert
      expect(screen.queryByTestId("phase-media-arrow-prev")).not.toBeInTheDocument();
      expect(screen.queryByTestId("phase-media-arrow-next")).not.toBeInTheDocument();
    });

    it("should NOT render navigation arrows when images array is empty (fallback state)", () => {
      // Arrange & Act
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={emptyImages}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      // Assert
      expect(screen.queryByTestId("phase-media-arrow-prev")).not.toBeInTheDocument();
      expect(screen.queryByTestId("phase-media-arrow-next")).not.toBeInTheDocument();
    });
  });

  // ─── 2. ACCESSIBILITY TESTS ────────────────────────────────────────────────

  describe("Accessibility Attributes (@spec BBC-020-SPEC-01-ARROWS-ACCESSIBILITY)", () => {
    it("should have descriptive aria-label and type='button' on both arrows", () => {
      // Arrange & Act
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      // Assert
      const prevBtn = screen.getByTestId("phase-media-arrow-prev");
      const nextBtn = screen.getByTestId("phase-media-arrow-next");

      expect(prevBtn).toHaveAttribute("type", "button");
      expect(prevBtn).toHaveAttribute("aria-label", "Ver imagen anterior");

      expect(nextBtn).toHaveAttribute("type", "button");
      expect(nextBtn).toHaveAttribute("aria-label", "Ver siguiente imagen");
    });
  });

  // ─── 3. NAVIGATION BEHAVIOR TESTS (CONTROLLED & UNCONTROLLED) ──────────────

  describe("Navigation Controls (@spec BBC-020-SPEC-01-ARROWS-NAV-NEXT & NAV-PREV)", () => {
    it("should call onIndexChange with next index when next arrow is clicked in controlled mode", () => {
      // Arrange
      const handleIndexChange = vi.fn();
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
          activeIndex={0}
          onIndexChange={handleIndexChange}
        />
      );

      // Act
      const nextBtn = screen.getByTestId("phase-media-arrow-next");
      fireEvent.click(nextBtn);

      // Assert
      expect(handleIndexChange).toHaveBeenCalledTimes(1);
      expect(handleIndexChange).toHaveBeenCalledWith(1);
    });

    it("should wrap around to index 0 when next arrow is clicked on the last image", () => {
      // Arrange
      const handleIndexChange = vi.fn();
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
          activeIndex={2} // Last image (total 3)
          onIndexChange={handleIndexChange}
        />
      );

      // Act
      const nextBtn = screen.getByTestId("phase-media-arrow-next");
      fireEvent.click(nextBtn);

      // Assert: (2 + 1) % 3 = 0
      expect(handleIndexChange).toHaveBeenCalledTimes(1);
      expect(handleIndexChange).toHaveBeenCalledWith(0);
    });

    it("should wrap around to last index when prev arrow is clicked on index 0", () => {
      // Arrange
      const handleIndexChange = vi.fn();
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
          activeIndex={0}
          onIndexChange={handleIndexChange}
        />
      );

      // Act
      const prevBtn = screen.getByTestId("phase-media-arrow-prev");
      fireEvent.click(prevBtn);

      // Assert: (0 - 1 + 3) % 3 = 2
      expect(handleIndexChange).toHaveBeenCalledTimes(1);
      expect(handleIndexChange).toHaveBeenCalledWith(2);
    });

    it("should advance internal index and update displayed image in uncontrolled mode", () => {
      // Arrange
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      const realImg = screen.getByTestId("phase-real-image");
      expect(realImg).toHaveAttribute("src", multiImages[0]);

      // Act: Click next arrow
      const nextBtn = screen.getByTestId("phase-media-arrow-next");
      fireEvent.click(nextBtn);

      // Assert: Image src switches to second photo
      expect(screen.getByTestId("phase-real-image")).toHaveAttribute("src", multiImages[1]);
    });
  });

  // ─── 4. EVENT PROPAGATION PREVENTION ───────────────────────────────────────

  describe("Event Propagation (@spec BBC-020-SPEC-01-ARROWS-PROPAGATION)", () => {
    it("should call event.stopPropagation() when clicking on prev arrow", () => {
      // Arrange
      const cardClickSpy = vi.fn();
      render(
        <div onClick={cardClickSpy}>
          <ProjectPhaseMediaCard
            phaseName={PHASE_NAME}
            images={multiImages}
            isDark={true}
            onHoverChange={() => {}}
          />
        </div>
      );

      // Act
      const prevBtn = screen.getByTestId("phase-media-arrow-prev");
      fireEvent.click(prevBtn);

      // Assert: Parent click should NOT have been called
      expect(cardClickSpy).not.toHaveBeenCalled();
    });

    it("should call event.stopPropagation() when clicking on next arrow", () => {
      // Arrange
      const cardClickSpy = vi.fn();
      render(
        <div onClick={cardClickSpy}>
          <ProjectPhaseMediaCard
            phaseName={PHASE_NAME}
            images={multiImages}
            isDark={true}
            onHoverChange={() => {}}
          />
        </div>
      );

      // Act
      const nextBtn = screen.getByTestId("phase-media-arrow-next");
      fireEvent.click(nextBtn);

      // Assert: Parent click should NOT have been called
      expect(cardClickSpy).not.toHaveBeenCalled();
    });
  });

  // ─── 5. GLASSMORPHISM CORNER STYLING ───────────────────────────────────────

  describe("Glassmorphism Corner Layout (@spec BBC-020-SPEC-01-ARROWS-GLASSMORPHISM)", () => {
    it("should position arrows spanning the full height of corners with backdrop blur", () => {
      // Arrange & Act
      render(
        <ProjectPhaseMediaCard
          phaseName={PHASE_NAME}
          images={multiImages}
          isDark={true}
          onHoverChange={() => {}}
        />
      );

      // Assert
      const prevBtn = screen.getByTestId("phase-media-arrow-prev");
      const nextBtn = screen.getByTestId("phase-media-arrow-next");

      // Check positioning styles
      expect(prevBtn).toHaveStyle({ position: "absolute", left: "0px", top: "0px", bottom: "0px" });
      expect(nextBtn).toHaveStyle({ position: "absolute", right: "0px", top: "0px", bottom: "0px" });
    });
  });
});
