# AI Ingestion & Schema Alignment Cycle (Gemini / Antigravity)

## Trigger
- Implementation or modification of data ingestion pipelines (Google Drive, Cloud Storage, webhooks, document parsers).
- Schema alignment, entity extraction, or AI transformation models (Gemini / Antigravity SDK).
- Creation or updates to canonical Zod schemas, data contracts, and validation gates.
- Pipeline monitoring dashboards, schema diff inspector components, or ingestion application hooks.

## Subagents
- `planner` (You, orchestrating)
- `ai-architect` (Gate 1 scaffolding & Gate 2 diff/commentary audit)
- `api` (Layer 4 API & external source connectors)
- `db` (Layer 4 persistence repositories & migrations)
- `frontend` (Layer 1 monitor/diff UI & Layer 2 consumption hooks)
- `qa` (TDD tests, contract validation, and pipeline verification)
- `reviewer` (clean code, layer boundaries, and final completion gate)

## Required Policies & ADRs
- `knowledge/architecture/ai-augmented-ingestion-pipeline.md`
- `knowledge/governance/clean-code-folder-structure.md`
- `knowledge/governance/security-quality-policy.md`
- `.agents/policies/docs-policy.md`
- `.agents/policies/testing-policy.md`

## Antigravity Execution Sequence
| Step | Goal | Gemini / Subagent Action |
| --- | --- | --- |
| 1 | **Detect Scope & Graph Lookup** | Consult `.agents/graph.json` to map affected features, schemas, and pipeline boundaries. |
| 2 | **Gate 1: Architecture Review & Scaffolding** | Spawn `ai-architect` to validate the projected 4-layer file paths in the Solution Spec, and physically scaffold files with layer headers and interface stubs. |
| 3 | **TDD RED Phase** | Spawn `qa` using `tdd-primal` to write comprehensive failing tests (`*.test.ts`) against the scaffolded contracts before implementing logic. |
| 4 | **Layer 4 Infrastructure Implementation** | Assigned specialist (`api`/`db`) implements source connectors (Drive, GCS, Gemini transports, DB repositories) with explicit error handling and retries. |
| 5 | **Layer 3 Domain Pipelines & Alignment** | Implement deterministic chunking, semantic schema alignment prompts, and strict Zod data contract validation gates (`pipe()`). |
| 6 | **Layer 2 & 1 Application / Presentation** | Implement reactive hooks (`useIngestionJob`), state stores, and UI monitor/diff views respecting layer boundaries. |
| 7 | **Refactor & In-Code Commentary Pass** | Execute clean-code refactoring pass. Enforce file layer headers, JSDoc/TSDoc blocks, `// Step N:` indicators, and invariant rationale. |
| 8 | **Gate 2: Diff Audit** | Spawn `ai-architect` to audit the written diff, verifying zero untyped AI payload leaks, zero forbidden imports, and clean monorepo root. |
| 9 | **Verification Gate** | Run `pnpm validate` and ensure 100% test pass rate and clean build. |

## Required Evidence in Walkthrough
- Documented 5-stage pipeline flow with input/output sample payloads.
- Verified Zod schema definitions and validation contract pass proof.
- 4-layer isolation and in-code commentary audit findings.
- Test execution results (`pnpm validate`).
