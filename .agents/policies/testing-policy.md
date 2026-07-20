# Testing Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/frontend-ui-policy.md`
- `package.json`

## Apply When
- Any implementation, verification, or release-readiness task

## Antigravity Execution Constraints
- Start with targeted tests first; untested implementation is not complete.
- When the work uses the artifact-driven SPEC model, define the test-plan-first contract in the `implementation_plan.md` artifact before executing.
- `pnpm validate` is mandatory before completion. Execute it via `run_command`. If it takes too long, set a lower `WaitMsBeforeAsync` to send it to the background.
- Database schema or persistence changes require `pnpm validate:db`; pending tracked migrations block completion.
- Frontend and auth critical paths require Playwright coverage. Use Chrome DevTools MCP or run standard playwright commands.
- Wallet-connected or extension-dependent auth paths require Synpress coverage.
- Browser-critical flows require artifact capture plus responsive coverage at 320, 375, 768, and 1024 widths.
- Responsive/browser-critical evidence must be readable, route-state complete, and explicit about global overflow; ambiguous evidence is a blocking failure, not a warning.
- Record exact commands and unresolved gaps; failing tests or missing evidence block completion.

## Required Evidence
- Commands run and their background task status
- Relevant unit or integration results
- Playwright results when in scope
- Synpress results when in scope
- Record evidence in `walkthrough.md`
