import { describe, expect, it } from "vitest";
import {
  createDetailOpenMotionVariants,
  createLoadingMotionVariants,
  createNavigationFallbackMotionVariants,
  createNavigationOriginMotionVariants,
  createPageMotionVariants,
  createPanelMotionVariants,
  createReducedMotionVariants,
  createThemeMotionVariants,
  shouldUseReducedMotion
} from "../../apps/web/src/features/shared/ui/motion/variants";
import * as MotionExports from "../../apps/web/src/features/shared/ui/motion";

describe("shared-motion animation engine (SPEC-25)", () => {
  it("generates forward page motion variants with correct initial/animate/exit states", () => {
    const variants = createPageMotionVariants("forward");
    expect(variants.initial).toBeDefined();
    expect(variants.initial.opacity).toBe(0);
    expect(variants.initial.x).toBeGreaterThan(0);
    expect(variants.animate.opacity).toBe(1);
    expect(variants.animate.x).toBe(0);
    expect(variants.exit.opacity).toBe(0);
    expect(variants.exit.x).toBeLessThan(0);
  });

  it("generates backward page motion variants with inverted x distance", () => {
    const variants = createPageMotionVariants("back");
    expect(variants.initial.x).toBeLessThan(0);
    expect(variants.exit.x).toBeGreaterThan(0);
  });

  it("generates navigation origin radial reveal variants", () => {
    const variants = createNavigationOriginMotionVariants({ x: 100, y: 200, radius: 800 });
    expect(variants.initial.clipPath).toBe("circle(0px at 100px 200px)");
    expect(variants.animate.clipPath).toBe("circle(800px at 100px 200px)");
  });

  it("generates reduced motion variants with zero animation duration", () => {
    const variants = createReducedMotionVariants();
    expect(variants.initial.opacity).toBe(1);
    expect(variants.animate.opacity).toBe(1);
    expect(variants.animate.transition.duration).toBe(0);
  });

  it("evaluates shouldUseReducedMotion accurately", () => {
    expect(shouldUseReducedMotion(true)).toBe(true);
    expect(shouldUseReducedMotion(false)).toBe(false);
    expect(shouldUseReducedMotion(null)).toBe(false);
  });

  it("generates panel, detail, theme, and loading variants", () => {
    const panel = createPanelMotionVariants();
    const detail = createDetailOpenMotionVariants();
    const theme = createThemeMotionVariants();
    const loading = createLoadingMotionVariants();

    expect(panel.animate.opacity).toBe(1);
    expect(detail.animate.opacity).toBe(1);
    expect(theme.animate.opacity).toBe(1);
    expect(loading.animate.opacity).toBe(1);
  });

  it("exports all motion primitives from public API boundary index.ts", () => {
    expect(MotionExports.MotionProvider).toBeDefined();
    expect(MotionExports.RouteTransition).toBeDefined();
    expect(MotionExports.PathRouteTransition).toBeDefined();
    expect(MotionExports.createPageMotionVariants).toBeDefined();
  });
});
