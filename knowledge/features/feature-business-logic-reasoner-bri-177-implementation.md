---
type: Feature Spec
title: Feature Business Logic Reasoner BRI- 177 Implementation
description: Feature Business Logic Reasoner BRI- 177 Implementation - migrated from docs/
tags: [knowledge]
timestamp: 2026-06-16T15:15:38Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/knowledge/features/feature-business-logic-reasoner-bri-177-implementation.md
---


# Solution: Business Logic Reasoner - Self-Discover Agent

## Architecture Overview

Implements the **Self-Discover** architecture (Zhou et al., Google DeepMind 2024) as a **reusable reasoning agent**:

```
TASK → SELECT → ADAPT → IMPLEMENT → SOLVE → ANSWER + REASONING_TRACE
```

Each stage is a structured-output LLM call. The agent **designs its reasoning structure** (selects/adapts modules, composes plan) then executes it.

## Decisions Confirmed

| # | Decision | Value | Rationale |
|---|----------|-------|-----------|
| 1 | Module Library | 16 canonical Self-Discover modules (no extensions) | Proven in paper; domain logic via ADAPT stage |
| 2 | Output Format | Structured reasoning trace + final answer (Markdown) | Trace inspectable; answer reusable |
| 3 | LLM Provider | Qwen 3.7 Plus via **OpenRouter** | Multi-provider gateway; fallback support |
| 4 | Human-in-the-loop | Review reasoning trace → Approve / Request Changes → Iterate → Wait Approval (**no iteration limit**) | Mandatory per governance; no auto-commit |
| 5 | Scope | **Reasoning agent** — produces docs/designs, **Mermaid/PlantUML diagrams**, algorithms, threat models; code gen separate | Clear boundary |
| 6 | Test Strategy | **Solana MCP + solana-dev skill** for validation | Real devnet proofs validate reasoning outputs |
| 6 | Invocation Model | **CLI tool + library** — `reasoning-agent "task"` or `import { reason } from 'reasoning-agent'` | Usable standalone or in workflows |

## Self-Discover Pipeline (Core)

### Stage 1: SELECT
```typescript
interface SelectInput {
  task: string;
  moduleLibrary: Module[];  // 16 canonical modules
  context?: DomainContext;  // Solana/NFT/Compliance hints
}

interface SelectOutput {
  selectedIds: number[];           // 3-6 indices from 0-15
  selectedModules: string[];       // Module descriptions
  selectionRationale: string;      // Why these modules for this task
}
```

### Stage 2: ADAPT (Domain-Aware)
```typescript
interface AdaptInput {
  task: string;
  selectedModules: string[];
  domainContext: DomainContext;    // Solana, NFT, Compliance, etc.
}

interface AdaptOutput {
  adaptedModules: Array<{
    original: string;              // Canonical module text
    adapted: string;               // Domain-specific rephrasing
    // e.g., "List facts, constraints, unknowns" 
    //   → "List PDA seeds, rent-exempt lamports, signer requirements, authority constraints"
  }>;
}
```

### Stage 3: IMPLEMENT
```typescript
interface ImplementInput {
  task: string;
  adaptedModules: AdaptedModule[];
}

interface ImplementOutput {
  planSteps: Array<{
    stepNumber: number;
    description: string;           // References adapted module(s)
    expectedOutput: string;        // Concrete expected output
  }>;
  finalAnswerFormat: string;       // e.g., "Markdown feature spec with frontmatter"
}
```

### Stage 4: SOLVE
```typescript
interface SolveInput {
  task: string;
  plan: ReasoningPlan;
  domainContext: DomainContext;
}

interface SolveOutput {
  stepOutputs: string[];           // Output from each plan step
  finalAnswer: string;             // Complete generated document/design
  reasoningTrace: ReasoningTrace;  // Full SELECT/ADAPT/IMPLEMENT/SOLVE log
}
```

## Domain Context & Module Adaptation (Key Innovation)

The **ADAPT stage** is where task-specific language lives. The 16 canonical modules are **universal reasoning patterns**. ADAPT rephrases them for the task at hand:

| Canonical Module | Solana (via adapter) | NFT (via adapter) | Compliance (via adapter) | Architecture (no adapter) | Debugging (no adapter) |
|------------------|---------------------|-------------------|-------------------------|---------------------------|------------------------|
| `List facts, constraints, unknowns` | PDA seeds, rent lamports, signer reqs | Mint authority, metadata URI, royalty bps | KYC status, AML flags, guardrails | Components, interfaces, data flows | Symptoms, logs, config, env |
| `Make a table/list/diagram` | Account table: seeds, owner, space | Asset table: mint, metadata, royalty | Queue table: wallet, status, decision | Component diagram, sequence diagram | Call stack, timeline, state diff |
| `Consider counterexamples` | PDA collision, missing authority | Royalty > 10000, unverified collection | KYC expired, AML flagged post-approval | Single point of failure, race condition | Network partition, clock skew |
| `Check consistency` | Rent, signers, PDA seeds, ownership | Mint auth, royalty range, collection valid | KYC→AML→guardrail chain consistent | Contracts match, no circular deps | Fix resolves root cause, no regressions |
| `Devise algorithm/procedure` | Derive PDA → validate auth → build ix | Create collection → mint → attach metadata | Queue case → review KYC → review AML | Event loop → handler → emit event | Reproduce → isolate → fix → verify |

**Domain adapters (Solana/NFT/Compliance) are optional helpers** for recurrent domains in this codebase. The core agent works without them — pass any `domainContext` string and ADAPT will use the LLM's knowledge.

## Slice Map (Atomic Slices)

| Slice | Type | Branch | Description | Workflow | Depends On |
|-------|------|--------|-------------|----------|------------|
| **S01** | spec/doc | `feature/shared-spec-architecture-bri-177-s01-spec-architecture` | **DONE** - Universal architecture, contracts, module library, ADAPT design, integration points | `frontend-cycle` + `docs` + `explain-like-socrates` | — |
| **S02** | delivery | `feature/shared-core-engine-bri-177-s02-core-engine` | **DONE** - Core engine: SELECT/ADAPT/IMPLEMENT/SOLVE pipeline with structured output (Zod schemas), LLM provider abstraction — **domain-agnostic** | `frontend-cycle` + `reviewer` | S01 |
| **S03** | delivery | `feature/shared-domain-adapters-bri-177-s03-domain-adapters` | **DONE** - **Optional helpers** for recurrent domains: Solana, NFT, Compliance. Pluggable `DomainAdapter` interface for ADAPT stage | `frontend-cycle` + `blockchain-cycle` | S01, S02 |
| **S04** | delivery | `feature/shared-cli-invocation-bri-177-s04-cli-invocation` | **DONE** - CLI tool: `reasoning-agent "task" [--domain solana]` + library export; output modes; config | `frontend-cycle` | S01, S02 |
| **S05** | delivery | `feature/shared-workflow-integration-bri-177-s05-workflow-integration` | **DONE** - Workflow hooks: `task-init.sh --reasoning-agent`, Linear slice planner integration, knowledge system (`reasoning-plan` kind) | `frontend-cycle` + `docs` | S01, S02, S04 |
| **S06** | delivery | `feature/shared-validation-gates-bri-177-s06-validation-gates` | **DONE** - Validation gates: test-first pipeline, Solana MCP validation, human review workflow, `npm run validate` integration | `reviewer` + `qa` | S01-S05 |
| **S07** | delivery | `initiative/bri-177-business-logic-reasoner` | **DONE** - S07 Reasoning Integration: workflow `.codex/workflows/reasoning-cycle.md`, AGENTS.md routing, workflow hooks for blockchain-cycle, frontend-cycle, nft-cycle, mainnet-hardening | `frontend-cycle` + `docs` | S01-S06 |
| **S08** | delivery | `feature/shared-current-harness-fix-bri-177-s08-current-harness-fix` | Fix current test harness: resolve vitest config issues, fix mock LLM provider, ensure all S02-S06 tests pass in CI, update test infrastructure for reasoning agent | `frontend-cycle` + `qa` + `reviewer` | S02-S06 |

## Integration Points

### 1. Knowledge System (`scripts/knowledge/knowledge-core.ts`)
```typescript
// New KnowledgeKind
type KnowledgeKind = "observation" | "proposal" | "report" | "archive" | "reasoning-plan";

// New PromotionTarget  
type PromotionTarget = "guide" | "governance" | "automation" | "none";

// Reasoning plan entry
interface ReasoningPlanEntry extends KnowledgeEntry {
  kind: "reasoning-plan";
  reasoning_trace: {
    task: string;
    selected_modules: string[];
    adapted_modules: AdaptedModule[];
    plan_steps: PlanStep[];
    final_answer: string;
    llm_provider: string;
    model_version: string;
    domain_context: string;
  };
}
```

### 2. Task Bootstrap (`scripts/task-init.sh`)
```bash
# New flag
./scripts/task-init.sh --reasoning-agent "Design PDA hierarchy for escrow program" --domain solana

# Behavior:
# 1. Runs preflight
# 2. Invokes Self-Discover agent with task
# 3. Agent returns reasoning trace + feature spec
# 4. Human review loop (Approve / Request Changes)
# 5. On Approve: writes artifacts, creates branch, updates Linear
```

### 3. Linear Slice Planner (`scripts/linear-plan-core.js`)
- Self-Discover IMPLEMENT stage outputs slice map
- `linear-plan-core.js` consumes slice map → creates Linear issues + branches
- Traceability: reasoning trace → artifact → Linear issue → branch → PR → commit

### 4. Frontend Cycle (`.codex/workflows/frontend-cycle.md`)
- `planner` detects reasoning-agent scope
- `frontend` implements S02-S04 (core engine, domain adapters, CLI)
- `docs` validates generated artifacts pass `check-required-docs.sh`
- `reviewer` clean-code audit on generated code

### 5. Blockchain Cycle (`.codex/workflows/blockchain-cycle.md`)
- **Domain adapters (S03, optional)** provide Solana/NFT/Compliance context to ADAPT stage for tasks in those domains
- Solana: account architecture, PDA seeds, authority validation, CPI patterns
- NFT: mint authority, metadata ownership, royalty model, collection validation
- Compliance: KYC/AML gates, financial guardrails, audit events
- **Core agent works without adapters** — any domain context passed via CLI/library

## Clean-Code Contracts (Per Slice)

### S02: Core Engine
- **Single Responsibility**: Each stage (SELECT/ADAPT/IMPLEMENT/SOLVE) in own module
- **Dependency Inversion**: LLM provider injected via interface (`ReasoningLLM`)
- **No Side Effects**: Stages are pure functions (input → output)
- **Testability**: Deterministic with mocked LLM; golden file tests for each stage

### S03: Domain Adapters
- **Strategy Pattern**: Domain adapters implement `DomainAdapter` interface
- **Extensibility**: New domains (DeFi, Gaming) add adapter without modifying core
- **Type Safety**: Domain-specific types (SolanaAccount, NFTMetadata, ComplianceGate)

### S04: CLI Invocation
- **Command Pattern**: `reasoning-agent` delegates to agent service
- **Configurable**: Model, temperature, domain, output mode via flags/env
- **Streaming**: Long-running tasks show progress (stage by stage)

### S05: Workflow Integration
- **Open/Closed**: New workflow hooks added without modifying agent core
- **Idempotency**: Re-running with same task produces same reasoning trace
- **Audit Trail**: Every invocation logged with actor, timestamp, task hash

### S06: Validation Gates
- **Pipeline Stages**: Lint → Typecheck → Unit → Integration → Solana MCP → Knowledge → Clean-code
- **Evidence Collection**: Artifacts stored per run (traces, generated docs, review findings, devnet proofs)

## Human-in-the-Loop Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT REASONS                            │
│  Input: Task + optional domain context                      │
│  Output: Reasoning trace (SELECT/ADAPT/IMPLEMENT/SOLVE)    │
│         + Final answer (doc/design)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              HUMAN REVIEWS REASONING TRACE                  │
│  Checks:                                                    │
│  ✓ Module selection appropriate?                            │
│  ✓ Domain adaptation correct? (Solana/NFT/Compliance)       │
│  ✓ Plan steps logical and complete?                         │
│  ✓ Final answer solves task?                                │
│  Options:                                                   │
│  ✅ APPROVE      → Accept answer + commit artifacts         │
│  🔄 REQUEST CHANGES → Structured feedback → Agent re-reasons│
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌─────────────┐         ┌─────────────┐
       │  RE-REASON  │         │  WAIT       │
       │  (iterate)  │         │  APPROVAL   │
       └─────────────┘         └─────────────┘
```

**Feedback Format (structured):**
```markdown
## Reasoning Review Feedback

### Reasoning Trace Assessment
| Stage | Assessment | Notes |
|-------|------------|-------|
| SELECT | ✅ Appropriate modules | Good coverage |
| ADAPT | ⚠️ Missing PDA collision check | Add to step 2 |
| IMPLEMENT | ✅ Logical plan | Clear steps |
| SOLVE | ❌ Answer misses rent calculation | Re-reason |

### Blocking?
☐ Yes — must resolve before approval
☐ No — optional improvements
```

## Validation Gates

| Gate | Command | Evidence | Blocking |
|------|---------|----------|----------|
| **S01 Spec Complete** | `explain-like-socrates` pass | Socratic transcript (this conversation) | Yes |
| **S02 Core Engine** | `npm run test -- --testPathPattern=core-engine` | Coverage ≥80%; mocked LLM tests pass | Yes |
| **S03 Domain Adapters** | Domain-specific test vectors | All adapters produce correct adaptations (optional) | No* |
| **S03 Solana Validation** | `solana-dev` skill + MCP | Devnet proofs validate reasoning outputs (Solana tasks only) | No* |
| **S04 CLI** | `reasoning-agent "test task"` | Produces trace + answer; flags work | Yes |
| **S05 Workflow** | `./scripts/task-init.sh --reasoning-agent ...` | E2E bootstrap works; knowledge index updated | Yes |
| **S06 Full Pipeline** | `npm run validate` | All CI green | Yes |
| **Final Merge** | Human Acceptance | Linear comment "Human Acceptance ✅" | Yes |

*\*Optional slices — only blocking when domain adapters are used for tasks in those domains*

## S08: Current Harness Fix

### Problem
Current test harness has issues preventing S02-S06 tests from passing in CI:
- Vitest configuration conflicts with Next.js typegen
- Mock LLM provider not properly configured for stage tests
- Domain adapter golden file tests failing
- Knowledge integration tests not finding test fixtures

### Scope
- Fix `vitest.config.ts` for reasoning-agent test paths
- Implement proper `MockReasoningLLM` for deterministic stage testing
- Fix domain adapter test fixtures (Solana, NFT, Compliance)
- Ensure `validate:knowledge` passes with reasoning-plan kind
- Update CI pipeline to run reasoning-agent tests

### Clean-Code Contract (S08)
- **Single Responsibility**: Test infrastructure only — no production code changes
- **Boundary**: `tests/reasoning-agent/**` and `vitest.config.ts`
- **Naming**: `*test.ts` for unit, `*integration.test.ts` for integration
- **Duplication**: Reuse existing test utilities from `tests/lib/`
- **Tests**: All S02-S06 tests must pass; coverage ≥80% for test utilities

### Validation Gates (S08)
| Gate | Command | Evidence | Blocking |
|------|---------|----------|----------|
| **Unit Tests** | `npm run test -- --testPathPattern=reasoning-agent` | All S02-S06 tests pass | Yes |
| **Typecheck** | `npm run typecheck` | No TS errors in test files | Yes |
| **Lint** | `npm run lint` | No lint errors | Yes |
| **Full Validate** | `npm run validate` | All CI green | Yes |

## File Structure (New Files)

```
lib/
├── reasoning-agent/
│   ├── index.ts                    # Main entry: reason(task, options?)
│   ├── types.ts                    # Stage I/O interfaces (Zod schemas)
│   ├── module-library.ts           # 16 canonical modules (universal)
│   ├── stages/
│   │   ├── select.ts               # Stage 1: SELECT
│   │   ├── adapt.ts                # Stage 2: ADAPT (uses DomainAdapter if available)
│   │   ├── implement.ts            # Stage 3: IMPLEMENT
│   │   └── solve.ts                # Stage 4: SOLVE
│   ├── adapters/
│   │   ├── index.ts                # DomainAdapter interface (optional)
│   │   ├── solana-adapter.ts       # Solana domain adaptation (optional helper)
│   │   ├── collectible-domain-adapter.ts  # NFT/Metaplex (optional helper)
│   │   └── compliance-adapter.ts   # Compliance domain adaptation (optional helper)
│   ├── llm/
│   │   ├── index.ts                # ReasoningLLM interface
│   │   └── openrouter-provider.ts  # Qwen 3.7 Plus via OpenRouter
│   ├── cli.ts                      # CLI entry point
│   ├── knowledge-integration.ts    # Knowledge system hooks
│   ├── linear-integration.ts       # Linear slice planner hooks
│   └── human-review.ts             # Review/approve/iterate workflow
│
tests/
├── reasoning-agent/
│   ├── core-engine.test.ts         # Stage I/O contracts
│   ├── module-library.test.ts      # Module selection
│   ├── stages/
│   │   ├── select.test.ts
│   │   ├── adapt.test.ts           # Domain adaptation golden files
│   │   ├── implement.test.ts
│   │   └── solve.test.ts
│   ├── adapters/
│   │   ├── solana-adapter.test.ts
│   │   ├── collectible-domain-adapter.test.ts
│   │   └── compliance-adapter.test.ts
│   ├── integration/
│   │   ├── knowledge-index.test.ts
│   │   ├── linear-planner.test.ts
│   │   └── task-init-hook.test.ts
│   ├── cli.test.ts
│   └── human-review.test.ts        # Review workflow
│
scripts/
├── task-init.sh                    # <-- Add --reasoning-agent flag
├── knowledge/
│   └── knowledge-core.ts           # <-- Add reasoning-plan kind
└── linear-plan-core.js             # <-- Consume slice map from agent
```

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM hallucination in reasoning | Medium | High | Structured output schemas; human review mandatory; Solana MCP validation |
| Module selection inconsistent | Low | Medium | Temperature=0.4; reasoning model; few-shot examples in prompts |
| Domain adaptation incorrect | Medium | High | Golden file tests per domain; Solana MCP validates outputs |
| Knowledge index drift | Low | High | `validate:knowledge` in CI; auto-promotion gates |
| Performance (4 LLM calls ~30-60s) | High | Low | Acceptable for bootstrap; cache module selections; async pipeline |
| Reasoning trace too verbose | Medium | Low | Configurable verbosity; summary mode for CI |

## Rollout Plan

1. **S01** (this slice): Architecture, contracts, domain adaptation design → `explain-like-socrates` → Human approval
2. **S02**: Core engine with mocked LLM → Unit tests → Clean-code review
3. **S03**: Domain adapters → Solana/NFT/Compliance adaptation golden files + Solana MCP validation
4. **S04**: CLI tool + library export → Integration test
5. **S05**: Workflow hooks → E2E bootstrap test + knowledge index
6. **S06**: Full pipeline → `npm run validate` green
7. **S07**: S07 Reasoning Integration → workflow creation, AGENTS.md routing, workflow hooks
8. **S08**: Current Harness Fix → Fix test infrastructure, ensure all tests pass
9. **Human Acceptance** → Merge to `develop`

## Open Decisions (Post-S01)

- [ ] Exact OpenRouter API key management in CI/CD
- [ ] Golden file update policy for domain adaptations
- [ ] Max reasoning trace verbosity default
- [ ] Telemetry/metrics for reasoning quality (module selection patterns, adaptation accuracy)

---

**S01 Complete**: `explain-like-socrates` pass done. All decisions resolved. Ready for S02.