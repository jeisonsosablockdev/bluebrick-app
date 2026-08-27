# Problem Spec: ai-architect-ingestion-pipeline

## What problem exists
The current architecture subagent (`architect`) focuses primarily on Web3/Solana functional pipelines and general monorepo boundaries. As our platform expands to include **AI-Augmented Ingestion Pipelines** (ingesting unstructured data from Google Drive, cloud storage, external APIs, and documents) and **Schema Alignment** (aligning heterogeneous incoming schemas into canonical, strongly typed domain contracts via LLMs/transformers), the existing agent lacks the domain-specific heuristics, validation gates, and pipeline patterns necessary to govern AI workflows.

Without a dedicated **AI Architect** subagent and canonical RFC suite:
1. Ingestion pipelines risk leaking unvalidated AI responses directly into persistence and UI layers.
2. Monorepo folder organization risks drift, with AI connectors and transformation schemas intermingled with presentation or raw state stores.
3. Schema alignment lacks deterministic data contracts, leading to silent schema drift and untyped payload propagation.
4. Developers and subagents lack automated Gate 1 scaffolding and Gate 2 diff auditing tailored for AI ingestion pipelines.

## Why it matters
1. **Architectural Integrity & Data Quality**: The ingestion pipeline is the critical entrypoint for external data. Enforcing strict schema alignment and zero-trust validation before persistence guarantees downstream reliability for both the UI and on-chain integrations.
2. **Standardization & Modularity**: A dedicated `ai-architect` subagent guarantees that all AI features follow Feature-Driven Design (FDD) and 4-layer functional boundaries (Presentation -> Application -> Domain Pipelines -> Infrastructure).
3. **Double-Gatekeeper Governance**: Providing pre-implementation scaffolding (Gate 1) and post-implementation diff audits (Gate 2) ensures zero magic code, complete in-code commentary, and full compliance with monorepo policies.

## What outcome is expected
1. **Subagent Specification & Definition**:
   - `.agents/agents/ai-architect.yaml` created with full scope, layer definitions, forbidden/mandatory syntax patterns, and comprehensive system prompt.
   - Dynamic registration of `ai-architect` in Google Antigravity SDK via `define_subagent`.
2. **Canonical Architectural Specification & RFC Suite**:
   - `knowledge/architecture/ai-augmented-ingestion-pipeline.md` established as the canonical ADR and architecture blueprint.
   - `knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/` with 14 decision-complete story specifications (`STORY-001-01` through `STORY-001-14`).
3. **Governance & Graph Alignment**:
   - `AGENTS.md`, `.agents/agents/planner.yaml`, and `.agents/graph.json` synchronized to include `ai-architect`.
4. **Validation**:
   - Full monorepo structure check (`scripts/ci/check-monorepo-structure.sh`) and codebase validation (`pnpm validate`) passing cleanly.

## What gaps exist today
1. No dedicated agent specification exists for AI ingestion pipelines and schema alignment.
2. No canonical architectural ADR documenting the 5-stage ingestion lifecycle (Connect -> Extract/Chunk -> AI Schema Alignment -> Zod Validation Gate -> Persistence/Dispatch).
3. No automated layer rules prohibiting AI model SDKs from being imported directly in Layer 1 Presentation components.

## What questions remain open
- All initial questions resolved: The user confirmed creating a dedicated `ai-architect` subagent and governing the 14-story Ingestion Pipeline RFC under `EPIC-001`.

