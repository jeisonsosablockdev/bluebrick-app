import { describe, expect, it } from "vitest";

import {
  MOTION_DEFAULT_TRANSITION,
  MOTION_DETAIL_DISTANCE,
  MOTION_PAGE_DISTANCE,
  MOTION_PANEL_DISTANCE,
  MOTION_NAVIGATION_ORIGIN_SCALE,
  MOTION_THEME_DISTANCE,
  createDetailOpenMotionVariants,
  createNavigationFallbackMotionVariants,
  createNavigationOriginMotionVariants,
  createPageMotionVariants,
  createPanelMotionVariants,
  createReducedMotionVariants,
  createThemeMotionVariants,
  shouldUseReducedMotion
} from "@/lib/motion";

describe("lib/motion", () => {
  it("defines a spring-first motion baseline for the app", () => {
    expect(MOTION_DEFAULT_TRANSITION).toMatchObject({
      type: "spring",
      stiffness: 420,
      damping: 34
    });
  });

  it("creates direction-aware page motion variants", () => {
    const forward = createPageMotionVariants("forward");
    const back = createPageMotionVariants("back");

    expect(forward.initial.x).toBe(MOTION_PAGE_DISTANCE);
    expect(back.initial.x).toBe(-MOTION_PAGE_DISTANCE);
    expect(forward.animate.x).toBe(0);
    expect(back.animate.opacity).toBe(1);
  });

  it("creates reusable panel motion variants", () => {
    const variants = createPanelMotionVariants();

    expect(variants.initial.y).toBe(MOTION_PANEL_DISTANCE);
    expect(variants.animate.scale).toBe(1);
    expect(variants.exit.opacity).toBe(0);
  });

  it("creates detail and theme variants for later slices", () => {
    const detailVariants = createDetailOpenMotionVariants();
    const themeVariants = createThemeMotionVariants();

    expect(detailVariants.initial.y).toBe(MOTION_DETAIL_DISTANCE);
    expect(themeVariants.initial.y).toBe(MOTION_THEME_DISTANCE);
  });

  it("creates navigation-origin variants that expand from the trigger point", () => {
    const variants = createNavigationOriginMotionVariants({
      x: 120,
      y: 48,
      radius: 960
    });

    expect(variants.initial.clipPath).toBe("circle(0px at 120px 48px)");
    expect(variants.animate.clipPath).toBe("circle(960px at 120px 48px)");
    expect(variants.initial.scale).toBe(MOTION_NAVIGATION_ORIGIN_SCALE);
  });

  it("keeps navigation fallback transitions sharp for refresh-only updates", () => {
    const variants = createNavigationFallbackMotionVariants();

    expect("filter" in variants.initial).toBe(false);
    expect("filter" in variants.animate).toBe(false);
    expect(variants.animate.opacity).toBe(1);
  });

  it("creates reduced-motion route variants without transform or filter motion", () => {
    const variants = createReducedMotionVariants();

    expect(variants.initial.opacity).toBe(1);
    expect("x" in variants.initial).toBe(false);
    expect("scale" in variants.initial).toBe(false);
    expect("filter" in variants.initial).toBe(false);
    expect(variants.animate.transition.duration).toBe(0);
    expect(variants.exit.opacity).toBe(1);
  });

  it("detects explicit reduced-motion preference from Motion", () => {
    expect(shouldUseReducedMotion(true)).toBe(true);
    expect(shouldUseReducedMotion(false)).toBe(false);
  });
});
