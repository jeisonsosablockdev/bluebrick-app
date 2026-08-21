# Frontend Cycle (Gemini/Antigravity)

## Trigger
- Changes to `/app`, `components`, or browser-facing routes
- Auth, wallet, or other browser-critical flow changes
- SSR/client boundary changes in Next.js App Router code
- Motion-driven UX/UI changes that alter the user's interaction language, transitions, or sense of place

## Subagents
- `planner` (You, orchestrating)
- `frontend` (invoke via `invoke_subagent`)
- `qa` (invoke via `invoke_subagent`)
- Add `security` for auth, wallet, session, role, or other trust-boundary work.

## Required Policies
- `.agents/policies/frontend-policy.md`
- `.agents/policies/security-policy.md`
- `.agents/policies/docs-policy.md`
- `.agents/policies/testing-policy.md`

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Detect frontend scope | Create `implementation_plan.md` identifying routes, UI surfaces, and motion intent. |
| 2 | Define boundaries | Document SSR/client split and Motion 12 syntax rules. Consult `node_modules/next/dist/docs/01-app/`. |
| 3 | Review auth/privileges | Spawn `security` subagent to review trust-boundary gaps. |
| 4 | Implement with in-code commentary | Write code using `replace_file_content` ensuring layer headers, JSDoc blocks, and step-by-step logic indicators. |
| 5 | Live Runtime Loop | Use the `next-dev-loop` skill with `next-devtools-mcp` to trigger `compile_route` and check `get_errors` / compilation issues on the running dev server (`pnpm dev:turbo`). |
| 6 | Run QA | Use `run_command` for Playwright/Synpress tests. Send to background. Spawn `qa` subagent if visual checks via MCP are needed. |
| 7 | Review & Gate 2 | Perform Gate 2 audit verifying 4-layer isolation and in-code commentary; log findings in `walkthrough.md`. |

## Required Evidence in Walkthrough
- Test coverage updates
- `next-devtools-mcp` and `next-dev-loop` live verification logs
- Playwright/Synpress background task logs
- In-code commentary & clean-code verification
- MCP or browser artifacts for critical flows
- Motion 12 tooling notes
