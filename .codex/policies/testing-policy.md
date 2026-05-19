# Testing Policy

## Canonical Sources
- `docs/governance/security-quality-policy.md`
- `docs/governance/frontend-ui-policy.md`
- `package.json`

## Apply When
- Any implementation, verification, or release-readiness task

## Hard Constraints
- Start with targeted tests first; untested implementation is not complete.
- When the work uses the artifact-driven slice model, define the test-plan-first contract in the solution artifact before implementation slices open.
- `npm run validate` is mandatory before completion.
- Database schema or persistence changes require `npm run validate:db`; pending tracked migrations block completion.
- Frontend and auth critical paths require Playwright coverage.
- Wallet-connected or extension-dependent auth paths require Synpress coverage.
- Browser-critical flows require artifact capture plus responsive coverage at 320, 375, 768, and 1024 widths.
- Responsive/browser-critical evidence must be readable, route-state complete, and explicit about global overflow; ambiguous evidence is a blocking failure, not a warning.
- Record exact commands and unresolved gaps; failing tests or missing evidence block completion.

## Required Evidence
- Commands run
- Relevant unit or integration results
- Playwright results when in scope
- Synpress results when in scope
- Responsive and browser artifact references when in scope
