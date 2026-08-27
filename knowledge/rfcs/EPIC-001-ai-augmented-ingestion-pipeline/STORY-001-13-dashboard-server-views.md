---
type: RFC
title: STORY-001-13 Dashboard Server Components & Responsive Media Galleries
description: RFC Story for Next.js 16 Server Components data fetching, DTO sanitization to prevent DOM data leaks, and next/image media galleries with zero CLS.
tags: [rfc, story, nextjs, server-components, rsc, next-image, galleries, ui, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-13-dashboard-server-views.md
---

# STORY-001-13-dashboard-server-views

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-13`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-13-dashboard-server-views`
- Created: `2026-08-25`
- Last Updated: `2026-08-25`

---

## Context
- **Problem:** Los Server Components que renderizan datos de clientes y proyectos no deben serializar información sensible de auditoría (OCR crudo, PII interna o tokens) en el payload HTML (`__next_f`). Además, la carga de fotos en galerías no debe generar saltos de diseño (Cumulative Layout Shift, CLS = 0).
- **Why now:** Conecta el almacenamiento permanente con la interfaz de usuario corporativa de alta fidelidad.
- **Constraints:**
  - Next.js 16 App Router con Server Components puros en `apps/web/src/app/dashboard/...`.
  - Mapeo estricto de entidades de base de datos a DTOs públicos antes de renderizar componentes o pasar props.
  - Contenedores de relación de aspecto fijos en CSS (`aspect-video`, `aspect-square`, `aspect-[4/3]`) con placeholders animados para garantizar CLS = 0.
  - Whitelist de `remotePatterns` en `next.config.mjs` para subdominios de Vercel Blob.
- **Affected paths:**
  - `apps/web/src/app/dashboard/clients/page.tsx`
  - `apps/web/src/app/dashboard/projects/[slug]/page.tsx`
  - `apps/web/src/components/media/project-media-gallery.tsx`
  - `apps/web/src/features/ai-ingestion/application/queries/get-dashboard-data-query.ts`
  - `next.config.mjs`

---

## Proposal
- **Approach summary:** Construir vistas de servidor optimizadas que consumen casos de uso de la capa de Aplicación, proyectan DTOs higienizados y renderizan galerías responsivas con `next/image` y componentes accesibles.
- **Technical design:**
  1. **DTO Sanitization Layer:**
     - `toClientCardDto(client: ClientEntity): ClientCardDto` (filtra metadatos sensibles de auditoría).
  2. **Zero-CLS Media Gallery:**
     - Contenedor con aspect ratio CSS explícito y skeleton loader shimmer.
     - Atributos `sizes` adaptativos y formato WebP automático vía `next/image`.
- **Alternatives considered:**
  - *Pasar la entidad de BD completa al cliente:* Descartado por fuga de PII e hinchazón del HTML estático.
- **Tradeoffs:**
  - Los DTOs reducen el tamaño del payload transferido al cliente en más de un 60%.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *RSC Serialization Data Leak:* Resuelto con proyecciones DTO explícitas.
  2. *Layout Shift (CLS):* Resuelto con contenedores de aspect ratio CSS fijos.
  3. *Unconfigured Next/Image Panic:* Resuelto configurando `remotePatterns` en `next.config.mjs`.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Vistas de servidor limpias, protegidas con DTOs y con renderizado de cero CLS.
- **Changes accepted:** Todas las recomendaciones integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado para implementación de UI y Server Components.

---

## Status
- **Current status:** `approved`
- **Next action:** Escribir tests de renderizado y consultas de servidor.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Mapeo correcto de entidades a DTOs despojando campos sensibles.
  2. Renderizado accesible de `ProjectMediaGallery` con `alt` descriptivo.
- **Integration tests:**
  - Carga de Server Component y validación del HTML emitido.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** Pruebas en Desktop (1440px), Tablet (768px) y Mobile (375px) sin CLS.

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-13`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
