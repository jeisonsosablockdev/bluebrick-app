---
type: Guide
title: Codex Orchestration Architecture
description: Codex Orchestration Architecture - migrated from docs/
tags: [guides]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/guides/codex-orchestration-architecture.md
---

# Codex Orchestration Architecture

## Goal

- Replace the monolithic `AGENTS.md` playbook with a layered Codex-first architecture.
- Keep `docs/governance/*` and executable CI scripts as the canonical source of truth.
- Reduce context pollution, prompt collisions, and repeated governance text.
- Improve deterministic workflow activation and future parallel delegation.

## Target Layout

```text
AGENTS.md
.codex/
  agents/
    planner.toml
    solana.toml
    frontend.toml
    nft.toml
    reviewer.toml
    qa.toml
    docs.toml
    security.toml
  workflows/
    blockchain-cycle.md
    frontend-cycle.md
    nft-cycle.md
    mainnet-hardening.md
    responsive-qa.md
  policies/
    blockchain-policy.md
    frontend-policy.md
    security-policy.md
    docs-policy.md
    testing-policy.md
docs/
  governance/
```

## Responsibility Split

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `AGENTS.md` | Entry routing, workflow activation map, delegation rules, DoD summary, canonical references | Detailed governance, long workflows, specialist domain prompts |
| `.codex/agents/*.toml` | Narrow specialist prompts, model preference, scope, read set, delegation surface | Cross-cutting process definitions, duplicated hard rules |
| `.codex/workflows/*.md` | Execution order, gates, required evidence, handoffs | Specialist implementation detail, long policy prose |
| `.codex/policies/*.md` | Reusable hard constraints summarized from canonical docs | Full governance duplication, workflow sequencing |
| `docs/governance/*` | Canonical repository policy | Agent-specific prompting or orchestration detail |

## Migration Rationale

- The old `AGENTS.md` mixed routing, governance, workflow steps, tool guidance, and domain detail into one prompt surface.
- That design made every task pay the cost of loading rules that only matter for a subset of changes.
- The new structure keeps the entrypoint short, then loads only the workflow and policy files relevant to the touched scope.
- Specialist agents now get narrow prompts and explicit read sets, which lowers token overhead and reduces instruction collisions.
- Reviewer, QA, docs, and security become reusable sidecars that can join multiple workflows without re-encoding the same rules in each domain prompt.
- CI, RFC, PR, docs, devnet, Playwright, Synpress, and responsive enforcement stay in their existing canonical docs and scripts; this refactor changes orchestration, not governance authority.

## Orchestration Flow

1. `planner` reads `AGENTS.md`, the touched paths, and only the workflow and policy files that match the task.
   - If the brief is vague, the bootstrap flow should run a Socratic clarification pass with `explain-like-socrates` before choosing the branch shape so the task expands into a concrete problem, outcome, scope, and branch plan.
2. `planner` activates one or more workflows based on scope: blockchain, frontend, NFT, mainnet hardening, responsive QA.
3. For multi-slice work, `planner` and `docs` require the spec/documentation slice to use `explain-like-socrates` before finalizing artifacts and to define a clean-code design contract for each delivery slice before implementation opens.
4. `planner` delegates the smallest useful context to specialists, including changed paths, active workflow, required policies, evidence expectations, clean-code design contract, and open risks.
5. Domain specialists implement or analyze within their lane:
   - `solana` for runtime and devnet proof
   - `frontend` for App Router and UI boundaries
   - `nft` for mint and metadata invariants
6. Cross-cutting specialists join as needed:
   - `security` for trust-boundary review
   - `docs` for canonical doc sync and traceability
   - `qa` for tests, E2E, responsive checks, and browser evidence
7. `reviewer` runs as the final gate for clean code, governance alignment, duplication, naming, and missing evidence.
8. `planner` aggregates the results and blocks completion unless every active workflow gate and DoD item is green.
9. For final work targeting `develop`, `planner` stops before merge and waits for explicit user manual-test approval recorded as Human Acceptance.

## Recommended Routing Examples

| Change Shape | Workflow Activation | Primary Agents | Sidecar Agents |
| --- | --- | --- | --- |
| `programs/**` plus devnet proof | `blockchain-cycle` | `solana` | `security`, `docs`, `qa`, `reviewer` |
| `app/**` auth or wallet flow | `frontend-cycle` + `responsive-qa` | `frontend` | `security`, `qa`, `docs`, `reviewer` |
| Metaplex mint flow touching `app/**` and on-chain logic | `blockchain-cycle` + `frontend-cycle` + `nft-cycle` + `responsive-qa` | `solana`, `frontend`, `nft` | `security`, `docs`, `qa`, `reviewer` |
| RFC or governance-only update | No product workflow unless enforcement changes | `docs` | `reviewer` |
| Pre-mainnet release hardening | `mainnet-hardening` plus impacted domain workflows | domain specialists by scope | `security`, `qa`, `docs`, `reviewer` |

## Validation Checklist

- `AGENTS.md` routes only and points to canonical governance.
- Workflows define process, gates, evidence, and handoffs only.
- Agents define expertise, scope, and context boundaries only.
- Policies define reusable constraints only.
- Canonical governance remains in `docs/governance/*` and executable scripts.
- The architecture is safe for parallel specialist delegation because write ownership is explicit and cross-cutting reviewers are reusable.
