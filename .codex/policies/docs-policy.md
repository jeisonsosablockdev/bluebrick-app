# Docs Policy

## Canonical Sources
- `knowledge/governance/documentation-policy.md`
- `knowledge/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`

## Apply When
- Product code, governance summaries, RFCs, or agent orchestration files change

## Hard Constraints
- `knowledge/governance/*` remains the single source of truth; `AGENTS.md` and `.codex/*` only reference or compress it.
- Update required canonical docs by impacted scope before completion.
- RFC structure, status values, and traceability must follow the documentation policy, templates, and enforcement scripts.
- Non-trivial work requires an artifact before implementation.
- New features and fixes use a dual artifact pair.
- Multi-SPEC work requires the first SPEC before delivery SPECs.
- When RFC applies in the SPEC model, RFC creation or update belongs to that first SPEC.
- Any docs validation failure blocks completion.

## Required Evidence
- Updated canonical docs paths
- Feature-note or RFC traceability paths when required
- Socratic planning evidence for documentation/spec slices
- Human Acceptance evidence for final `develop` merge
- Output from `scripts/ci/check-required-docs.sh` or `npm run validate`

## Hard Constraints
- Delivery slices require a clean-code design contract
- Documentation slices must use explain-like-socrates before delivery slices open
