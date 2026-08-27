---
type: RFC
title: STORY-001-04 Vercel Blob Storage Connector & Edge Delivery
description: RFC Story for uploading normalized media to Vercel Blob via streams, MIME/magic byte validation, collision-free deterministic paths, and edge delivery.
tags: [rfc, story, vercel-blob, cdn, media-storage, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-04-blob-storage-connector.md
---

# STORY-001-04-blob-storage-connector

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-04`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-04-blob-storage-connector`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Servir archivos directamente desde Google Drive es lento, consume cuotas de API de Google y expone URLs internas. Se necesita subir las imágenes normalizadas y documentos a Vercel Blob Storage para entrega rápida por CDN con URLs públicas inmutables.
- **Why now:** Almacena los activos visuales y archivos procesados en la capa de CDN del frontend.
- **Constraints:**
  - Cero buffering de archivos completos en RAM: Usar streams (`ReadableStream<Uint8Array>`) para no saturar los 1024MB de memoria de Vercel Serverless.
  - Validación de Magic Bytes en los primeros 512 bytes del stream para verificar el tipo MIME real y bloquear archivos SVG o HTML ejecutables (Stored XSS).
  - Nombres de archivo con entropía única: `projects/${projectId}/${driveFileId}-${randomUUID().slice(0,8)}.${ext}` para evitar colisiones accidentales y ataques de enumeración.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/blob-storage-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/vercel-blob-adapter.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/vercel-blob-adapter.test.ts`

---

## Proposal
- **Approach summary:** Implementar `IBlobStoragePort` y `VercelBlobAdapter` utilizando `@vercel/blob`, soportando subidas mediante streams con validación de tipo MIME por encabezado binario y control de acceso público (`access: 'public'`).
- **Technical design:**
  1. **Magic Byte Validator:**
     - Inspección de firmas binarias para JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WEBP (`52 49 46 46`), PDF (`25 50 44 46`), MP4 (`66 74 79 70`).
     - Rechazo automático de SVG (`<svg`) y HTML (`<!DOCTYPE`).
  2. **Stream Upload Pipeline:**
     - Passthrough directo de `fetch(driveDownloadUrl).body` a `put(path, stream, { access: 'public' })`.
  3. **Path Builder:**
     - Generación determinista y segura de la clave del Blob.
- **Alternatives considered:**
  - *AWS S3 / Cloudflare R2:* Se prefiere Vercel Blob por integración nativa con la plataforma Next.js y CDN global automática sin gestión de credenciales complejas de AWS.
- **Tradeoffs:**
  - Vercel Blob optimiza la latencia de borde y el renderizado en `next/image`.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Stored XSS via SVG/HTML:* Resuelto con validación de magic bytes y bloqueo de SVG/HTML.
  2. *Serverless Out-Of-Memory (OOM):* Resuelto usando streaming estricto sin buffers `Buffer.concat()`.
  3. *Blob Path Guessing / Collision:* Resuelto agregando UUID entropy a cada clave.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Adaptador de Blob Storage basado en streams, seguro contra XSS y con paths únicos.
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
- **Next action:** Escribir tests unitarios en `vercel-blob-adapter.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Detección y rechazo de archivo con extensión `.jpg` pero contenido `image/svg+xml`.
  2. Subida de stream y recepción de URL pública inmutable de Blob.
  3. Manejo de error cuando falta `BLOB_READ_WRITE_TOKEN`.
- **Integration tests:**
  - Subida de buffer y verificación de accesibilidad HTTP de la URL emitida.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-04`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
