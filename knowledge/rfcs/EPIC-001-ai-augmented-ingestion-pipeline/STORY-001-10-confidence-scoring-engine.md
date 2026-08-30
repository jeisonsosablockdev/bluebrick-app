---
type: RFC
title: STORY-001-10 Confidence Scoring & Anomaly Flagging Engine
description: RFC Story for evaluating AI extraction confidence scores, enforcing hard anomaly vetos, 80% deterministic weighting, and automated routing to NEEDS_REVIEW.
tags: [rfc, story, confidence-scoring, hitl, anomaly-detection, ai-quality, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-10-confidence-scoring-engine.md
---

# STORY-001-10-confidence-scoring-engine

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-10`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-10-confidence-scoring-engine`
- Created: `2026-08-25`
- Last Updated: `2026-08-25`

---

## Context
- **Problem:** Los modelos de IA pueden sobre-estimar su propia certeza en alucinaciones (auto-reportando confianza de 100%). Un sistema seguro no puede depender exclusivamente de la autoconfianza del LLM para auto-publicar datos en la base de datos de producción.
- **Why now:** Regula la frontera entre auto-publicación (`PROCESSED`) y revisión supervisada (`NEEDS_REVIEW`).
- **Constraints:**
  - Ponderación fuertemente determinista: 80% del puntaje se calcula mediante validaciones deterministas de completitud y formato, y solo 20% máximo proviene de la confianza declarada por el modelo.
  - Invariante de Veto Duro (*Hard Anomaly Veto*): Si existe al menos una bandera de anomalía (ej. NIT con dígitos repetidos, monto atípico, PII sospechosa), el puntaje final se topea a un máximo de 50% y el estado se fuerza a `NEEDS_REVIEW` independientemente de lo que reporte el LLM.
  - Umbral estricto: Puntuaciones de 89.99% o menores derivan obligatoriamente a `NEEDS_REVIEW`. Solo puntuaciones $\ge 90.00\%$ sin anomalías se auto-publican.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/scoring/confidence-scoring-engine.ts`
  - `apps/web/src/features/ai-ingestion/domain/scoring/anomaly-detector.ts`
  - `apps/web/src/features/ai-ingestion/domain/scoring/confidence-scoring-engine.test.ts`

---

## Proposal
- **Approach summary:** Implementar un motor de puntuación puro en Dominio que evalúa campos críticos, ejecuta detectores de anomalías, aplica la fórmula de ponderación y emite una decisión de enrutamiento con trazabilidad detallada en el campo `metadata` de la sincronización.
- **Technical design:**
  1. **Deterministic Field Scorer:**
     - Evalúa validez de `name` (25%), `taxId` (25%), `contractAmount` (20%), `email` (15%), `phone` (15%).
  2. **Anomaly Detectors:**
     - `SUSPICIOUS_TAX_ID` (dígitos idénticos como "111111111").
     - `OUTLIER_AMOUNT` (montos > 10,000,000 USD o <= 0).
     - `AMBIGUOUS_LEGAL_NAME` (nombres genéricos o incompletos).
  3. **Composite Formula:**
     $$\text{RawScore} = (0.80 \times \text{DeterministicScore}) + (0.20 \times \text{ModelReportedConfidence})$$
     $$\text{FinalScore} = \text{anomalies.length} > 0 \ ? \ \min(\text{RawScore}, 0.50) : \text{RawScore}$$
- **Alternatives considered:**
  - *Confiar en el score del LLM únicamente:* Descartado por vulnerabilidad a alucinaciones y prompt injection.
- **Tradeoffs:**
  - El cálculo determinista es auditable, predecible y no agrega latencia de red.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Model Confidence Spoofing:* Resuelto reduciendo el peso del modelo al 20% y exigiendo 80% determinista.
  2. *Soft Anomaly Overrides:* Resuelto con el Veto Duro que fuerza `NEEDS_REVIEW` ante cualquier anomalía.
  3. *Weight Sum Invariant:* Resuelto asegurando que la suma de pesos de campos equivalga exactamente a 1.0.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Motor de scoring híbrido dominado por reglas deterministas y veto de anomalías.
- **Changes accepted:** Todas las recomendaciones integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado para desarrollo TDD.

---

## Status
- **Current status:** `approved`
- **Next action:** Escribir tests unitarios en `confidence-scoring-engine.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Score de 89.99% estrictamente rechazado de auto-publicación (`NEEDS_REVIEW`).
  2. Detección de NIT sospechoso forzando veto y score <= 50%.
  3. Invariante de suma de pesos verificando que `sum(fieldWeights) === 1.0`.
  4. Documento impecable alcanzando score $\ge 95\%$ y estado `PROCESSED`.
- **Integration tests:**
  - Ingesta de cliente con anomalías y verificación de derivación al panel de revisión.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-10`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
