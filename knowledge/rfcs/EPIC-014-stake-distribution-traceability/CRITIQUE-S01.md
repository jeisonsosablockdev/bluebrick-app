---
type: RFC
title: CRITIQUE S01
description: CRITIQUE S01 - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-014-stake-distribution-traceability/CRITIQUE-S01.md
---

# CRITIQUE-S01: Socratic Review of STORY-014-01-draft.md

*Applied `explain-like-socrates` skill per canonical flow for spec slice (S01) before delivery slices open.*

---

## 1. Curiosity Opening

Suppose we are designing a system that answers a single high-stakes question: *"How much does BRIDS send this user for the time they kept eligible assets staked?"*

What if the user's understanding of "time staked" differs from the blockchain's? What if the system's notion of "eligible" excludes assets the user believes they own? What if the final calculation produces a number the user cannot trace back to a single freeze transaction?

Let us walk through the spec together, not as auditors, but as co-inquirers.

---

## 2. Guided Reasoning

### Assumption: "Candy Machine is the sole financial scope"

*Question:* If a project uses a single Candy Machine for minting, but the collection update authority remains with the developer, could the developer add new items to the collection post-launch that share the same visual metadata but were minted from a different Candy Machine?

*Reasoning:* The spec correctly identifies this risk — collection membership ≠ financial scope. The `asset_project_origins` table captures mint transaction evidence, not collection membership. But consider: what if the mint transaction itself is unavailable (pruned, or from a legacy Candy Machine v1 that doesn't expose the Candy Machine address in the instruction)?

*Follow-up:* The provenance backfill job marks these `NEEDS_REVIEW`. Is a 3-month manual window sufficient? What happens to those assets' earning intervals during review — do they accrue time? If resolved later, is the earning interval recalculated retroactively?

### Assumption: "Freeze intervals are summed across re-freeze events"

*Question:* A user freezes on Day 1, unfreezes Day 10, refreezes Day 20. The spec says "summed across re-freeze events." But what if the asset was transferred between Day 10–20? The spec says "freeze time follows asset, not wallet" for transfers, yet "earning follows wallet interval" for accrual.

*Thought experiment:* Alice freezes Day 1–10. Transfers to Bob Day 11. Bob freezes Day 20–30. Alice's interval: Day 1–10 (10 days). Bob's interval: Day 20–30 (10 days). Day 11–19: no one earns. Correct? What if Bob never freezes — does Alice's Day 1–10 still count? Yes, per "accrued distribution rights follow the wallet that owned and froze during each validated interval."

*Edge case:* What if the asset is frozen by a program (e.g., escrow) rather than the wallet owner? Does `FreezeDelegate.frozen` distinguish authority? The spec reads `FreezeDelegate.frozen` state — but who is the freeze authority? If it's a program, does the wallet still "own" the earning?

### Assumption: "Archival RPC mandatory; validated via `minimumLedgerSlot`"

*Question:* The spec requires `minimumLedgerSlot <= requiredSlot`. But `minimumLedgerSlot` only tells you the *oldest slot the node might have*. It does not guarantee the node has *all* slots in between. A node could have slot 100 and slot 200, but gap at 150.

*Reasoning:* The spec acknowledges: "This does not mean the node has all blocks between this slot and the current tip. Gaps can still exist." So `minimumLedgerSlot` is necessary but not sufficient. The multi-provider convergence (Helius + Alchemy + self-hosted) mitigates this — but only if the gaps don't align across providers.

*Refinement needed:* Should the spec require `getSignaturesForAddress` pagination to verify continuous coverage, or is provider convergence the pragmatic ceiling?

### Assumption: "12-month TTL for compliance hold → auto-clawback"

*Question:* Why 12 months? Is it tied to the longest investment model (`real_estate_dev` > 1 year)? What if a project's eligibility window is 18 months, and a user falls into `restricted_aml` at month 14 — their funds are held, then clawed back at month 26 (12 months after claim attempt). But the distribution run already executed for other users. Does the clawback return funds to the *same* treasury vault for potential re-distribution? Or to a separate "unclaimed" bucket?

*Observation:* The spec says "Funds return to treasury (accounting entry)" but doesn't specify if a second distribution run is ever triggered. The state machine says "no normal second distribution run for the same project window." So clawed-back funds sit in treasury indefinitely? This seems like a silent accumulator.

### Assumption: "Fee applied at claim layer; Hamilton remainder on gross"

*Question:* Fee is calculated per-claim after gross is locked. But Hamilton remainder distribution uses `grossAmountMinor` (pre-fee). If two users have identical gross but different fee policies (e.g., one flat, one percentage), their net amounts diverge — but the remainder allocation already happened on gross. Is this intentional? The fee doesn't change the pool denominator or wallet time weight, per spec. But the *net* distribution is no longer perfectly proportional to time-weight.

*Is this acceptable?* The spec explicitly states: "The fee must not change the pool denominator, wallet time weight, or the gross amount earned by the user." This is a design choice: fairness in *entitlement* (gross), operational reality in *receipt* (net).

---

## 3. Single Analogy

**A communal irrigation canal.**

Water (treasury earnings) flows into a main channel. Each farmer (wallet) has a gate (freeze interval) that opens when they tend their field (stake). The longer their gate stays open, the more water they're entitled to (time-weight). At season's end (project window close), a surveyor (Final Calculation) measures how long each gate was open using timestamps carved in stone (archival RPC). The water is divided proportionally — but each farmer pays a toll (fee) when they actually draw water (claim). If a farmer's papers aren't in order (compliance), their water sits in a holding pond (compliance hold) for one season (12 months); if still unclaimed, it returns to the reservoir (clawback). The canal authority (Squads multisig) releases water only after the council (committee) reviews the surveyor's log. No one can dig a new intake (mint new NFTs) after the season starts — the headgate is locked (mint authority frozen).

---

## 4. Clarification

| Spec Area | Question Raised | Suggested Refinement |
|---|---|---|
| Provenance gaps | What if mint tx is pruned on *all* archival providers? | Define "exhausted provenance" state → exclude from pool, log for audit, never auto-include |
| Transfer + freeze gap | Day 11–19 in Alice/Bob example — who "owns" the earning gap? | Explicit: no wallet earns during ownership+freeze gaps; document in `DistributionAuditEvent` |
| Archival gap detection | `minimumLedgerSlot` insufficient for continuity | Add: `GET_SIGNATURES_FOR_ADDRESS` pagination check — if gap > N slots, flag run for manual review |
| Clawback destination | Where do 12-month TTL funds go? | Create `TreasuryClawbackPool` per project; document re-distribution policy (or permanent retention) |
| Fee fairness | Net not proportional due to fee variance | Document explicitly: "Gross entitlement is proportional; net receipt varies by fee policy" |
| MPL Core freeze | `PermanentFreezeDelegate` plugin update vs instruction parsing | Update S02 pseudocode: use `updatePlugin` with `frozen: true/false` not discriminator parsing |

---

## 5. Reflection

What clearer picture emerges now?

The spec is structurally sound — it separates concerns cleanly (event layer, provenance, timeline, window, projection, snapshot, calculation, treasury, claim, audit), uses blockchain-native primitives (MPL Core freeze, Squads multisig, archival RPC), and encodes business rules as code (Hamilton math, frozen mint authority, compliance TTL).

The remaining uncertainties are not flaws but *boundary decisions*:
- How much provenance loss is tolerable before excluding an asset?
- How much archival gap tolerance before manual review?
- What happens to clawed-back funds long-term?

These are policy choices, not technical gaps. The spec should make them explicit in the Open Questions section, with decision owners and deadlines.

**Does this interpretation make sense to you?** Shall we codify these refinements into the spec before opening delivery slices?

---

*End of Socratic critique. Ready for incorporation into STORY-014-01-draft.md or as addendum.*