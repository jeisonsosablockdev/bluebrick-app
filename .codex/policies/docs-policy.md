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
- Qualifying product changes still need at least one `/docs/features/*.md` update.
- Any docs validation failure blocks completion.

## Required Evidence
- Updated canonical docs paths
- Feature-note or RFC traceability paths when required
- Output from `scripts/ci/check-required-docs.sh` or `npm run validate`
