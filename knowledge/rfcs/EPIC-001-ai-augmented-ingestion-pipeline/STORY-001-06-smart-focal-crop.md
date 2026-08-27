---
type: RFC
title: STORY-001-06 AI-Assisted Smart Focal Point Detection & Cropping
description: RFC Story for detecting visual focal coordinates using Gemini Vision, computing bounding boxes for 16:9, 4:3, 1:1 aspect ratios, and fallback to center crop.
tags: [rfc, story, smart-crop, gemini-vision, focal-point, geometry, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-06-smart-focal-crop.md
---

# STORY-001-06-smart-focal-crop

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-06`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-06-smart-focal-crop`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Los recortes ciegos centrados (`object-position: center`) pueden cortar fachadas de edificios, piscinas o elementos clave en fotos panorámicas o verticales. Se necesita inferir el punto focal de interés mediante IA (Gemini Vision) para calcular recortes óptimos en relaciones de aspecto 16:9, 4:3 y 1:1.
- **Why now:** Garantiza una armonía visual uniforme en las tarjetas y cabeceras del Dashboard.
- **Constraints:**
  - Optimización de costo y tokens: Enviar a Gemini Vision un thumbnail reducido a `256x256` en lugar de la imagen original de alta resolución.
  - Clampeo estricto de coordenadas en Dominio: $0.0 \le x \le 1.0$ y $0.0 \le y \le 1.0$.
  - Fallback determinista: Si Gemini no responde en $\le 3000\text{ms}$ o reporta coordenadas fuera de rango, usar punto central `(0.5, 0.5)` con bandera de fallback.
  - La función matemática de recorte en Dominio no debe tener dependencias externas (`Math.min`, `Math.max` puros).
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/math/smart-crop-calculator.ts`
  - `apps/web/src/features/ai-ingestion/domain/ports/focal-point-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/gemini-focal-point-adapter.ts`
  - `apps/web/src/features/ai-ingestion/domain/math/smart-crop-calculator.test.ts`

---

## Proposal
- **Approach summary:** Implementar la calculadora matemática de recortes en Dominio `SmartCropCalculator` y el adaptador de inferencia de punto focal `GeminiFocalPointAdapter` en Infraestructura.
- **Technical design:**
  1. **Crop Math Formulation:**
     - Dado un punto focal normalizado $(f_x, f_y)$ y un ratio objetivo $R = W_{target} / H_{target}$, calcular el rectángulo de recorte $(x, y, w, h)$ que maximice el área visible conteniendo $(f_x, f_y)$ dentro de los límites de la imagen original.
  2. **Gemini Vision Structured Prompt:**
     - Prompt con esquema JSON `{ focalX: number, focalY: number, description: string }`.
  3. **Robust Fallback:**
     - Timeout con `AbortController(3000)` y rescate inmediato con `(0.5, 0.5)`.
- **Alternatives considered:**
  - *Algoritmos tradicionales basados en detección de bordes (Sobel):* Descartados por fallar con arquitectura moderna y sombras complejas; la inferencia multimodal de Gemini identifica fachadas y áreas de interés con mucha mayor precisión semántica.
- **Tradeoffs:**
  - El thumbnail de 256px reduce el tiempo de inferencia de Gemini a <500ms y minimiza el consumo de tokens.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Visual Prompt Injection / Out-of-bounds Coordinates:* Resuelto con clampeo matemático estricto en Dominio.
  2. *Latency & Cost Spike on 4K Images:* Resuelto con generación previa de thumbnail 256x256.
  3. *AI Timeout Hanging the Pipeline:* Resuelto con timeout de 3s y fallback central.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Calculadora matemática de encuadre en Dominio con asistencia de Gemini Vision y fallback resiliente.
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
- **Next action:** Escribir tests unitarios en `smart-crop-calculator.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Cálculo de recorte 16:9 con punto focal en borde superior derecho `(0.9, 0.1)` sin salirse de los límites de la imagen.
  2. Clampeo de coordenadas anormales emitidas por IA (`1.5, -0.2` $\rightarrow$ `1.0, 0.0`).
  3. Fallback a `(0.5, 0.5)` cuando se produce un error o timeout en la llamada.
- **Integration tests:**
  - Envío de thumbnail sintético y verificación de coordenadas JSON devueltas.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-06`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
