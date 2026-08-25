# Governance Drift Report

Generated: 2026-08-25T04:49:07.860Z

| Check | Result | Details |
| --- | --- | --- |
| AGENTS summary points to canonical documentation policy | pass | AGENTS.md should point to canonical documentation policy instead of redefining it. |
| AGENTS summary points to docs enforcement source | pass | AGENTS.md should point to the executable docs gate. |
| AGENTS summary points to PR policy SSOT | pass | AGENTS.md should point to the PR policy source of truth. |
| Documentation policy declares canonical precedence | pass | Documentation policy should explain canonical precedence and the enforcement source. |
| RFC status values match across policy, template, and checker | pass | policy=[approved, draft, implemented, in-review, rejected] template=[approved, draft, implemented, in-review, rejected] checker=[approved, draft, implemented, in-review, rejected] |
| Shared branch names are documented in monorepo policy | fail | Shared and issue-type-driven branch naming must stay visible in the branch naming convention. |
| Gitflow guide still points to PR policy SSOT | pass | The gitflow usage guide should continue pointing to the PR policy SSOT. |
| Documentation slices require explain-like-socrates | pass | The spec/documentation slice must keep the required Socratic skill visible across routing, docs agent, and governance. |
| Develop merge remains gated by Human Acceptance | pass | Final PRs to develop should remain blocked until user manual-test approval is recorded. |

Failing Checks: 1

## Follow-up

- Shared branch names are documented in monorepo policy: Shared and issue-type-driven branch naming must stay visible in the branch naming convention.
