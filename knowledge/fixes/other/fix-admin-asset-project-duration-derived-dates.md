---
type: Fix Spec
title: Fix Admin Asset Project Duration Derived Dates
description: Fix Admin Asset Project Duration Derived Dates - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-admin-asset-project-duration-derived-dates.md
---

# Fix: `/admin/assets/new` project duration from construction dates

## Español

## Problema

En `/admin/assets/new`, dentro de `Campos diferenciales por tipo` para activos `building_new`, el operador espera capturar primero la `Fecha de inicio de construccion` y despues la `Fecha estimada de entrega`.

La `Duracion del proyecto` debe derivarse de esas dos fechas para evitar inconsistencias manuales entre el timeline operativo y la duracion que luego se publica en marketplace.

## Resultado esperado

- El bloque muestra primero `Fecha de inicio de construccion`.
- El bloque muestra despues `Fecha estimada de entrega`.
- Al cambiar cualquiera de esas dos fechas, `Duracion del proyecto` se recalcula desde el par de fechas disponible.
- Si falta una fecha, la fecha es invalida o la entrega es anterior al inicio, la duracion derivada queda vacia y no se persiste un valor enganoso.
- El cambio no altera deploy, mint, uploads, wallet ni contratos on-chain.

## Alcance

- Superficie: `/admin/assets/new`.
- Componente: `components/admin/asset-creation-form.tsx`.
- Estado/helper: `components/admin/asset-creation`.
- Persistencia: sin cambios.
- Migraciones: no aplican.

## English

## Problem

In `/admin/assets/new`, inside `Differential fields by type` for `building_new` assets, the operator expects to enter `Construction start date` before `Estimated delivery date`.

`Project duration` must be derived from those two dates to prevent manual inconsistencies between the operational timeline and the duration later published to marketplace.

## Expected Outcome

- The block shows `Construction start date` first.
- The block shows `Estimated delivery date` second.
- Changing either date recalculates `Project duration` from the available date pair.
- If one date is missing, a date is invalid, or delivery is earlier than start, the derived duration remains empty and no misleading value is persisted.
- The change does not alter deploy, mint, uploads, wallet, or on-chain contracts.

## Scope

- Surface: `/admin/assets/new`.
- Component: `components/admin/asset-creation-form.tsx`.
- State/helper: `components/admin/asset-creation`.
- Persistence: no changes.
- Migrations: not applicable.
