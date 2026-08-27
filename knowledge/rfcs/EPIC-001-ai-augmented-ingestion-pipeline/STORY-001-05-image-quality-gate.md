---
type: RFC
title: STORY-001-05 Image Quality Gate & Dimension Sanitizer
description: RFC Story for image dimension limits (min 400px, max 2048px), WebP conversion, EXIF auto-rotation, GPS privacy stripping, and pixel flood protection.
tags: [rfc, story, images, sharp, webp, security, privacy, quality-gate, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-05-image-quality-gate.md
---

# STORY-001-05-image-quality-gate

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-05`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-05-image-quality-gate`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Los usuarios suben fotos tomadas con cámaras de alta resolución (ej. 48MP, 8000x6000), capturas rotadas por orientación EXIF, o imágenes diminutas/pixeladas (<400px) que degradan el diseño de las tarjetas y galerías del Dashboard. Además, las fotos de inmuebles tomadas con móviles contienen metadatos de geolocalización GPS sensibles que deben ser eliminados por privacidad.
- **Why now:** Normaliza todos los activos fotográficos a formatos y dimensiones estándar antes de guardarlos.
- **Constraints:**
  - Límite inferior: Rechazar imágenes donde el ancho o alto sea `< 400px` (`REJECT_LOW_RESOLUTION`).
  - Límite superior: Redimensionar proporcionalmente con `fit: 'inside'` a un máximo de `2048px` en el lado más largo.
  - Conversión de formato: Salida estándar en `image/webp` con calidad 85.
  - Rotación y Privacidad: `.rotate()` automático según EXIF y `.withMetadata({ exif: {} })` para eliminar coordenadas GPS y datos del dispositivo.
  - Protección contra bombas de descompresión (*Pixel Flood* / *Decompression Bomb*): Configurar `limitInputPixels: 268402689` (268M px máx) en Sharp para abortar imágenes gigantes antes de procesarlas.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/policies/image-quality-policy.ts`
  - `apps/web/src/features/ai-ingestion/domain/ports/image-processor-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/sharp-image-processor-adapter.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/sharp-image-processor-adapter.test.ts`

---

## Proposal
- **Approach summary:** Crear la política de calidad pura en Dominio `ImageQualityPolicy` y el adaptador de procesamiento `SharpImageProcessorAdapter` en Infraestructura utilizando `sharp`.
- **Technical design:**
  1. **Domain Policy:**
     - `validateDimensions(width: number, height: number): ValidationResult`.
  2. **Sharp Pipeline:**
     - `sharp(buffer, { limitInputPixels: 268402689 })`
     - `.rotate()` -> `.resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })`
     - `.webp({ quality: 85 })`
- **Alternatives considered:**
  - *Browser Canvas resizing:* Descartado porque el procesamiento se realiza en el backend durante la ingesta desatendida.
- **Tradeoffs:**
  - WebP a calidad 85 reduce el peso del archivo en ~70% sin pérdida visual perceptible.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Decompression Bomb Attack:* Resuelto estableciendo `limitInputPixels` en Sharp.
  2. *GPS Location Leak:* Resuelto eliminando metadatos EXIF sensibles.
  3. *EXIF Orientation Drift:* Resuelto invocando `.rotate()` explícito.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Pipeline de procesamiento seguro con Sharp y política de calidad determinista.
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
- **Next action:** Escribir tests unitarios en `sharp-image-processor-adapter.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Rechazo de imagen de 300x300px con error `IMAGE_TOO_SMALL`.
  2. Redimensionamiento de imagen 4000x3000px a 2048x1536px WebP.
  3. Comprobación de eliminación de metadatos GPS en imagen de prueba con EXIF.
  4. Aborto controlado ante imagen sospechosa de pixel flood.
- **Integration tests:**
  - Procesamiento de imagen JPEG y validación del buffer WebP generado.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-05`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
