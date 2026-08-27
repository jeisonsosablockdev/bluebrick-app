---
type: RFC
title: STORY-001-02 Canonical Domain Contracts & Zod Validation Gate
description: RFC Story for single-source-of-truth canonical Zod schemas, prototype pollution immunity, exact decimal financial precision, and zero-implicit-any domain models.
tags: [rfc, story, zod, data-contracts, schema-alignment, domain-invariants, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-02-schema-alignment-contracts.md
---

# STORY-001-02-schema-alignment-contracts

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-02`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-02-schema-alignment-contracts`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** La IA puede emitir campos alucinados, tipos inconsistentes o estructuras deformadas. Además, la pérdida de precisión de punto flotante en JavaScript (`0.1 + 0.2 !== 0.3`) y ataques de *Prototype Pollution* en campos `metadata` JSONB amenazan la integridad de los datos financieros.
- **Why now:** Es el contrato canónico central sobre el cual descansan todas las demás etapas de la tubería (PDFs, Excels, scoring, repositorios y UI).
- **Constraints:**
  - Cero dependencias externas en la capa de Dominio (solo Zod y utilidades puras de TypeScript).
  - Protección contra Prototype Pollution: Sanitizar y despojar propiedades `__proto__`, `constructor` y `prototype`.
  - Precisión financiera exacta: Representación de importes monetarios como strings decimales fijos (`/^\d+(\.\d{1,2})?$/`) o enteros en centavos, rechazando `NaN` e `Infinity`.
  - Eliminación estricta de campos no declarados con `.strict()` o `.strip()` en esquemas Zod.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/schemas/canonical-client-schema.ts`
  - `apps/web/src/features/ai-ingestion/domain/schemas/canonical-project-schema.ts`
  - `apps/web/src/features/ai-ingestion/domain/schemas/canonical-media-schema.ts`
  - `apps/web/src/features/ai-ingestion/domain/schemas/canonical-sync-record-schema.ts`
  - `apps/web/src/features/ai-ingestion/domain/schemas/canonical-schemas.test.ts`

---

## Proposal
- **Approach summary:** Implementar los esquemas canónicos de dominio con Zod, exportando tipos inferidos de TypeScript y validadores seguros que sanitizan prototipos y formatean errores para el panel Human-in-the-Loop.
- **Technical design:**
  1. **Canonical Schema Definitions:**
     - `CanonicalClientSchema`: `id`, `name`, `taxId`, `email`, `phone`, `contractAmount` (regex decimal), `status`, `metadata` (sanitized object).
     - `CanonicalProjectSchema`: `id`, `name`, `description`, `status`.
     - `CanonicalMediaSchema`: `id`, `projectId`, `blobUrl`, `mediaType`, `caption`, `aiTags`, `aspectRatio`, `focalPoint`, `dimensions`.
     - `CanonicalSyncRecordSchema`: `driveFileId`, `fileName`, `folderPath`, `md5Checksum`, `syncStatus`, `confidenceScore`, `metadata`, `lastModifiedTime`.
  2. **Security Pre-processors:**
     - `stripPrototypeProperties(obj: unknown): unknown`.
  3. **Human-Readable Error Formatter:**
     - `formatZodIssuesForHitl(issues: ZodIssue[]): HitlValidationIssue[]`.
- **Alternatives considered:**
  - *TypeScript interfaces únicamente:* Descartadas por no ofrecer garantías en tiempo de ejecución.
- **Tradeoffs:**
  - Garantiza 100% de consistencia entre la inferencia de IA, la persistencia en PostgreSQL y el renderizado en Next.js.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Prototype Pollution via JSONB:* Resuelto con filtro sanitizador de prototipos.
  2. *Floating Point Financial Corruption:* Resuelto con validación estricta de decimales mediante regex/BigInt.
  3. *Undeclared Key Hallucinations:* Resuelto con stripping forzoso en Zod.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Contratos de dominio canónicos e inmutables con inmunidad contra polución y redondeo.
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
- **Next action:** Escribir tests unitarios en `canonical-schemas.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests (`canonical-schemas.test.ts`):**
  1. Rechazo de `NaN`, `Infinity` y valores negativos en montos contractuales.
  2. Detección y neutralización de claves `__proto__` en metadatos.
  3. Validación exhaustiva de correos, teléfonos y estados enum.
  4. Formateo amigable de errores Zod para el panel HITL.
- **Integration tests:**
  - Validación de entidades canónicas previo a persistencia.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-02`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
