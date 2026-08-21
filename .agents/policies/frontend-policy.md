# Frontend Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/frontend-ui-policy.md`
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/documentation-policy.md`

## Apply When
- `/app`, `components`, auth, wallet, or browser-facing flow changes

## Antigravity Execution Constraints
- SSR-first is the default; move trust-sensitive logic to the server.
- Wallet adapters, browser-only APIs, and extension-dependent logic stay in client-only boundaries.
- Never trust client wallet, session, or role state as authority; verify signatures and privileges on the server.
- **QA Delegation**: Responsive acceptance is mandatory. Use `invoke_subagent` to spawn a 'qa' subagent or use Chrome DevTools MCP servers to verify UI rendering.
- Do not use mocked wallet or provider behavior as final proof for critical auth, wallet, or browser flows.
- **Cross-Agent Coordination**: Send messages to `security` subagent for auth/replay changes and `solana` subagent when frontend changes alter on-chain request contracts.
- For motion-driven UX/UI work, use Motion 12 (`motion.dev`) and the current `motion` syntax only; do not reintroduce legacy `framer-motion` imports, examples, or patterns.
- When a UX/UI SPEC depends on current Motion 12 docs, AI-assisted tooling, or bridge-style guidance, document the provider-specific tooling reference used for the SPEC before implementation closes.
- **Mandatory In-Code Commentary**: Every component, hook, Server Action, and route file MUST include: 1) File header declaring layer role (`Layer 1: Presentation` or `Layer 2: Application`), 2) JSDoc/TSDoc blocks on all exported components, props, and hooks, 3) Step-by-step inline commentary (`// Step N: ...`) detailing state transitions, optimistic updates, and auth boundary checks.

## Required Evidence
- Touched routes and UI surfaces
- Server and client trust-boundary notes
- Verified in-code commentary and layer header compliance
- Matching E2E and responsive artifacts required by the active workflow, documented in `walkthrough.md`.
