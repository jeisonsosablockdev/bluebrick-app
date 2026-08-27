---
type: RFC
title: STORY-001-07 Video Ingestion & Metadata Tagging
description: RFC Story for ingesting MP4/WebM progress videos, byte size constraints (max 250MB), streaming directly to Vercel Blob, and AI progress tagging.
tags: [rfc, story, video, mp4, webm, gemini, progress-tagging, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-07-video-ingestion-tagging.md
---

# STORY-001-07-video-ingestion-tagging

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-07`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-07-video-ingestion-tagging`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Los videos de avance de obra (drones, recorridos) pueden tener tamaños de varios gigabytes que saturarían el ancho de banda y la memoria de funciones serverless si se intentan cargar en RAM o procesar sin límites estrictos.
- **Why now:** Permite a los inversores ver el progreso audiovisual de los proyectos en tiempo real.
- **Constraints:**
  - Límite estricto de tamaño de archivo: `MAX_VIDEO_SIZE = 250MB` (262,144,000 bytes) verificado antes de iniciar la transferencia.
  - Streaming directo sin carga en memoria RAM (`driveDownloadStream` $\rightarrow$ `vercelBlobStream`).
  - Formatos permitidos: Exclusivamente `video/mp4` y `video/webm`.
  - Etiquetado automático con Gemini: Extraer etiquetas semánticas del nombre y metadata (`cimentación`, `estructura`, `acabados`, `vista aérea`) usando delimitadores XML en los prompts para evitar inyecciones.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/video-tagger-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/gemini-video-tagger-adapter.ts`
  - `apps/web/src/features/ai-ingestion/application/services/video-ingestion-service.ts`
  - `apps/web/src/features/ai-ingestion/application/services/video-ingestion-service.test.ts`

---

## Proposal
- **Approach summary:** Implementar el caso de uso `VideoIngestionService` que valida los límites de tamaño en Google Drive, canaliza el flujo binario a Vercel Blob y utiliza Gemini para generar etiquetas de progreso descriptivas a partir del contexto del archivo.
- **Technical design:**
  1. **Pre-flight Size Check:**
     - Consultar `drive.files.get({ fields: 'size, mimeType' })`.
     - Si `size > 262144000`, rechazar con error de dominio `VIDEO_EXCEEDS_SIZE_LIMIT` y marcar `NEEDS_REVIEW`.
  2. **Direct Pipe to Blob Storage:**
     - Transferencia directa sin almacenamiento intermedio en disco ni memoria.
  3. **AI Metadata Tagging:**
     - Inferencia ligera basada en contexto de carpetas y títulos de avance.
- **Alternatives considered:**
  - *Transcodificación server-side con FFmpeg:* Descartada por exceder los límites de tiempo de ejecución (máx. 15s) de las lambdas de Vercel.
- **Tradeoffs:**
  - Exigir MP4/WebM nativo delega la compatibilidad al navegador del usuario sin requerir granjas de transcodificación costosas.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Serverless OOM on Video Buffering:* Resuelto con validación previa de tamaño y streaming directo.
  2. *Filename Prompt Injection:* Resuelto delimitando los metadatos en etiquetas XML `<file_context>`.
  3. *Uncontrolled Video Formats:* Resuelto con lista blanca estricta (MP4 y WebM).
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Pipeline de ingesta de video liviano, seguro contra desbordamientos de memoria y enriquecido con etiquetas de IA.
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
- **Next action:** Escribir tests unitarios en `video-ingestion-service.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Rechazo inmediato de video con tamaño de 300MB sin iniciar la descarga.
  2. Aceptación y streaming exitoso de video MP4 de 50MB.
  3. Sanitización de nombres con caracteres especiales antes del etiquetado con IA.
- **Integration tests:**
  - Ingesta de video sintético y registro en base de datos con etiquetas generadas.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-07`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
