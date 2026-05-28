export type MotionDirection = "forward" | "back";
export type RouteTransitionMode = "page" | "navigation-origin";

export const MOTION_EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const MOTION_DURATION_FAST = 0.18;
export const MOTION_DURATION_MEDIUM = 0.26;
export const MOTION_DURATION_SLOW = 0.34;

export const MOTION_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9
} as const;

export const MOTION_FAST_OPACITY_TRANSITION = {
  duration: MOTION_DURATION_FAST,
  ease: MOTION_EASE_OUT
} as const;

export const MOTION_GENTLE_TRANSITION = {
  duration: MOTION_DURATION_MEDIUM,
  ease: MOTION_EASE_OUT
} as const;

export const MOTION_LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 0.85
} as const;

export const MOTION_PAGE_DISTANCE = 18;
export const MOTION_PANEL_DISTANCE = 10;
export const MOTION_DETAIL_DISTANCE = 14;
export const MOTION_THEME_DISTANCE = 8;
export const MOTION_NAVIGATION_ORIGIN_SCALE = 0.992;

export function createPageMotionVariants(direction: MotionDirection = "forward") {
  const startX = direction === "forward" ? MOTION_PAGE_DISTANCE : -MOTION_PAGE_DISTANCE;

  return {
    initial: {
      opacity: 0,
      x: startX,
      filter: "blur(2px)"
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: MOTION_DEFAULT_TRANSITION
    },
    exit: {
      opacity: 0,
      x: direction === "forward" ? -MOTION_PAGE_DISTANCE / 1.5 : MOTION_PAGE_DISTANCE / 1.5,
      filter: "blur(2px)",
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}

export function createNavigationOriginMotionVariants(origin: { x: number; y: number; radius: number }) {
  const clipPathTarget = `circle(${origin.radius}px at ${origin.x}px ${origin.y}px)`;

  return {
    initial: {
      opacity: 0,
      scale: MOTION_NAVIGATION_ORIGIN_SCALE,
      clipPath: `circle(0px at ${origin.x}px ${origin.y}px)`,
      transformOrigin: `${origin.x}px ${origin.y}px`
    },
    animate: {
      opacity: 1,
      scale: 1,
      clipPath: clipPathTarget,
      transformOrigin: `${origin.x}px ${origin.y}px`,
      transition: MOTION_DEFAULT_TRANSITION
    },
    exit: {
      opacity: 0,
      scale: 0.996,
      clipPath: clipPathTarget,
      transformOrigin: `${origin.x}px ${origin.y}px`,
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}

export function createPanelMotionVariants() {
  return {
    initial: {
      opacity: 0,
      y: MOTION_PANEL_DISTANCE,
      scale: 0.985
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: MOTION_GENTLE_TRANSITION
    },
    exit: {
      opacity: 0,
      y: -MOTION_PANEL_DISTANCE / 2,
      scale: 0.985,
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}

export function createDetailOpenMotionVariants() {
  return {
    initial: {
      opacity: 0,
      y: MOTION_DETAIL_DISTANCE,
      scale: 0.992
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: MOTION_DEFAULT_TRANSITION
    },
    exit: {
      opacity: 0,
      y: -MOTION_DETAIL_DISTANCE / 2,
      scale: 0.992,
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}

export function createThemeMotionVariants() {
  return {
    initial: {
      opacity: 0,
      scale: 0.995,
      y: MOTION_THEME_DISTANCE
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: MOTION_GENTLE_TRANSITION
    },
    exit: {
      opacity: 0,
      scale: 0.995,
      y: -MOTION_THEME_DISTANCE / 2,
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}

export function createLoadingMotionVariants() {
  return {
    initial: {
      opacity: 0.78,
      scale: 0.996
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: MOTION_GENTLE_TRANSITION
    },
    exit: {
      opacity: 0,
      scale: 0.996,
      transition: MOTION_FAST_OPACITY_TRANSITION
    }
  } as const;
}
