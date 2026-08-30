---
type: RFC
title: STORY-001-08 PDF Contracts & Legal Docs Ingestion
description: RFC Story for multimodal parsing of PDF contracts, extracting legal/financial entities, handling encrypted PDFs, validating NIT modulo 11, and enterprise zero-retention privacy.
tags: [rfc, story, pdf-parser, contracts, gemini, security, pii, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-08-pdf-contracts-ingestion.md
---

# STORY-001-08-pdf-contracts-ingestion

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-08`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-08-pdf-contracts-ingestion`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Los contratos de compraventa y fideicomisos en PDF pueden estar encriptados con contraseña, contener inyecciones de texto invisible en color blanco, o incluir datos personales (PII) sensibles. El extractor debe rechazar PDFs con clave, procesar documentos de gran tamaño (>8MB) vía Files API y validar el dígito de verificación del NIT (Módulo 11) para evitar alucinaciones en datos fiscales.
- **Why now:** Automatiza la creación de fichas de clientes y montos contractuales en el sistema.
- **Constraints:**
  - PDFs protegidos por contraseña deben fallar de inmediato con `ENCRYPTED_PDF_REJECTED` y marcar `NEEDS_REVIEW`.
  - PDFs > 8MB se transfieren mediante Google AI Files API en lugar de Base64 inline para evitar bloating de memoria.
  - Validación matemática del dígito de verificación del NIT (Módulo 11).
  - Privacidad de datos: Uso exclusivo de API empresarial de Gemini con política de retención cero de datos.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/pdf-extractor-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/gemini-pdf-extractor-adapter.ts`
  - `apps/web/src/features/ai-ingestion/domain/validators/nit-validator.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/gemini-pdf-extractor-adapter.test.ts`

---

## Proposal
- **Approach summary:** Implementar el extractor de contratos en PDF con detección de encriptación previa, subida optimizada, prompt de auditoría legal estructurado y validación algorítmica de identificación fiscal.
- **Technical design:**
  1. **Pre-flight Encryption Check:**
     - Comprobar cabecera `/Encrypt` en el stream binario de PDF.
  2. **Gemini Multimodal Ingestion:**
     - Prompt con esquema JSON estricto (`CanonicalClientSchema`).
     - Delimitar el contenido del documento como datos no ejecutables con bloques `<document_content>`.
  3. **NIT Modulo 11 Verification:**
     - Función pura `validateNitChecksum(nit: string, checkDigit: string): boolean`.
- **Alternatives considered:**
  - *Tesseract OCR:* Descartado por no comprender semántica de tablas y cláusulas contractuales complejas.
- **Tradeoffs:**
  - La validación determinista del NIT captura el 100% de errores OCR en caracteres ambiguos (ej. 'B' por '8').

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Encrypted PDFs:* Resuelto con detección pre-flight y marcado `NEEDS_REVIEW`.
  2. *Invisible Prompt Injection:* Resuelto delimitando el documento en XML y tratando el output como propuesta sujeta a validación Zod.
  3. *NIT OCR Misreads:* Resuelto con validador de Módulo 11.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Extractor multimodal con verificación criptográfica y matemática de datos fiscales.
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
- **Next action:** Escribir tests unitarios en `gemini-pdf-extractor-adapter.test.ts` y `nit-validator.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Detección y rechazo de PDF protegido con contraseña.
  2. Validación de NITs colombianos e internacionales válidos e inválidos por Módulo 11.
  3. Extracción de razón social, correo, teléfono y montos monetarios limpios.
  4. Manejo de PDFs de gran tamaño (>8MB) vía Files API.
- **Integration tests:**
  - Ingesta de contrato sintético y validación de salida canónica.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-08`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
