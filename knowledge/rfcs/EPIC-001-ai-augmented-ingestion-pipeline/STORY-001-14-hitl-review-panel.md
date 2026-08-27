---
type: RFC
title: STORY-001-14 Human-in-the-Loop (HITL) Review Panel & Quick Actions
description: RFC Story for interactive assisted validation UI, RBAC authorization on Server Actions, Zod re-parsing, and sandboxed PDF/image previewers.
tags: [rfc, story, hitl, human-in-the-loop, review-panel, server-actions, rbac, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-14-hitl-review-panel.md
---

# STORY-001-14-hitl-review-panel

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-14`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-14-hitl-review-panel`
- Created: `2026-08-25`
- Last Updated: `2026-08-25`

---

## Context
- **Problem:** Las Server Actions que aprueban contratos y modifican datos fiscales de clientes pueden sufrir de escalación de privilegios (IDOR) si no verifican roles de usuario, mientras que el visor de PDFs embebidos puede sufrir de ataques XSS si se ejecuta en contextos no aislados.
- **Why now:** Provee el módulo interactivo de control de calidad final supervisado por humanos.
- **Constraints:**
  - Control de acceso RBAC estricto en Server Actions: Solo usuarios con rol `ADMIN` o `COMPLIANCE` pueden invocar `approveIngestedRecordAction`.
  - Re-validación Zod forzosa: Toda modificación manual debe pasar por `CanonicalClientSchema.safeParse()` antes de persistirse.
  - Visor seguro de PDFs: Renderizado en iframe aislado con sandbox restringido o visor Canvas (PDF.js) con ejecución de scripts deshabilitada.
  - Revalidación de caché mediante `revalidatePath('/dashboard/ingestion-review')`.
- **Affected paths:**
  - `apps/web/src/app/dashboard/ingestion-review/page.tsx`
  - `apps/web/src/features/ai-ingestion/application/actions/hitl-review-actions.ts`
  - `apps/web/src/components/review/hitl-split-viewer.tsx`
  - `apps/web/src/features/ai-ingestion/application/actions/hitl-review-actions.test.ts`

---

## Proposal
- **Approach summary:** Construir la interfaz de revisión con vista dividida (Split View), protegida contra XSS y conectada a Server Actions seguras que validan sesión, permisos y contratos Zod antes de actualizar el estado a `PROCESSED`.
- **Technical design:**
  1. **Server Actions Security Protocol:**
     - Comprobación de sesión activa y rol administrativo.
     - Token de idempotencia en la acción para evitar doble click accidental.
     - Re-parseo Zod del payload corregido.
  2. **Sandboxed Document Preview:**
     - Visor protegido sin ejecución de scripts para evitar que PDFs maliciosos roben cookies de sesión.
- **Alternatives considered:**
  - *Iframe directo sin sandbox:* Descartado por vulnerabilidad de seguridad XSS.
- **Tradeoffs:**
  - La re-validación en el servidor previene que usuarios malintencionados envíen datos arbitrarios modificando el DOM.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *IDOR Privilege Escalation:* Resuelto con validación de roles en Server Actions.
  2. *PDF XSS Injection:* Resuelto con sandbox estricto en el visor.
  3. *Double-Click Concurrency:* Resuelto con token de idempotencia en la mutación.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Panel Human-in-the-Loop seguro, accesible y con validación bidireccional.
- **Changes accepted:** Todas las recomendaciones integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado para desarrollo de componentes y Server Actions.

---

## Status
- **Current status:** `approved`
- **Next action:** Escribir tests unitarios para las Server Actions y componentes UI.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Rechazo de Server Action por usuario no autenticado o sin rol de administrador.
  2. Re-validación de payload manual rechazando correos o NITs inválidos.
  3. Protección contra envío doble mediante token de idempotencia.
- **Integration tests:**
  - Flujo completo de aprobación manual de un registro en `NEEDS_REVIEW` a `PROCESSED`.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** Pruebas de usabilidad en monitores 1920px y laptops 1280px.

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-14`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
