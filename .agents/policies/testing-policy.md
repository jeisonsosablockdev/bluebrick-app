# Testing Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/frontend-ui-policy.md`
- `package.json`

## Apply When
- Any implementation, verification, or release-readiness task

## Antigravity Execution Constraints
- **Autonomous Red-Green-Refactor Cycle**: Every single SPEC (single or multi-SPEC) must internally execute the full TDD cycle:
  1. **RED**: Design and write failing tests first using the `tdd-primal` skill before touching production code.
  2. **GREEN**: Implement production code until tests pass.
  3. **REFACTOR**: Always run a clean-code refactoring pass using the `code-refactoring-refactor-clean` skill before Gate 2 review.
- Do NOT create separate test-only or refactor-only SPECs.
- When the work uses the artifact-driven SPEC model, define the test-plan-first contract in the `implementation_plan.md` artifact before executing.
- `pnpm validate` is mandatory before completion. Execute it via `run_command`. If it takes too long, set a lower `WaitMsBeforeAsync` to send it to the background.
- Database schema or persistence changes require `pnpm validate:db`; pending tracked migrations block completion.
- Frontend and auth critical paths require Playwright coverage. Use Chrome DevTools MCP or run standard playwright commands.
- Wallet-connected or extension-dependent auth paths require Synpress coverage.
- Browser-critical flows require artifact capture plus responsive coverage at 320, 375, 768, and 1024 widths.
- Responsive/browser-critical evidence must be readable, route-state complete, and explicit about global overflow; ambiguous evidence is a blocking failure, not a warning.
- **Mandatory In-Code Commentary**: All test suites (`tests/**/*.test.ts`, `e2e/**/*.spec.ts`) MUST include: 1) Suite header describing the domain contracts tested, 2) JSDoc/comments on helper fixtures and mocks, 3) Explicit `// Arrange`, `// Act`, `// Assert` block structure, 4) Inline commentary detailing edge cases, negative invariants, and expected error assertions.
- Record exact commands and unresolved gaps; failing tests or missing evidence block completion.

## Required Evidence
- Commands run and their background task status
- Relevant unit or integration results
- Verified in-code commentary and test structure clarity
- Playwright results when in scope
- Synpress results when in scope
- Record evidence in `walkthrough.md`
