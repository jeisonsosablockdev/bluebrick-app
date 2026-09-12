# Problem Spec: BlueBrick App Startup Splash Screen & Motion 12 Brand Choreography

## What problem exists
Currently, when a user accesses the BlueBrick web application, the page transitions immediately from the initial HTML document to the React application shell without a cohesive, branded startup introduction. While functional, this sudden entrance misses the opportunity to establish brand identity, set visual anticipation, and conceal initial client hydration/background asset preparation.

Furthermore, there is no high-fidelity animated splash screen system leveraging Motion 12 (`motion.dev`) that orchestrates the BlueBrick brand mark. The brand logo's geometric isotype—composed of specific diagonal bars and a signature accent brick—is currently rendered only as static SVG/PNG assets without programmatic decomposition into animatable vectors.

## Why it matters
1. **Brand Identity & Perception**: The first 5 seconds of the user experience dictate perceived product quality. BlueBrick is an institutional-grade real estate tokenization platform; an elegant, fluid startup choreography using Motion 12 reinforces prestige, security, and precision engineering.
2. **Perceived Performance & Load Masking**: In web applications with dynamic imports, map dependencies (`mapbox-gl`), charts (`recharts`), and Web3 wallet adapters, a splash screen masks initial resource initialization, font loading (Geist), and hydration cycles, preventing Cumulative Layout Shift (CLS).
3. **Multi-Session Ergonomics**: Without a dedicated load optimization specification, a splash screen can quickly turn into an annoyance if displayed repeatedly on every navigation or page reload. Implementing load optimization and session management guarantees that the animation enriches rather than hinders the workflow.

## What outcome is expected
1. **Geometric Isotype Decomposition**: The BlueBrick logo mark is programmatically separated into 4 distinct SVG path segments:
   - Piece 1: Lower-left small white bar (x: 1–51, y: 88–159).
   - Piece 2: Central-left large diagonal white bar (x: 12–101, y: 24–168).
   - Piece 3: Central-right large diagonal white bar (x: 48–142, y: 6–146).
   - Piece 4: Top-right signature red brick (x: 104–154, y: 8–85, fill `#FC040C`).
2. **Sequential Motion 12 Choreography**:
   - **Phase A (Left-to-Right Entrance)**: Pieces appear sequentially from left to right with staggered easing curves (small white, first large white, second large white, and finally the red brick).
   - **Phase B (Steady Hold)**: The fully assembled logo rests in pristine alignment for ~5 seconds.
   - **Phase C (3D Axial Rotation & Color Transition)**: Each piece executes a flip/rotation on its local axis (e.g., `rotateY: 180deg`) while transitioning from the initial white/red palette into a secondary brand palette (such as high-contrast metallic slate / cyan or inverted theme colors).
   - **Phase D (Exit Transition & Reveal)**: The splash screen gracefully dissolves/scales out, simultaneously revealing the underlying web application without layout shifts.
3. **Load Optimization Specification**:
   - Background pre-fetching of vital routes/assets during the animation lifecycle.
   - Session-based gating (`sessionStorage`) to ensure repeat visits or sub-route navigations bypass the 5-second wait unless explicitly refreshed or initiated.
   - Fallback timeout guarantee to prevent any indefinite blocking if an asset fails to load.

## What gaps exist today
- `apps/web/public/brand/bluebrick-logo-horizontal-white.svg` and `apps/web/public/brand/bluebrick-logo-horizontal.svg` combine all white elements into a single compound path string (`d="M ... M ... M ..."`), making individual path animation impossible without manual path decomposition.
- There is no Layer 1 (Presentation) splash component in `apps/web/src/components/` capable of managing multi-phase animation states (`entering`, `holding`, `flipping`, `exiting`, `completed`).
- There is no Layer 2 (Application/Consumption) hook or provider that tracks startup readiness, asset preloading, or session persistence.

## What questions remain open
- Secondary color palette during the 3D axis flip: Standard brand contrast (`#04283C` deep navy for light mode, `#00A3FF` electric blue accent, or dual-tone invert).
- Session bypass behavior: Should the splash screen fire on every browser tab session (standard `sessionStorage`) or only once per visitor device (`localStorage` with version expiry)?
