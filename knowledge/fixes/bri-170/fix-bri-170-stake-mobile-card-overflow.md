---
type: Fix Spec
title: Fix BRI- 170 Stake Mobile Card Overflow
description: Fix BRI- 170 Stake Mobile Card Overflow - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-bri-170-stake-mobile-card-overflow.md
---

# fix: BRI-170 Stake mobile card overflow

## Espanol

## Contexto

La validacion de UI mobile falla en `/protected/stake`: los cards de Stake / Unstake se salen horizontalmente de la pantalla.

## Diagnostico

El card renderiza datos con strings largos y no confiables para layout, especialmente `assetAddress`. En mobile, el header del card usa una fila flex con:

- contenedor de texto sin `min-w-0`
- direccion base58 larga sin wrapping fuerte
- badge de estado en la misma fila

Esto permite que el contenido fuerce el ancho minimo del card y genere overflow horizontal.

## Alcance

S01 - Artefacto

- Documentar el problema responsive y el criterio de aceptacion.

S02 - UI responsive

- Hacer que el card pueda encogerse en mobile.
- Envolver direcciones y nombres largos sin romper desktop.
- Mantener el badge visible sin forzar overflow.
- Aplicar el mismo wrapping en el modal de confirmacion.
- Asegurar que el wrapper protegido y el modulo Stake no escondan overflow estructural del card.

S03 - Pruebas y cierre

- Tests de componente para verificar las clases anti-overflow en address/header.
- Playwright responsive en `/protected/stake` con anchos 320, 375, 640, 700, 768 y 1024.
- Verificar por bounding box que cada card y boton queda dentro del viewport, no solo `scrollWidth`.
- `npm run validate`.

## Fuera de alcance

- Cambios de estado Stake / Unstake.
- Cambios de API.
- Cambios on-chain.
- Cambios de schema o migraciones.

## English

## Context

Mobile UI validation fails on `/protected/stake`: Stake / Unstake cards overflow horizontally outside the viewport.

## Diagnosis

The card renders long layout-untrusted strings, especially `assetAddress`. On mobile, the card header uses a flex row with:

- text container without `min-w-0`
- long base58 address without strong wrapping
- state badge in the same row

This lets content force the card minimum width and creates horizontal overflow.

## Scope

S01 - Artifact

- Document the responsive issue and acceptance criteria.

S02 - Responsive UI

- Let the card shrink on mobile.
- Wrap long addresses and names without breaking desktop.
- Keep the status badge visible without forcing overflow.
- Apply the same wrapping in the confirmation modal.
- Ensure the protected wrapper and Stake module do not hide structural card overflow.

S03 - Tests and closeout

- Component tests for anti-overflow classes on address/header.
- Playwright responsive coverage on `/protected/stake` at 320, 375, 640, 700, 768, and 1024 widths.
- Verify by bounding box that each card and button stays inside the viewport, not only `scrollWidth`.
- `npm run validate`.

## Out of Scope

- Stake / Unstake state changes.
- API changes.
- On-chain changes.
- Schema changes or migrations.
