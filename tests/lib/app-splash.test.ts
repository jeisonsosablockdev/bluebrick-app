// @vitest-environment jsdom

import { describe, expect, it, afterEach, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";

// Mock next/image since we are rendering in jsdom
vi.mock("next/image", () => ({
  default: ({ src, alt, className, ...props }: any) => {
    return createElement("img", { src, alt, className, ...props });
  }
}));

import {
  APP_SPLASH_MARK_DELAY_MS,
  APP_SPLASH_MINIMUM_VISIBLE_MS,
  APP_SPLASH_NAME_INTRO_MS,
  getAppSplashExitDelay,
  shouldWaitForAppLoad
} from "@/lib/app-splash";
import { AppSplashScreen } from "@/components/brand/app-splash-screen";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderSplash(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(AppSplashScreen));
  });

  return { container, root };
}

describe("app splash contract", () => {
  it("keeps the splash visible for at least three seconds", () => {
    expect(APP_SPLASH_MINIMUM_VISIBLE_MS).toBe(3000);
    expect(getAppSplashExitDelay(350)).toBe(2650);
    expect(getAppSplashExitDelay(1200)).toBe(1800);
    expect(getAppSplashExitDelay(3200)).toBe(0);
  });

  it("stages the mark after the name intro", () => {
    expect(APP_SPLASH_NAME_INTRO_MS).toBeLessThanOrEqual(400);
    expect(APP_SPLASH_MARK_DELAY_MS).toBeGreaterThanOrEqual(APP_SPLASH_NAME_INTRO_MS);
  });

  it("waits for the app load event only while the document is not complete", () => {
    expect(shouldWaitForAppLoad("loading")).toBe(true);
    expect(shouldWaitForAppLoad("interactive")).toBe(true);
    expect(shouldWaitForAppLoad("complete")).toBe(false);
  });
});

describe("AppSplashScreen Component", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders the loading screen with status role and correct label", () => {
    const { container, root } = renderSplash();
    const splash = container.querySelector('[role="status"]');
    expect(splash).not.toBeNull();
    expect(splash?.getAttribute("aria-label")).toBe("BRIDS loading screen");
    act(() => {
      root.unmount();
    });
  });

  it("does not render the text BRIDS (logo only)", () => {
    const { container, root } = renderSplash();
    const nameEl = container.querySelector(".app-splash__name");
    expect(nameEl).toBeNull();
    expect(container.textContent).not.toContain("BRIDS");
    act(() => {
      root.unmount();
    });
  });

  it("renders the four background glow components for the animated lights", () => {
    const { container, root } = renderSplash();
    const glows = container.querySelectorAll(".app-splash__glow");
    expect(glows.length).toBe(4);
    act(() => {
      root.unmount();
    });
  });
});
