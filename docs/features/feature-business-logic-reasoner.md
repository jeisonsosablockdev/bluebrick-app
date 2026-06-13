---
id: feature-business-logic-reasoner
title: Business Logic Reasoner - Self-Discover Agent
status: observed
kind: observation
promotion_target: guide
scope: shared
filePath: docs/features/feature-business-logic-reasoner.md
owner: unassigned
created_at: 2026-06-12T18:30:00.000Z
updated_at: 2026-06-12T18:30:00.000Z
source_issue: BRI-177
source_feature: business-logic-reasoner
enforcement_candidate: yes
---

# Feature: Business Logic Reasoner - Self-Discover Agent

## Problem Statement

Current development workflow lacks **deep, structured reasoning** for complex feature design and architectural decisions. When tackling problems involving:
- Solana account architecture, PDA seeds, authority validation, CPI patterns
- NFT minting flows, metadata ownership, royalty models, collection validation
- Compliance gates (KYC/AML, financial guardrails, audit events)
- Multi-step business logic with invariants and constraints

Developers rely on ad-hoc Chain-of-Thought ("think step by step") which:
- **Fails when task needs a different reasoning structure** (tables, counterexamples, algorithms)
- **Cannot invent the reasoning structure** — only unfolds a fixed template
- **Misses domain-specific constraints** — no awareness of Solana rent, Metaplex invariants, compliance rules
- **Produces inconsistent artifacts** — feature specs, architecture docs vary wildly in quality

## Why It Matters

1. **Governance compliance**: `docs/governance/documentation-policy.md` requires feature/fix artifact pairs before implementation — but artifacts are low quality without deep reasoning
2. **Velocity**: Teams spend hours debugging logic gaps that structured reasoning would catch early
3. **Quality**: Business logic complexity (Solana/NFT/compliance) needs **discovered reasoning structure**, not free-form text
4. **Reusability**: Reasoning patterns (e.g., "validate PDA seeds → check authority → build instruction") should be composable across tasks

## Current Gaps

| Gap | Impact |
|-----|--------|
| No structured reasoning agent | Ad-hoc CoT misses domain constraints |
| No business-logic-aware reasoning | Solana/NFT/compliance nuances ignored |
| Fixed "think step by step" prompt | Cannot adapt reasoning structure to task type |
| No reasoning traceability | Cannot audit/improve reasoning process |
| Artifacts disconnected from reasoning | Docs generated without reasoning audit trail |

## Expected Outcome

A **Universal Self-Discover Reasoning Agent** (implementing Zhou et al., Google DeepMind 2024) that:

**Architecture**: Four-stage pipeline — `SELECT → ADAPT → IMPLEMENT → SOLVE`

1. **SELECT**: Picks 3-6 atomic reasoning modules from 16-module **universal** library
2. **ADAPT**: Rephrases each module in **task-specific language** (any domain: Solana, architecture, debugging, security, algorithms, etc.)
3. **IMPLEMENT**: Composes adapted modules into explicit step-by-step reasoning plan
4. **SOLVE**: Executes plan to produce **final answer** (feature spec, architecture design, RFC stub, diagram, algorithm, threat model, etc.)

**Key difference from CoT**: The agent **designs its own reasoning structure** before solving — the structure becomes a first-class, inspectable, reusable artifact.

**Domain Adapters**: Optional helpers for recurrent domains in this codebase (Solana, NFT, Compliance). Core agent is domain-agnostic.

## Scope Boundaries

### In Scope (MVP)
- **Universal Self-Discover Agent Core**: Four-stage pipeline with structured outputs (Zod/Pydantic) — **domain-agnostic**
- **Module Library**: 16 canonical modules (universal reasoning patterns)
- **ADAPT Stage**: Rephrases modules for any task domain via LLM knowledge + optional DomainAdapter helpers
- **Optional Domain Adapters**: Pluggable helpers for recurrent domains (Solana, NFT, Compliance)
- **Invokable Interface**: CLI/tool entry point — `reasoning-agent "task" [--domain solana]` 
- **Output Modes**: 
  - Reasoning trace (SELECT/ADAPT/IMPLEMENT/SOLVE log)
  - Final answer (Markdown doc, architecture design, **Mermaid/PlantUML diagrams**, RFC stub, algorithm, threat model, etc.)
- **Integration**: `task-init.sh --reasoning-agent`, knowledge system, Linear slice planner
- **Human-in-the-loop**: Review reasoning trace → Approve / Request Changes → Iterate

### Out of Scope (Future)
- Auto-commit without human approval
- Full code generation (only reasoning → docs/designs)
- Multi-language support

## Open Questions (Resolved via `explain-like-socrates`)

1. **Module Library**: ✅ **16 canonical modules** — domain logic via ADAPT stage
2. **LLM Provider**: ✅ **Qwen 3.7 Plus via OpenRouter** — reasoning model with thinking tokens
3. **Test Strategy**: ✅ **Solana MCP + solana-dev skill** — devnet proofs validate reasoning outputs
4. **Human Review Iterations**: ✅ **No limit** — iterate until reasoning trace is sound
5. **Scope Boundary**: ✅ **Reasoning agent** — produces docs/designs; code gen separate
6. **Invocation Model**: ✅ **CLI tool + library** — usable standalone or in workflows

## Success Criteria

- [x] Problem artifact created (this document)
- [x] Solution artifact created with architecture, contracts, integration points
- [x] S01 spec slice completes `explain-like-socrates` pass
- [x] All open questions resolved via Socratic pass
- [x] S02: Universal core engine implements SELECT/ADAPT/IMPLEMENT/SOLVE with structured output
- [x] S03: Optional domain adapters (Solana, NFT, Compliance) for ADAPT stage
- [x] S04: CLI invocation + workflow integration
- [x] S05: Knowledge system integration (reasoning traces as knowledge entries)
- [x] S06: Validation gates + Human Acceptance