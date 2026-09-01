/**
 * @file apps/web/src/lib/pipelines/micro-animation-tokens.ts
 * @description Layer 3: Domain / Pipelines - Centralized Micro-animation & Spring Physics Tokens.
 * Defines immutable constants for GPU-composited micro-interactions, scale thresholds,
 * spring damping/stiffness parameters, and Web Core Vitals invariants (CLS = 0, INP < 50ms).
 */

/**
 * Spring transition specification compatible with Motion 12 (motion/react).
 */
export interface SpringTransitionConfig {
  readonly type: "spring";
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/**
 * Immutable domain definition of micro-animation tokens.
 */
export const MICRO_ANIMATION_TOKENS = {
  // Step 1: Define subtle, non-exaggerated scale multipliers for interactive feedback
  scales: {
    // Large institutional cards (Hero cards: Total Invested, Portfolio Distribution)
    heroCard: 1.008,
    // Active project carousel container
    carouselCard: 1.005,
    // Metric chips and summary tags
    statChip: 1.02,
    // Secondary opportunity banners & deals
    opportunityCard: 1.02,
    // Interactive dotted milestone stepper dots
    milestoneDot: 1.28,
    // Media thumbnail previews in phase drawer
    mediaThumbnail: 1.04,
    // Navigation arrows (Chevrons)
    chevronButton: 1.12,
    // Standard interactive buttons on hover
    buttonHover: 1.03,
    // Tactile haptic feedback on click / tap (compression)
    buttonTap: 0.96,
  },

  // Step 2: High-frame-rate spring physics for tactile and fluid response
  spring: {
    tactile: {
      type: "spring" as const,
      stiffness: 380,
      damping: 24,
      mass: 0.8,
    },
    subtle: {
      type: "spring" as const,
      stiffness: 300,
      damping: 28,
      mass: 1.0,
    },
    bouncy: {
      type: "spring" as const,
      stiffness: 450,
      damping: 20,
      mass: 0.6,
    },
  },

  // Step 3: Web Core Vitals and CSS performance invariants
  coreWebVitals: {
    // CLS target is 0: Box model properties (width, height, margin, padding, top, left) are strictly forbidden
    targetCls: 0,
    // Interaction to Next Paint budget (< 50ms, ideal < 16ms on 60fps / 8ms on 120fps display)
    maxInpBudgetMs: 50,
    // Only GPU-composited properties allowed for micro-interactions
    clsSafeProperties: [
      "transform",
      "opacity",
      "filter",
      "box-shadow",
      "boxShadow",
      "background-color",
      "backgroundColor",
      "border-color",
      "borderColor",
      "color",
    ] as const,
    // Forbidden layout shifting properties
    forbiddenLayoutProperties: [
      "width",
      "height",
      "margin",
      "marginTop",
      "marginBottom",
      "marginLeft",
      "marginRight",
      "padding",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "top",
      "left",
      "bottom",
      "right",
    ] as const,
  },

  // Step 4: Visual luxury glows matching BlueBrick design tokens
  glows: {
    emerald: "0 8px 30px -4px rgba(47, 143, 107, 0.22), 0 0 1px 1px rgba(87, 185, 140, 0.35)",
    crimson: "0 8px 30px -4px rgba(196, 18, 48, 0.25), 0 0 1px 1px rgba(232, 73, 95, 0.35)",
    subtleCard: "0 12px 36px -6px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(237, 241, 245, 0.12)",
  },
} as const;

/**
 * Validates whether a CSS animated property conforms to the CLS = 0 Core Web Vitals rule.
 * 
 * @param propertyName - CSS property name in kebab-case or camelCase
 * @returns true if property is composited without causing layout reflow
 */
export function isPropertyClsSafe(propertyName: string): boolean {
  // Step 1: Check if the property explicitly exists in forbidden layout shift set
  const isForbidden = (MICRO_ANIMATION_TOKENS.coreWebVitals.forbiddenLayoutProperties as readonly string[]).includes(
    propertyName
  );
  if (isForbidden) {
    return false;
  }

  // Step 2: Validate against allowed composited properties
  return (MICRO_ANIMATION_TOKENS.coreWebVitals.clsSafeProperties as readonly string[]).includes(propertyName);
}

/**
 * Retrieves the standard spring transition configuration for micro-interactions.
 * 
 * @param variant - Optional spring preset ('tactile' | 'subtle' | 'bouncy')
 * @returns SpringTransitionConfig
 */
export function getSpringTransition(variant: "tactile" | "subtle" | "bouncy" = "tactile"): SpringTransitionConfig {
  // Step 1: Return the selected immutable preset
  return MICRO_ANIMATION_TOKENS.spring[variant];
}
