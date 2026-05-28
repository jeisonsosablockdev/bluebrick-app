import { describe, expect, it } from "vitest";

import {
  MOTION_DEFAULT_TRANSITION,
  MOTION_DETAIL_DISTANCE,
  MOTION_PAGE_DISTANCE,
  MOTION_PANEL_DISTANCE,
  MOTION_THEME_DISTANCE,
  createDetailOpenMotionVariants,
  createPageMotionVariants,
  createPanelMotionVariants,
  createThemeMotionVariants
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
});
