---
id: KNOW-2026-05-001
title: Governance summaries must defer to canonical policy and enforcement
status: observed
scope: shared
source_issue: BRI-143
source_feature: docs/features/feature-shared-knowledge-promotion-system-bri-143.md
source_commit: 8e17d7d
promotion_target: guide
enforcement_candidate: yes
owner: jaymusicmachine
created_at: 2026-05-02
updated_at: 2026-05-02
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
