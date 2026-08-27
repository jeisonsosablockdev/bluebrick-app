# Solution Spec: ai-architect-ingestion-pipeline Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `ai-architect` (AI Architecture, Ingestion Pipelines & Schema Alignment Guardian)
- **Architect Gatekeeper**: `ai-architect` & `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The solution introduces a specialized AI Architecture governance layer and canonical ADR for AI Ingestion Pipelines & Schema Alignment:

### Layer 1: Presentation Layer (`apps/web/src/app`, `apps/web/src/components`)
- Ingestion monitor views, schema diff inspectors, status cards, and alignment review triggers.
- *Strict Invariant*: UI components must NEVER import AI model SDKs, direct PostgreSQL clients, or raw pipeline builders. UI only interacts with Layer 2 hooks.

### Layer 2: Application / Consumption Layer (`apps/web/src/lib/hooks`, `apps/web/src/lib/state`, `features/*/application`)
- Custom React hooks (`useIngestionPipeline`, `useSchemaAlignment`), client state stores (Zustand/React Query), and job status polling/SSE subscriptions.
- *Strict Invariant*: No JSX rendering; orchestrates domain pipelines and translates errors into user-friendly states.

### Layer 3: Domain / Pipelines Layer (`apps/web/src/lib/pipelines`, `features/*/domain`)
- Pure functional multi-stage pipeline:
  1. *Stage 1*: Deterministic extraction & text/token chunking.
  2. *Stage 2*: AI-augmented schema alignment & semantic normalization.
  3. *Stage 3*: Data contracts gate (Strict Zod validation, invariant checks).
- *Strict Invariant*: 100% agnostic to UI frameworks; zero React or Next.js imports.

### Layer 4: Infrastructure Layer (`apps/web/src/lib/infrastructure`, `apps/web/src/lib/db`, `features/*/infrastructure`)
- Connectors to external sources (Google Drive, Cloud Storage, webhooks), AI model transports (Gemini, Google Antigravity SDK), and database persistence (PostgreSQL / Neon, Vector DB).
- *Strict Invariant*: Implements concrete clients and I/O; consumed exclusively by domain pipelines or application services.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: AI Ingestion Pipeline & Schema Alignment Canonical ADR (`knowledge/architecture/ai-augmented-ingestion-pipeline.md`).
- **SPEC-2**: AI Architect Subagent Specification & Antigravity SDK Configuration (`.agents/agents/ai-architect.yaml` and runtime `define_subagent`).
- **SPEC-3**: Monorepo Governance Alignment (`AGENTS.md`, `planner.yaml`, `.agents/graph.json`).
- **SPEC-4**: AI Ingestion Pipeline RFC Suite (`knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/` with 14 stories, `STORY-001-01` through `STORY-001-14` fully implemented and tested).
- **SPEC-5**: Comprehensive Operations Manual & Setup Guide (`knowledge/operations/ai-ingestion-operations-guide.md`).

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test Suite**: 204 unit and integration tests across all 14 pipeline stories covering Google Auth, Zod contracts, Drive polling, Blob CDN, Sharp image optimizer, Gemini focal crop, Gemini video tagger, Gemini PDF extractor, SheetJS normalizer, Scoring 80/20 engine, Neon DDL, Idempotent repositories, Dashboard server views, and HITL server actions.
- **Command**: `pnpm test`
- **Assertion Goals**:
  1. Verify that `.agents/agents/ai-architect.yaml` satisfies all schema properties (scope, layers, syntax rules, commentary requirements).
  2. Verify that monorepo whitelist and 4-layer boundary checks enforce AI pipeline path isolation.
  3. Verify runtime subagent tool permissions and registration.
  4. Verify that all 14 ingestion stories pass all unit, integration, and security edge case tests.

## 5. Local Definition of Done (DoD)
- [x] Todas las 14 historias de EPIC-001 implementadas y validadas en ramas SPEC individuales.
- [x] La suite de pruebas de regresión pasa al 100% (204/204 tests en verde).
- [x] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [x] La documentación de arquitectura canónica y guía operativa (`ai-ingestion-operations-guide.md`) están completadas sin placeholders.
- [ ] Aprobación explícita del humano registrada (Human Acceptance).

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline-implementation.md)
- **Operations Guide**: [ai-ingestion-operations-guide.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/operations/ai-ingestion-operations-guide.md)
- **Linear Issue**: [Linear Ticket #BBC-7](https://linear.app/brids-app/issue/BBC-7)
