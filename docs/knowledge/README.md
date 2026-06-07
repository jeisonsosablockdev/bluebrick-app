# Knowledge Inbox

This directory is the shared capture-and-promotion layer for reusable workflow knowledge.

Promotion ladder:
1. `docs/features/*.md` or RFCs capture delivery-specific evidence.
2. `docs/knowledge/inbox/*` stores reusable observations.
3. `docs/knowledge/proposals/*` stores promotion candidates.
4. `docs/guides/*` stores approved reusable guides.
5. `docs/governance/*` and CI/scripts store stable mandatory rules and executable enforcement.

Human checkpoints:
- Inbox items can be captured by the agent.
- Promotion to `guide`, `governance`, or `automation` requires human review.
- `AGENTS.md` is updated only after canonical docs or enforcement change.

Commands:
- `npm run knowledge:scan -- --base develop`
- `npm run knowledge:index`
- `npm run knowledge:index -- --check`
- `npm run knowledge:drift`
- `npm run validate:knowledge`

Last Generated: 2026-06-07T21:15:00.000Z

## Snapshot

| Metric | Count |
| --- | ---: |
| Observations | 4 |
| Proposals | 0 |
| Reports | 3 |
| Archived | 0 |
| Observed status | 7 |
| Triaged status | 0 |
| Promoted status | 0 |
| Archived status | 0 |

## Inbox

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| KNOW-2026-05-001 | observed | guide | [Governance summaries must defer to canonical policy and enforcement](docs/knowledge/inbox/2026-05/KNOW-2026-05-001-governance-summary-defers-to-canonical-policy.md) | BRI-143 |
| KNOW-2026-06-001 | observed | guide | [Admin Candy Machine module worklog](docs/knowledge/inbox/2026-06/KNOW-2026-06-001-admin-candy-machine-module-worklog.md) | n/a |
| KNOW-2026-06-002 | observed | guide | [Candy Machine deploy iteration 2026-06-07](docs/knowledge/inbox/2026-06/KNOW-2026-06-002-candy-machine-deploy-iteration-2026-06-07.md) | n/a |
| KNOW-2026-06-003 | observed | guide | [Candy Machine deploy current system branch](docs/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-current-system-branch.md) | n/a |

## Promotion Proposals

_No items yet._

## Reports

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| governance-drift-2026-05-02 | observed | none | [governance-drift-2026-05-02](docs/knowledge/reports/governance-drift-2026-05-02.md) | n/a |
| governance-drift-2026-06-07 | observed | none | [governance-drift-2026-06-07](docs/knowledge/reports/governance-drift-2026-06-07.md) | n/a |
| recent-changes-2026-05-02 | observed | none | [recent-changes-2026-05-02](docs/knowledge/reports/recent-changes-2026-05-02.md) | n/a |

## Archive

_No items yet._
