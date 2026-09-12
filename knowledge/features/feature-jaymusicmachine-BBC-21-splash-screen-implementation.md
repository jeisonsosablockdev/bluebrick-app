# Solution Spec: splash-screen Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Pre-Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Motion & UX Alignment**: Motion 12 (`motion.dev`) native syntax (`motion/react` or `motion`)

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation Layer (`apps/web/src/components/splash/`)
- `apps/web/src/components/splash/brand-splash-screen.tsx`: Root client-side splash presentation component rendered in full-screen fixed overlay (`z-index: 9999`) using Motion 12 `AnimatePresence`. Prevents interaction with the background page until dismissal.
- `apps/web/src/components/splash/animated-isotype-vector.tsx`: SVG vector component exposing individual Motion 12 `motion.path` and `motion.g` primitives for the 4 decomposed logo isotype sections. Applies 3D rotation (`rotateY`, `transformPerspective`) during axis flip.
- `apps/web/src/components/splash/splash-portal.tsx`: SSR-safe React Portal wrapper ensuring the splash screen mounts cleanly to document body without interfering with root layout hierarchy or CSS cascades.

### Layer 2: Application / Consumption Layer (`apps/web/src/components/splash/`)
- `apps/web/src/components/splash/use-splash-screen.ts`: Orchestration hook governing the state machine transitions:
  `entering` (0.0s - 1.2s) -> `holding` (1.2s - 6.2s, 5 seconds) -> `flipping` (6.2s - 7.2s) -> `exiting` (7.2s - 7.8s) -> `done`.
  Exposes state controls, manual skip triggers (for development/testing), and ready status to the page shell.
- `apps/web/src/components/splash/splash-provider.tsx`: Context provider allowing global components to query whether initial startup splash is active or finished.

### Layer 3: Domain / Pipelines Layer (`apps/web/src/lib/splash/`)
- `apps/web/src/lib/splash/isotype-geometry.ts`: Canonical SVG path definitions and metadata for the 4 brand isotype pieces:
  1. `small_white`: Lower-left anchor (`d="M 14 88.661 C 4.703 92.037..."`, viewBox origin).
  2. `large_white_left`: First large diagonal bar (`d="M 28 24.344 C 17.794..."`).
  3. `large_white_right`: Second large diagonal bar (`d="M 66.087 6.906 C 48.790..."`).
  4. `accent_red`: Signature red brick (`d="M 116.994 9.008 C 109.338..."`).
- `apps/web/src/lib/splash/types.ts`: Strict TypeScript interfaces for `SplashPhase`, `IsotypePieceConfig`, `SplashOptimizationConfig`, and animation variant definitions.
- `apps/web/src/lib/splash/load-optimizer.ts`: Pure functional pipeline evaluating session eligibility (bypassing repeat plays if session marker exists), triggering background prefetch for high-priority routes/images, and measuring LCP impact.

### Layer 4: Infrastructure Layer (`apps/web/src/lib/splash/`)
- `apps/web/src/lib/splash/splash-storage.ts`: Web Storage adapter with SSR fallback (`sessionStorage` / memory fallback) safely handling browser security policies and disabled cookies/storage.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Core Splash Screen & Motion 12 Choreography
  - **Branch**: `SPEC/jaymusicmachine-BBC-21-s01-splash-screen-animation`
  - **Scope**: Isotype geometry extraction, SVG decomposition into 4 isolated motion pieces, and staggered left-to-right entrance choreography (small white -> large white left -> large white right -> accent red).
- **SPEC-2**: Axis Rotation, Color Transition & Exit Sequence
  - **Branch**: `SPEC/jaymusicmachine-BBC-21-s02-splash-screen-transition`
  - **Scope**: 5-second hold state timer, 3D axis flip rotation (`rotateY: 180deg`) with secondary color transition, and smooth exit curtain animation uncovering the website.
- **SPEC-3**: Load Optimization & Prerender Performance
  - **Branch**: `SPEC/jaymusicmachine-BBC-21-s03-load-optimization`
  - **Scope**: Background asset and route prefetching during splash duration, session storage gating to prevent UX fatigue on reload, and Core Web Vitals (LCP/CLS) validation.
- **SPEC-4**: Clean-Code Refactor Audit & Governance Hardening
  - **Branch**: `SPEC/jaymusicmachine-BBC-21-s04-clean-code-audit`
  - **Scope**: Rigorous clean-code pass, layer boundary verification, JSDoc/TSDoc commentary audits, regression test coverage, and `pnpm validate` sign-off.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/splash-screen.test.tsx`
  - Tests decomposition and existence of all 4 isotype segments in order.
  - Tests sequential step advancement (`entering` -> `holding` -> `flipping` -> `exiting` -> `done`).
  - Tests that hold duration respects the ~5-second requirement.
  - Tests color transition and rotation styling classes/transforms.
- **Test File Path**: `tests/unit/splash-load-optimization.test.tsx`
  - Tests session storage bypass logic when splash has already been viewed.
  - Tests SSR safety when window/sessionStorage is undefined.
  - Tests preloading callbacks and graceful timeout fallbacks.
- **Command**: `pnpm test tests/unit/splash-screen.test.tsx tests/unit/splash-load-optimization.test.tsx`

## 5. Local Definition of Done (DoD)
- [ ] Governing dual artifacts filled with 0 placeholders.
- [ ] Gate 1 Scaffolding completed by `architect`.
- [ ] Human Design Approval received from developer.
- [ ] TDD Phase RED tests written with strict assertiveness.
- [ ] Phase GREEN code implemented with full step-by-step commentary and layer annotations.
- [ ] Refactor pass completed with clean code standards.
- [ ] `pnpm validate` passes with zero lint, typecheck, or test errors.
- [ ] Human Merge Acceptance authorized before merging to `develop`.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-21-splash-screen.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-21-splash-screen.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-21-splash-screen-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-21-splash-screen-implementation.md)
- **Linear Issue**: [Linear Ticket BBC-21](https://linear.app/brids-app/issue/BBC-21/feature-app-startup-animated-splash-screen-with-motion-and-load)
