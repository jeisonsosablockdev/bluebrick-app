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
- **SPEC-4**: AI Ingestion Pipeline RFC Suite (`knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/` with 14 stories, `STORY-001-01` implemented).

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/harness/agent-ai-architect.test.ts`, `apps/web/src/features/ai-ingestion/infrastructure/google-service-account-adapter.test.ts`
- **Command**: `pnpm test`
- **Assertion Goals**:
  1. Verify that `.agents/agents/ai-architect.yaml` satisfies all schema properties (scope, layers, syntax rules, commentary requirements).
  2. Verify that monorepo whitelist and 4-layer boundary checks enforce AI pipeline path isolation.
  3. Verify runtime subagent tool permissions and registration.
  4. Verify that `GoogleServiceAccountAdapter` passes all 14 adversarial security, concurrency, and error boundary tests.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura canónica (`ai-augmented-ingestion-pipeline.md`) y artefactos duales están actualizados sin placeholders.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-7-ai-architect-ingestion-pipeline-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-7](https://linear.app/brids-app/issue/BBC-7)
