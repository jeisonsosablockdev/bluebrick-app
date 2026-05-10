# Frontend Cycle

## Trigger
- Changes to `/app`, `components`, or browser-facing routes
- Auth, wallet, or other browser-critical flow changes
- SSR/client boundary changes in Next.js App Router code

## Participants
- `planner`
- `frontend`
- `qa`
- `docs`
- `reviewer`
- Add `security` for auth, wallet, session, role, or other trust-boundary work.
- Add `solana` when the frontend changes on-chain request contracts or RPC behavior.

## Required Policies
- `frontend-policy`
- `security-policy`
- `docs-policy`
- `testing-policy`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Detect frontend scope and activate this workflow | Routes, UI surfaces, and evidence needs are identified |
| 2 | `frontend` | Define the SSR/client split and server trust boundary | Client-only wallet code and server-side validation points are explicit |
| 3 | `security` | Review auth, signer, session, and privilege assumptions when in scope | Trust-boundary gaps are surfaced before implementation closes |
| 4 | `frontend` | Implement with tests first and keep the diff local to the touched surface | Relevant tests are updated before final verification |
| 5 | `docs` | Sync auth, session, feature-note, or migration docs as required | Canonical docs and traceability stay current |
| 6 | `qa` | Run targeted tests, Playwright, Synpress, and browser evidence as required | Workflow-specific gates pass with deterministic artifacts |
| 7 | `reviewer` | Audit the final diff and completion status | No unresolved blocking findings remain |

## Blocking Gates
- Wallet or auth flows do not close without the required E2E coverage.
- Browser-critical flows do not close without recorded evidence.
- Responsive regressions must run through `responsive-qa` before completion.

## Required Evidence
- Commands run
- Updated test coverage
- Playwright output
- Synpress output when wallet or auth applies
- MCP or browser artifacts for critical flows
- Updated docs paths

## Handoffs
- `planner -> frontend/security`: touched routes, active risks, evidence expectations
- `frontend -> qa/docs`: changed surfaces, server/client boundary notes, expected regressions
- `qa -> reviewer`: gate results, artifact paths, unresolved failures
