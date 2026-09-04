/**
 * @file apps/web/src/features/image-detail/image-detail-modal.test.tsx
 * @description Layer 1 Presentation & Layer 3 Domain: Unit & Behavioral Test Suite
 * for ImageDetailModal, Zoom Guard Mathematical Constraints, and Accessible Gestures.
 * @spec BBC-020-SPEC-03
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import {
  ImageDetailModal,
  calculateFitScale,
  calculateMaxScale,
  clampScale,
  useImageZoom,
} from "./index";

describe("BBC-020 SPEC-03: Image Detail FDD Feature", () => {
  describe("Zoom Guard Mathematical Engine (Layer 3 Domain Invariants)", () => {
    it("calculateFitScale should compute minimum aspect scale clamped to 1.0", () => {
      // Step 1: Image larger than viewport (800x600 in 400x300 viewport -> 0.5)
      expect(
        calculateFitScale({ width: 400, height: 300 }, { width: 800, height: 600 })
      ).toBe(0.5);

      // Step 2: Image smaller than viewport (400x300 in 800x600 viewport -> capped at 1.0)
      expect(
        calculateFitScale({ width: 800, height: 600 }, { width: 400, height: 300 })
      ).toBe(1.0);

      // Step 3: Zero or negative dimension guards
      expect(
        calculateFitScale({ width: 0, height: 600 }, { width: 800, height: 600 })
      ).toBe(1);
      expect(
        calculateFitScale({ width: 800, height: 0 }, { width: 800, height: 600 })
      ).toBe(1);
    });

    it("calculateMaxScale should return native 1:1 ceiling (1 / fitScale) and never allow pixelation", () => {
      // Step 1: When image is scaled down to 0.5 to fit, 100% native scale is 1 / 0.5 = 2.0
      expect(calculateMaxScale(0.5)).toBe(2.0);

      // Step 2: When image is already at 1:1 fit (fitScale = 1.0), maxScale is 1.0 (no digital upsampling)
      expect(calculateMaxScale(1.0)).toBe(1.0);

      // Step 3: Edge cases (0 or negative fitScale returns 1)
      expect(calculateMaxScale(0)).toBe(1);
      expect(calculateMaxScale(-1)).toBe(1);
    });

    it("clampScale should restrict scale strictly within [minScale, maxScale]", () => {
      expect(clampScale(0.2, 0.5, 2.0)).toBe(0.5);
      expect(clampScale(1.2, 0.5, 2.0)).toBe(1.2);
      expect(clampScale(3.5, 0.5, 2.0)).toBe(2.0);
      expect(clampScale(NaN, 1.0, 2.0)).toBe(1.0);
    });
  });

  describe("useImageZoom Hook (Layer 2 Application)", () => {
    it("should initialize with default scale, fitScale, and pan offset", () => {
      const { result } = renderHook(() => useImageZoom());

      expect(result.current.scale).toBe(1.0);
      expect(result.current.fitScale).toBe(1.0);
      expect(result.current.isZoomed).toBe(false);
      expect(result.current.panOffset).toEqual({ x: 0, y: 0 });
    });

    it("should increment scale with zoomIn up to maxScale", () => {
      const { result } = renderHook(() =>
        useImageZoom({
          scaleStep: 0.25,
          viewport: { width: 800, height: 600 },
        })
      );

      // Simulate fitScale 0.5 (maxScale 2.0)
      act(() => {
        result.current.handleImageLoad({
          currentTarget: { naturalWidth: 1600, naturalHeight: 1200 },
        } as unknown as React.SyntheticEvent<HTMLImageElement>);
      });

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.scale).toBe(1.25);
      expect(result.current.isZoomed).toBe(true);
    });

    it("should reset pan offset when zoomed out to fitScale", () => {
      const { result } = renderHook(() =>
        useImageZoom({
          scaleStep: 0.25,
          viewport: { width: 800, height: 600 },
        })
      );

      act(() => {
        result.current.handleImageLoad({
          currentTarget: { naturalWidth: 1600, naturalHeight: 1200 },
        } as unknown as React.SyntheticEvent<HTMLImageElement>);
      });

      act(() => {
        result.current.zoomIn();
      });

      act(() => {
        result.current.handlePanStart(100, 100);
        result.current.handlePanMove(150, 150);
        result.current.handlePanEnd();
      });

      expect(result.current.panOffset).toEqual({ x: 50, y: 50 });

      act(() => {
        result.current.resetZoom();
      });

      expect(result.current.scale).toBe(1.0);
      expect(result.current.panOffset).toEqual({ x: 0, y: 0 });
    });
  });

  describe("ImageDetailModal Presentation (Layer 1 WAI-ARIA & Lifecycle)", () => {
    const mockImages = [
      "https://example.com/photo-1.jpg",
      "https://example.com/photo-2.jpg",
      "https://example.com/photo-3.jpg",
    ];

    it("should render null when isOpen is false (Strict Unmount Invariant)", () => {
      const { container } = render(
        <ImageDetailModal
          isOpen={false}
          onClose={vi.fn()}
          images={mockImages}
        />
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should render accessible dialog portal when isOpen is true", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={mockImages}
          title="Prueba de Fotografía"
          phaseName="Fase 3 — Cimentación"
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(screen.getByText("Prueba de Fotografía")).toBeInTheDocument();
      expect(screen.getByText("Fase 3 — Cimentación")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      const image = screen.getByAltText("Prueba de Fotografía");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", mockImages[0]);
    });

    it("should call onClose when close button is clicked", () => {
      const onCloseSpy = vi.fn();
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={onCloseSpy}
          images={mockImages}
        />
      );

      const closeButton = screen.getByLabelText("Cerrar detalle de imagen");
      fireEvent.click(closeButton);

      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });

    it("should close modal when pressing Escape key", () => {
      const onCloseSpy = vi.fn();
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={onCloseSpy}
          images={mockImages}
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });

    it("should navigate to next and previous image via navigation buttons", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={mockImages}
          initialIndex={0}
        />
      );

      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      // Click Next
      const nextBtn = screen.getByLabelText("Imagen siguiente");
      fireEvent.click(nextBtn);
      expect(screen.getByText("2 / 3")).toBeInTheDocument();

      // Click Next again
      fireEvent.click(nextBtn);
      expect(screen.getByText("3 / 3")).toBeInTheDocument();

      // Click Next circularly wraps to 1
      fireEvent.click(nextBtn);
      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      // Click Prev circularly wraps to 3
      const prevBtn = screen.getByLabelText("Imagen anterior");
      fireEvent.click(prevBtn);
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("should navigate with keyboard ArrowLeft and ArrowRight", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={mockImages}
          initialIndex={0}
        />
      );

      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      // ArrowRight advances
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText("2 / 3")).toBeInTheDocument();

      // ArrowLeft goes back
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("should not show navigation arrows when only 1 image exists", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://example.com/single.jpg"]}
        />
      );

      expect(screen.queryByLabelText("Imagen siguiente")).toBeNull();
      expect(screen.queryByLabelText("Imagen anterior")).toBeNull();
      expect(screen.queryByText("1 / 1")).toBeNull();
    });

    it("should render translucent glassmorphic backdrop with blur (SPEC-04)", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={mockImages}
        />
      );

      const backdrop = screen.getByTestId("image-detail-backdrop");
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.className).toContain("backdrop-blur");
      expect(backdrop.style.backdropFilter).toContain("blur");
    });

    it("should render centered header text container (SPEC-04)", () => {
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={mockImages}
          title="Foto de Estructura"
          phaseName="Fase 4"
        />
      );

      const headerContent = screen.getByTestId("image-detail-header-content");
      expect(headerContent).toBeInTheDocument();
      expect(headerContent.className).toContain("justify-center");
    });

    describe("Multi-Phase Project Traversal & Animated Header Feedback (SPEC-08)", () => {
      const mockMultiPhasePhotos = [
        {
          phaseName: "1. Adquisición y Licencias",
          images: ["https://example.com/cw-phase1-photo1.jpg"],
        },
        {
          phaseName: "3. Cimentación y Estructura",
          images: [
            "https://example.com/cw-phase3-photo1.jpg",
            "https://example.com/cw-phase3-photo2.jpg",
          ],
        },
      ];

      it("should navigate sequentially across phases and update phase badge and title", () => {
        // Step 1: Render modal initialized with Phase 1 photo
        render(
          <ImageDetailModal
            isOpen={true}
            onClose={vi.fn()}
            images={mockMultiPhasePhotos[0]!.images}
            phaseName={mockMultiPhasePhotos[0]!.phaseName}
            allPhasesPhotos={mockMultiPhasePhotos}
          />
        );

        // Verify initial state: Phase 1, photo 1 / 3
        expect(screen.getByText("1. Adquisición y Licencias")).toBeInTheDocument();
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "https://example.com/cw-phase1-photo1.jpg");

        // Step 2: Click next -> navigates to Phase 3 photo 1
        const nextBtn = screen.getByLabelText("Imagen siguiente");
        fireEvent.click(nextBtn);

        expect(screen.getByText("3. Cimentación y Estructura")).toBeInTheDocument();
        expect(screen.getByText("2 / 3")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/cw-phase3-photo1.jpg");

        // Step 3: Click next -> navigates to Phase 3 photo 2
        fireEvent.click(nextBtn);
        expect(screen.getByText("3. Cimentación y Estructura")).toBeInTheDocument();
        expect(screen.getByText("3 / 3")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/cw-phase3-photo2.jpg");

        // Step 4: Click next -> wraps back to Phase 1 photo 1
        fireEvent.click(nextBtn);
        expect(screen.getByText("1. Adquisición y Licencias")).toBeInTheDocument();
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/cw-phase1-photo1.jpg");
      });

      it("should navigate backward across phases via previous button", () => {
        // Step 1: Render modal at Phase 1
        render(
          <ImageDetailModal
            isOpen={true}
            onClose={vi.fn()}
            images={mockMultiPhasePhotos[0]!.images}
            phaseName={mockMultiPhasePhotos[0]!.phaseName}
            allPhasesPhotos={mockMultiPhasePhotos}
          />
        );

        // Step 2: Click prev -> wraps backward to Phase 3 photo 2
        const prevBtn = screen.getByLabelText("Imagen anterior");
        fireEvent.click(prevBtn);

        expect(screen.getByText("3. Cimentación y Estructura")).toBeInTheDocument();
        expect(screen.getByText("3 / 3")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/cw-phase3-photo2.jpg");
      });

      it("should render animated phase header badge container", () => {
        render(
          <ImageDetailModal
            isOpen={true}
            onClose={vi.fn()}
            images={mockMultiPhasePhotos[0]!.images}
            phaseName={mockMultiPhasePhotos[0]!.phaseName}
            allPhasesPhotos={mockMultiPhasePhotos}
          />
        );

        const phaseBadge = screen.getByTestId("image-detail-phase-badge");
        expect(phaseBadge).toBeInTheDocument();
        expect(phaseBadge).toHaveTextContent("1. Adquisición y Licencias");
      });
    });
  });

  // ─── SPEC-09: Modal Fallback Validation ──────────────────────────────────────

  describe("BBC-020 SPEC-09: Modal Fallback Validation", () => {
    /**
     * Helper: simulate a native img onError event on the first role="img" element.
     */
    function triggerImageError(imgElement: HTMLElement) {
      fireEvent.error(imgElement);
    }

    it("T09-1: renders compact fallback card when onError fires for current photo", () => {
      // Arrange: Modal open with a single dead URL
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act: Simulate image load error
      const img = screen.getByRole("img");
      triggerImageError(img);

      // Assert: fallback card shown, photo img (broken URL) is gone
      expect(screen.getByTestId("modal-fallback-card")).toBeInTheDocument();
      // The fallback card itself contains logo imgs, so we target the photo by src.
      expect(
        document.querySelector('img[src="https://dead.example.com/broken.jpg"]')
      ).not.toBeInTheDocument();
    });

    it("T09-2: fallback card is compact (not full-viewport) and shows phase name label", () => {
      // Arrange
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act
      triggerImageError(screen.getByRole("img"));

      // Assert: fallback present with bounded dimensions and phase label
      const fallback = screen.getByTestId("modal-fallback-card");
      expect(fallback).toBeInTheDocument();
      expect(fallback.className).not.toMatch(/w-full h-full|h-screen|w-screen/);
      expect(screen.getByTestId("modal-fallback-phase-label")).toHaveTextContent(
        "5. Demoliciones y/o cimentación"
      );
    });

    it("T09-3: navigating from a broken photo to the next shows that photo normally", () => {
      // Arrange: Two photos — first broken, second valid
      const photos = [
        "https://dead.example.com/broken.jpg",
        "https://example.com/valid.jpg",
      ];
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={photos}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act: error on first photo then navigate next
      triggerImageError(screen.getByRole("img"));
      expect(screen.getByTestId("modal-fallback-card")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Imagen siguiente"));

      // Assert: fallback gone, real img shown for second URL
      expect(screen.queryByTestId("modal-fallback-card")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/valid.jpg");
    });

    it("T09-4: error on index 0 does NOT affect index 1 (independent per-index state)", () => {
      // Arrange
      const photos = [
        "https://dead.example.com/broken.jpg",
        "https://example.com/valid.jpg",
      ];
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={photos}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act: error index 0, navigate to index 1
      triggerImageError(screen.getByRole("img"));
      fireEvent.click(screen.getByLabelText("Imagen siguiente"));

      // Assert: index 1 shows real img, no fallback
      expect(screen.queryByTestId("modal-fallback-card")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/valid.jpg");
    });

    it("T09-5: zoom control bar is hidden when current image is in error state", () => {
      // Arrange
      render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act
      triggerImageError(screen.getByRole("img"));

      // Assert: zoom controls absent
      expect(screen.queryByLabelText("Aumentar zoom")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Reducir zoom")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Restablecer zoom")).not.toBeInTheDocument();
    });

    it("T09-6: error set resets when modal is closed and reopened", () => {
      // Arrange
      const { rerender } = render(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Act: error → close → reopen
      triggerImageError(screen.getByRole("img"));
      expect(screen.getByTestId("modal-fallback-card")).toBeInTheDocument();

      rerender(
        <ImageDetailModal
          isOpen={false}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );
      rerender(
        <ImageDetailModal
          isOpen={true}
          onClose={vi.fn()}
          images={["https://dead.example.com/broken.jpg"]}
          phaseName="5. Demoliciones y/o cimentación"
        />
      );

      // Assert: img rendered again (error state cleared on re-open)
      expect(screen.queryByTestId("modal-fallback-card")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "https://dead.example.com/broken.jpg"
      );
    });
  });
});
