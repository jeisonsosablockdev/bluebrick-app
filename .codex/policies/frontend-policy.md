# Frontend Policy

## Canonical Sources
- `docs/governance/frontend-ui-policy.md`
- `docs/governance/security-quality-policy.md`
- `docs/governance/documentation-policy.md`

## Apply When
- `/app`, `components`, auth, wallet, or browser-facing flow changes

## Hard Constraints
- SSR-first is the default; move trust-sensitive logic to the server.
- Wallet adapters, browser-only APIs, and extension-dependent logic stay in client-only boundaries.
- Never trust client wallet, session, or role state as authority; verify signatures and privileges on the server.
- Responsive acceptance is mandatory for UI changes and is closed through `responsive-qa` plus `testing-policy`.
- Do not use mocked wallet or provider behavior as final proof for critical auth, wallet, or browser flows.
- Coordinate with `security` for auth, replay, or privilege changes and with `solana` when frontend changes alter on-chain request contracts.
- For motion-driven UX/UI work, use Motion 12 (`motion.dev`) and the current `motion` syntax only; do not reintroduce legacy `framer-motion` imports, examples, or patterns.
- When a UX/UI slice depends on current Motion 12 docs, AI-assisted tooling, or bridge-style guidance, document the OpenAI Developers tooling reference used for the slice before implementation closes.

## Required Evidence
- Touched routes and UI surfaces
- Server and client trust-boundary notes
- Matching E2E and responsive artifacts required by the active workflow
- Motion 12 tooling notes and current syntax references when motion work is in scope
