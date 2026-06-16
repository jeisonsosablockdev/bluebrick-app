---
type: Feature Spec
title: KNOW 2026 05 001 Governance Summary Defers To Canonical Policy
description: KNOW 2026 05 001 Governance Summary Defers To Canonical Policy - migrated from docs/
tags: [knowledge]
timestamp: 2026-06-16T15:15:38Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/knowledge/knowledge/inbox/2026-05/KNOW-2026-05-001-governance-summary-defers-to-canonical-policy.md
---


# Signal

`AGENTS.md` drifted when it summarized documentation and governance rules with looser language than the canonical docs and shell enforcement.

# Evidence

- Canonical docs and enforcement already existed in `docs/governance/documentation-policy.md` and `scripts/ci/check-required-docs.sh`.
- A recent fix had to realign `AGENTS.md`, the documentation policy, and RFC status handling.
- The risk appeared in a shared governance workflow, not in a single product feature.

# Why It Matters

When summaries become alternate policy sources, the team pays twice:
- agents act on the wrong rule,
- and repo governance becomes harder to audit.

# Reuse Potential

This is reusable beyond the specific fix because the same pattern can reappear anywhere a summary, guide, script, and canonical policy all evolve separately.

# Promotion Decision

- Proposed target: `guide`
- Human review needed: yes, to decide whether the rule remains advisory or should be promoted into stronger governance/change-management steps.

# Next Action

Keep this observation in the inbox until at least one more shared workflow change confirms the same pattern or until the team promotes it into a reusable guide.
