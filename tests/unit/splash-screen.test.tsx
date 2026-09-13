/**
 * @file tests/unit/splash-screen.test.tsx
 * @description Layer 1 & 2: Presentation & Application - TDD Unit & Integration Test Suite for BBC-21
 * (Animated Brand Splash Screen with Motion 12, Decomposed Logo Isotype & Sequential Choreography).
 * @spec BBC-21-REQ-01 (SVG Decomposed Isotype)
 * @spec BBC-21-REQ-02 (Sequential Left-to-Right Entrance)
 * @spec BBC-21-REQ-03 (Hold State 5s & 3D Axial Flip)
 * @spec BBC-21-REQ-04 (Manual Skip & Portal Unmounting)
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrandSplashScreen } from "@/components/splash/brand-splash-screen";
import { AnimatedIsotypeVector } from "@/components/splash/animated-isotype-vector";
import { AnimatedWordmarkVector } from "@/components/splash/animated-wordmark-vector";
import {
  ISOTYPE_PIECES,
  ISOTYPE_VIEWBOX,
  WORDMARK_PATH_DATA,
  WORDMARK_VIEWBOX,
} from "@/lib/splash/isotype-geometry";
import { splashStorage } from "@/lib/splash/splash-storage";

// Mock motion/react to verify render contracts and SVG path attributes deterministically in jsdom
vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => actual.createElement(actual.Fragment, null, children),
    motion: {
      div: actual.forwardRef(({ children, ...props }: any, ref: any) =>
        actual.createElement("div", { ref, ...props }, children)
      ),
      svg: actual.forwardRef(({ children, ...props }: any, ref: any) =>
        actual.createElement("svg", { ref, ...props }, children)
      ),
      path: actual.forwardRef(({ children, ...props }: any, ref: any) =>
        actual.createElement("path", { ref, ...props }, children)
      ),
      span: actual.forwardRef(({ children, ...props }: any, ref: any) =>
        actual.createElement("span", { ref, ...props }, children)
      ),
    },
  };
});

describe("BBC-21: Brand Splash Screen & Isotype Motion Choreography", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    splashStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("SVG Isotype Decomposition (@spec BBC-21-REQ-01)", () => {
    it("should render exactly 4 decomposed isotype pieces in canonical order (left to right)", () => {
      // Step 1: Arrange & Act
      render(<AnimatedIsotypeVector phase="entering" size={140} />);

      // Step 2: Assert presence of all 4 pieces by their distinct IDs
      const smallWhite = screen.getByTestId("isotype-piece-small_white");
      const largeWhiteLeft = screen.getByTestId("isotype-piece-large_white_left");
      const largeWhiteRight = screen.getByTestId("isotype-piece-large_white_right");
      const accentRed = screen.getByTestId("isotype-piece-accent_red");

      expect(smallWhite).toBeInTheDocument();
      expect(largeWhiteLeft).toBeInTheDocument();
      expect(largeWhiteRight).toBeInTheDocument();
      expect(accentRed).toBeInTheDocument();

      // Step 3: Assert SVG viewBox matches canonical 160x168 coordinate box
      const svg = screen.getByRole("img", { name: /bluebrick brand mark/i });
      expect(svg).toHaveAttribute("viewBox", ISOTYPE_VIEWBOX);
    });

    it("should preserve exact geometric vector path coordinates for every isotype section", () => {
      // Step 1: Arrange & Act
      render(<AnimatedIsotypeVector phase="entering" size={140} />);

      // Step 2: Assert each path matches canonical d attributes
      ISOTYPE_PIECES.forEach((piece) => {
        const element = screen.getByTestId(`isotype-piece-${piece.id}`);
        expect(element).toHaveAttribute("d", piece.pathData);
        expect(element).toHaveAttribute("fill-rule", "evenodd");
      });
    });

    it("should apply initial white and red brand fills during entrance and holding phases", () => {
      // Step 1: Arrange & Act
      const { rerender } = render(<AnimatedIsotypeVector phase="entering" />);

      const redPiece = screen.getByTestId("isotype-piece-accent_red");
      const whitePiece = screen.getByTestId("isotype-piece-small_white");

      expect(redPiece).toHaveAttribute("fill", "#FC040C");
      expect(whitePiece).toHaveAttribute("fill", "#FFFFFF");

      // Step 2: During hold phase, colors remain initial
      rerender(<AnimatedIsotypeVector phase="holding" />);
      expect(redPiece).toHaveAttribute("fill", "#FC040C");
      expect(whitePiece).toHaveAttribute("fill", "#FFFFFF");
    });

    it("should transition to secondary palette during flipping phase (@spec BBC-21-REQ-03)", () => {
      // Step 1: Arrange & Act with flipping phase
      render(<AnimatedIsotypeVector phase="flipping" />);

      const redPiece = screen.getByTestId("isotype-piece-accent_red");
      const whitePiece = screen.getByTestId("isotype-piece-small_white");
      const largeWhite1 = screen.getByTestId("isotype-piece-large_white_left");

      // Step 2: Verify secondary fill colors are applied
      expect(redPiece).toHaveAttribute("fill", "#E0030A");
      expect(whitePiece).toHaveAttribute("fill", "#04283C");
      expect(largeWhite1).toHaveAttribute("fill", "#04283C");
    });
  });

  describe("Official Brand Wordmark Vector (@spec BBC-21-REQ-01)", () => {
    it("should render official SVG vector typography letters rather than plain font text", () => {
      // Step 1: Arrange & Act
      render(<AnimatedWordmarkVector phase="holding" width={220} />);

      // Step 2: Assert SVG wordmark element and attributes
      const wordmark = screen.getByTestId("animated-wordmark-vector");
      expect(wordmark).toBeInTheDocument();
      expect(wordmark).toHaveAttribute("viewBox", WORDMARK_VIEWBOX);

      const path = wordmark.querySelector("path");
      expect(path).toHaveAttribute("d", WORDMARK_PATH_DATA);
      expect(path).toHaveAttribute("fill-rule", "evenodd");
    });

    it("should render official vector letters inside BrandSplashScreen when showWordmark is true", () => {
      render(<BrandSplashScreen forceShow={true} showWordmark={true} />);

      // Step 1: Assert official vector wordmark is rendered
      expect(screen.getByTestId("animated-wordmark-vector")).toBeInTheDocument();
    });

    it("should omit wordmark vector when showWordmark is explicitly disabled", () => {
      render(<BrandSplashScreen forceShow={true} showWordmark={false} />);

      // Step 1: Assert wordmark is omitted
      expect(screen.queryByTestId("animated-wordmark-vector")).not.toBeInTheDocument();
    });
  });

  describe("BrandSplashScreen State Machine & Timings (@spec BBC-21-REQ-02, BBC-21-REQ-03)", () => {
    it("should execute the full 4-phase sequence and invoke onComplete after total elapsed time", () => {
      const onCompleteSpy = vi.fn();

      // Step 1: Render with forceShow = true to ignore any session flags
      render(<BrandSplashScreen onComplete={onCompleteSpy} forceShow={true} />);

      // Overlay should be visible initially
      expect(screen.getByTestId("brand-splash-screen")).toBeInTheDocument();
      expect(onCompleteSpy).not.toHaveBeenCalled();

      // Step 2: Advance through entering (1200ms) -> holding
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      expect(onCompleteSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId("brand-splash-screen")).toBeInTheDocument();

      // Step 3: Advance through 1000ms holding phase -> flipping
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onCompleteSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId("brand-splash-screen")).toBeInTheDocument();

      // Step 4: Advance through 500ms flipping phase -> exiting
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onCompleteSpy).not.toHaveBeenCalled();

      // Step 5: Advance through 300ms exiting phase -> completed
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Complete lifecycle finished
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it("should allow fast-forward manual dismissal on user click (@spec BBC-21-REQ-04)", () => {
      const onCompleteSpy = vi.fn();
      render(<BrandSplashScreen onComplete={onCompleteSpy} forceShow={true} />);

      const overlay = screen.getByTestId("brand-splash-screen");
      expect(overlay).toBeInTheDocument();

      // Click to fast-forward/skip
      act(() => {
        fireEvent.click(overlay);
      });

      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
      // Splash should mark session storage as viewed
      expect(splashStorage.hasViewed()).toBe(true);
    });

    it("should bypass splash screen immediately when already viewed in current session", () => {
      // Step 1: Set storage flag as already viewed
      splashStorage.markAsViewed();
      const onCompleteSpy = vi.fn();

      // Step 2: Render without forceShow
      render(<BrandSplashScreen onComplete={onCompleteSpy} forceShow={false} />);

      // Flush immediate zero-timer
      act(() => {
        vi.advanceTimersByTime(10);
      });

      // Splash should not render overlay and trigger onComplete immediately
      expect(screen.queryByTestId("brand-splash-screen")).not.toBeInTheDocument();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it("should force display even when previously viewed if forceShow is enabled", () => {
      splashStorage.markAsViewed();
      const onCompleteSpy = vi.fn();

      render(<BrandSplashScreen onComplete={onCompleteSpy} forceShow={true} />);

      act(() => {
        vi.advanceTimersByTime(10);
      });

      // Splash overlay MUST remain visible because forceShow is true
      expect(screen.getByTestId("brand-splash-screen")).toBeInTheDocument();
      expect(onCompleteSpy).not.toHaveBeenCalled();
    });

    it("should synchronously eliminate ghost mounts on frame 0 when previously viewed (@spec BBC-22-REQ-02)", () => {
      // Step 1: Set storage flag as already viewed
      splashStorage.markAsViewed();
      const onCompleteSpy = vi.fn();

      // Step 2: Render without advancing any timers (frame 0 check)
      render(<BrandSplashScreen onComplete={onCompleteSpy} forceShow={false} />);

      // Assert that on the very first synchronous paint pass, the splash overlay is NOT in the DOM
      expect(screen.queryByTestId("brand-splash-screen")).toBeNull();
    });
  });

  describe("BBC-22: GPU Hardware Acceleration & 3D Compositing Stage (@spec BBC-22-REQ-01)", () => {
    it("should wrap isotype in a hardware-accelerated 3D DOM stage container", () => {
      // Step 1: Render AnimatedIsotypeVector
      render(<AnimatedIsotypeVector phase="flipping" size={140} />);

      // Step 2: Query the outer 3D stage container
      const stage = screen.getByTestId("isotype-3d-stage");
      expect(stage).toBeInTheDocument();

      // Step 3: Assert GPU hardware compositing and 3D perspective styles
      expect(stage).toHaveStyle({
        transformStyle: "preserve-3d",
        willChange: "transform",
      });
    });
  });
});
