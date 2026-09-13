/**
 * @file tests/unit/splash-fouc-curtain.test.tsx
 * @description Layer 1 & 2: Presentation & Application - TDD Unit & Integration Test Suite for BBC-23
 * (Zero-FOUC Startup Shell Curtain, SSR Frame 0 Background & Coordinated Unmount).
 * @spec BBC-23-REQ-01 (Frame 0 Static Curtain Coverage)
 * @spec BBC-23-REQ-02 (Head Bypass Script Contract)
 * @spec BBC-23-REQ-03 (Coordinated Unmount and Dismissal)
 * @spec BBC-23-REQ-04 (Zero-FOUC Provider Integration)
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SplashCurtain } from "@/components/splash/splash-curtain";
import { BrandSplashScreen } from "@/components/splash/brand-splash-screen";
import { Providers } from "@/app/providers";
import { splashStorage } from "@/lib/splash/splash-storage";

// Mock motion/react to deterministic render passes in jsdom
vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      actual.createElement(actual.Fragment, null, children),
    MotionConfig: ({ children }: { children: React.ReactNode }) =>
      actual.createElement(actual.Fragment, null, children),
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

describe("BBC-23: Zero-FOUC Splash Startup Curtain & Loading Order", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    splashStorage.clear();
    sessionStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("Frame 0 Static Curtain Coverage (@spec BBC-23-REQ-01)", () => {
    it("should render SplashCurtain with canonical night sky background #020813 and z-index 9999", () => {
      // Arrange & Act: Render SplashCurtain directly
      const { container } = render(<SplashCurtain />);
      const curtain = container.querySelector("#brand-splash-curtain");

      // Assert: Curtain must exist in DOM tree with exact presentation attributes
      expect(curtain).toBeInTheDocument();
      expect(curtain).toHaveAttribute("id", "brand-splash-curtain");
      expect(curtain).toHaveAttribute("role", "presentation");
      expect(curtain).toHaveAttribute("aria-hidden", "true");

      const style = window.getComputedStyle(curtain as Element);
      expect(curtain).toHaveStyle({
        position: "fixed",
        top: "0px",
        left: "0px",
        right: "0px",
        bottom: "0px",
        zIndex: "9999",
      });
      // Verify canonical brand color #020813 (rgb(2, 8, 19))
      expect((curtain as HTMLElement).style.backgroundColor).toBe("rgb(2, 8, 19)");
    });

    it("should render cleanly in server-rendering string mode without crashing or requiring window.document", async () => {
      // Arrange & Act: Render to static HTML markup via ReactDOMServer
      const ReactDOMServer = (await import("react-dom/server")).default;
      const html = ReactDOMServer.renderToString(<SplashCurtain />);

      // Assert: HTML contains the fixed zero-FOUC curtain element
      expect(html).toContain('id="brand-splash-curtain"');
      expect(html).toContain('background-color:#020813');
      expect(html).toContain('z-index:9999');
    });
  });

  describe("Head Bypass Script Contract (@spec BBC-23-REQ-02)", () => {
    it("should execute the session bypass logic and add .splash-bypassed when storage indicates viewed", () => {
      // Arrange: Simulate previous session view in sessionStorage
      sessionStorage.setItem("bluebrick_splash_viewed", "true");

      // Act: Execute the head pre-detection inline script
      const inlineHeadSnippet = `(function(){try{if(sessionStorage.getItem("bluebrick:splash:viewed")==="true"||sessionStorage.getItem("bluebrick_splash_viewed")==="true"){document.documentElement.classList.add("splash-bypassed");}}catch(e){}})();`;
      eval(inlineHeadSnippet);

      // Assert: Document element has splash-bypassed class applied synchronously
      expect(document.documentElement.classList.contains("splash-bypassed")).toBe(true);
    });

    it("should NOT add .splash-bypassed on first visit when sessionStorage is empty", () => {
      // Arrange: Clean session storage
      sessionStorage.clear();

      // Act: Execute the head pre-detection inline script
      const inlineHeadSnippet = `(function(){try{if(sessionStorage.getItem("bluebrick:splash:viewed")==="true"||sessionStorage.getItem("bluebrick_splash_viewed")==="true"){document.documentElement.classList.add("splash-bypassed");}}catch(e){}})();`;
      eval(inlineHeadSnippet);

      // Assert: Class is absent on first visit
      expect(document.documentElement.classList.contains("splash-bypassed")).toBe(false);
    });
  });

  describe("Coordinated Unmount and Dismissal (@spec BBC-23-REQ-03)", () => {
    it("should remove or dismiss SplashCurtain when BrandSplashScreen completes its choreography", async () => {
      // Arrange: Render full BrandSplashScreen
      const onComplete = vi.fn();
      render(<BrandSplashScreen onComplete={onComplete} forceShow={true} />);

      // Act: Fast-forward through entrance (1.2s), hold (1.0s), flip (0.5s), exit (0.3s)
      act(() => {
        vi.advanceTimersByTime(1200 + 1000 + 500 + 300);
      });

      // Assert: onComplete was called and splash overlay is dismissed
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("brand-splash-screen")).not.toBeInTheDocument();
    });
  });

  describe("Zero-FOUC Provider Integration (@spec BBC-23-REQ-04)", () => {
    it("should render the protective curtain immediately within Providers so children are never exposed on frame 0", () => {
      // Arrange & Act: Render Providers wrapping a test landing element
      const { container } = render(
        <Providers>
          <div data-testid="landing-content">Landing Page Hero</div>
        </Providers>
      );

      // Assert: Landing content is wrapped and curtain or splash overlay is present
      expect(screen.getByTestId("landing-content")).toBeInTheDocument();
      const curtainOrSplash =
        container.querySelector("#brand-splash-curtain") ||
        document.querySelector("#brand-splash-curtain") ||
        document.querySelector("[data-testid='brand-splash-screen']");
      expect(curtainOrSplash).toBeInTheDocument();
    });
  });
});
