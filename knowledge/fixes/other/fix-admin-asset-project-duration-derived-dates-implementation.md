---
type: Fix Spec
title: Fix Admin Asset Project Duration Derived Dates Implementation
description: Fix Admin Asset Project Duration Derived Dates Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/other/fix-admin-asset-project-duration-derived-dates-implementation.md
---

# Implementation: `/admin/assets/new` project duration from construction dates

## Español

## Plan

1. Extraer el calculo de duracion de proyecto a un helper testeable del modulo `components/admin/asset-creation`.
2. Cubrir el helper con tests unitarios para fechas validas, fechas faltantes y fechas invertidas.
3. Reordenar los campos de timeline para que inicio de construccion aparezca antes que entrega estimada.
4. Recalcular `buildingProjectDurationMonths` cuando cambie cualquiera de las dos fechas.
5. Ejecutar tests focalizados y `npm run validate`.

## Criterios de aceptacion

- `Fecha de inicio de construccion` aparece antes de `Fecha estimada de entrega`.
- `Duracion del proyecto` se actualiza desde las fechas seleccionadas.
- Fechas incompletas, invalidas o invertidas no generan una duracion positiva falsa.
- No se toca Solana Kit, deploy, mint, purchase, DB ni rutas API.

## Evidencia requerida

- `npx vitest run tests/lib/asset-creation-state.test.ts`
- `npm run validate`
- Revision clean-code del diff final.

## English

## Plan

1. Extract project-duration calculation into a testable helper under `components/admin/asset-creation`.
2. Cover the helper with unit tests for valid dates, missing dates, and reversed dates.
3. Reorder timeline fields so construction start appears before estimated delivery.
4. Recalculate `buildingProjectDurationMonths` whenever either date changes.
5. Run targeted tests and `npm run validate`.

## Acceptance Criteria

- `Construction start date` appears before `Estimated delivery date`.
- `Project duration` updates from the selected dates.
- Missing, invalid, or reversed dates do not generate a false positive duration.
- Solana Kit, deploy, mint, purchase, DB, and API routes are untouched.

## Required Evidence

- `npx vitest run tests/lib/asset-creation-state.test.ts`
- `npm run validate`
- Final clean-code review of the diff.
