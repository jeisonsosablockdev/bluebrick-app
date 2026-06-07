# Docs Policy

## Canonical Sources
- `docs/governance/documentation-policy.md`
- `docs/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`

## Apply When
- Product code, governance summaries, RFCs, or agent orchestration files change

## Hard Constraints
- `docs/governance/*` remains the single source of truth; `AGENTS.md` and `.codex/*` only reference or compress it.
- Update required canonical docs by impacted scope before completion.
- RFC structure, status values, and traceability must follow the documentation policy, templates, and enforcement scripts.
- Non-trivial work requires an artifact before implementation.
- New features and fixes use a dual artifact pair.
- Multi-slice work requires the spec slice before delivery slices.
- Delivery slices require a clean-code design contract in the solution artifact before implementation: one responsibility, intended boundary, naming/coupling risk, duplication/dead-code policy, and the tests that protect the design.
- When RFC applies in the spec-slice model, RFC creation or update belongs to that spec slice.
- Any docs validation failure blocks completion.

## Required Evidence
- Updated canonical docs paths
- Feature-note or RFC traceability paths when required
- Output from `scripts/ci/check-required-docs.sh` or `npm run validate`
