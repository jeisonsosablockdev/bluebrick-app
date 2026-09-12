/**
 * @file apps/web/src/lib/splash/types.ts
 * @description Layer 3: Domain / Pipelines - Strict domain types, state machine definitions,
 * and contract interfaces for the startup splash screen animation and optimization engine.
 */

import type { CSSProperties, ReactNode } from "react";

/**
 * Progression phases for the startup splash animation state machine.
 */
export type SplashPhase =
  | "idle"       // Initial state before choreography commences
  | "entering"   // Phase A: Sequential left-to-right entrance of isotype pieces (0.0s - 1.2s)
  | "holding"    // Phase B: Steady hold of fully assembled brand mark (~5.0s)
  | "flipping"   // Phase C: 3D axial rotation (rotateY: 180deg) & secondary color transition (~1.0s)
  | "exiting"    // Phase D: Dissolve / curtain reveal uncovering underlying web application (~0.6s)
  | "completed"; // Terminal state: Splash unmounted, user interaction fully active

/**
 * Unique identifiers for the four decomposed BlueBrick geometric isotype pieces.
 */
export type IsotypePieceId =
  | "small_white"        // Piece 1: Lower-left small white anchor bar
  | "large_white_left"   // Piece 2: Central-left large diagonal white bar
  | "large_white_right"  // Piece 3: Central-right large diagonal white bar
  | "accent_red";        // Piece 4: Top-right signature red brick accent

/**
 * Geometric configuration and motion metadata for an individual isotype piece.
 */
export interface IsotypePieceConfig {
  /** Canonical piece identifier */
  readonly id: IsotypePieceId;
  /** Human-readable descriptive name */
  readonly name: string;
  /** SVG path definition string (`d` attribute) */
  readonly pathData: string;
  /** Primary initial fill color (HEX) */
  readonly initialFill: string;
  /** Secondary fill color applied during 3D axial flip (HEX) */
  readonly secondaryFill: string;
  /** Chronological entrance sequence order (0-indexed) */
  readonly order: number;
  /** Stagger entrance delay in seconds */
  readonly delaySeconds: number;
  /** Animation duration in seconds for entrance transition */
  readonly durationSeconds: number;
}

/**
 * Timing milestones and duration schedule for splash screen phase transitions.
 */
export interface SplashPhaseSchedule {
  /** Entrance phase duration in milliseconds */
  readonly enteringDurationMs: number;
  /** Holding phase duration in milliseconds (canonical: 5000ms) */
  readonly holdDurationMs: number;
  /** 3D rotation flip phase duration in milliseconds */
  readonly flippingDurationMs: number;
  /** Exit reveal phase duration in milliseconds */
  readonly exitingDurationMs: number;
  /** Total lifecycle duration before auto-completion in milliseconds */
  readonly totalDurationMs: number;
}

/**
 * Performance, caching, and prefetch configuration for splash optimization.
 */
export interface SplashOptimizationConfig {
  /** Duration in milliseconds to hold assembled logo before flip (default: 5000ms) */
  readonly holdDurationMs: number;
  /** Session storage key used to track prior viewings in current browser tab */
  readonly sessionStorageKey: string;
  /** If true, bypasses animation when session marker is present */
  readonly bypassOnRepeatVisit: boolean;
  /** List of route URLs to prefetch during hold phase */
  readonly criticalRoutes: readonly string[];
  /** Fallback timeout in milliseconds to prevent indefinite screen blocking */
  readonly fallbackTimeoutMs: number;
}

/**
 * Contract for storage adapters persisting splash screen presentation state across sessions.
 */
export interface SplashStorageAdapter {
  /** Checks if the user has already viewed the splash screen in the active session */
  hasViewed(): boolean;
  /** Marks the splash screen as viewed in the active session */
  markAsViewed(): void;
  /** Resets the session view marker (useful for testing or manual triggers) */
  reset(): void;
  /** Clears the session view marker (alias for reset, essential for isolated test runs) */
  clear(): void;
}

/**
 * Context value exposed by SplashProvider to downstream application consumers.
 */
export interface SplashContextValue {
  /** Current active animation phase */
  readonly phase: SplashPhase;
  /** True when splash has fully finished and unmounted */
  readonly isCompleted: boolean;
  /** True while splash screen is actively mounted and visible */
  readonly isVisible: boolean;
  /** Programmatically skips the remainder of the animation lifecycle */
  skipSplash: () => void;
}

/**
 * Props for the AnimatedIsotypeVector presentation component.
 */
export interface AnimatedIsotypeVectorProps {
  /** Current animation phase driving vector states */
  readonly phase: SplashPhase;
  /** Display width and height dimension in pixels (default: 160) */
  readonly size?: number;
  /** Optional container CSS class name */
  readonly className?: string;
  /** Optional custom inline style overrides */
  readonly style?: CSSProperties;
}

/**
 * Props for the AnimatedWordmarkVector official brand typography component.
 */
export interface AnimatedWordmarkVectorProps {
  /** Current animation phase driving typography states */
  readonly phase: SplashPhase;
  /** Display width in pixels (default: 200) */
  readonly width?: number;
  /** Optional container CSS class name */
  readonly className?: string;
  /** Optional custom inline style overrides */
  readonly style?: CSSProperties;
}

/**
 * Props for the root BrandSplashScreen presentation overlay component.
 */
export interface BrandSplashScreenProps {
  /** Callback fired when splash transition completes and unmounts */
  readonly onComplete?: () => void;
  /** Optional container CSS class name */
  readonly className?: string;
  /** If true, forces animation to display regardless of session bypass state */
  readonly forceShow?: boolean;
  /** If true, renders the official lettermark logo alongside the isotype (default: true) */
  readonly showWordmark?: boolean;
}

/**
 * Props for the SSR-safe SplashPortal presentation wrapper.
 */
export interface SplashPortalProps {
  /** Child elements to portal into document body */
  readonly children: ReactNode;
}

/**
 * Props for the SplashProvider application context container.
 */
export interface SplashProviderProps {
  /** Application component tree */
  readonly children: ReactNode;
  /** Optional custom optimization configuration overrides */
  readonly config?: Partial<SplashOptimizationConfig>;
}

/**
 * Hook options parameter for useSplashScreen.
 */
export interface UseSplashScreenOptions {
  /** Override optimization config options */
  readonly config?: Partial<SplashOptimizationConfig>;
  /** Callback invoked upon lifecycle completion */
  readonly onComplete?: () => void;
  /** Force display ignoring session storage marker */
  readonly forceShow?: boolean;
}

/**
 * Hook return contract for useSplashScreen.
 */
export interface UseSplashScreenResult {
  /** Current phase of the splash animation state machine */
  readonly phase: SplashPhase;
  /** Whether the splash screen has completely concluded */
  readonly isCompleted: boolean;
  /** Whether the splash overlay is currently visible */
  readonly isVisible: boolean;
  /** Function to immediately fast-forward and finish the splash screen */
  readonly skipSplash: () => void;
}
