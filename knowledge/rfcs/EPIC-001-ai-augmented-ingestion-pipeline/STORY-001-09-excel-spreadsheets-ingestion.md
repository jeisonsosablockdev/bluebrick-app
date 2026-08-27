---
type: RFC
title: STORY-001-09 Excel / CSV Spreadsheets Parser & Normalizer
description: RFC Story for streaming Excel/CSV parsing, CSV formula injection neutralization, encoding detection, and date serial number conversion.
tags: [rfc, story, excel, csv, formula-injection, security, encoding, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-09-excel-spreadsheets-ingestion.md
---

# STORY-001-09-excel-spreadsheets-ingestion

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-09`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-09-excel-spreadsheets-ingestion`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Las hojas de cálculo creadas por usuarios pueden incluir ataques de inyección de fórmulas CSV (`=cmd|...`), conflictos de codificación (Windows-1252 con tildes y eñes), números de serie de fecha de Excel (ej. 44561), o celdas con errores de fórmula (`#REF!`, `#DIV/0!`).
- **Why now:** Procesa de forma segura y estandarizada listados masivos de clientes y avances de obra.
- **Constraints:**
  - Neutralización obligatoria de inyecciones de fórmulas CSV (anteponiendo comilla simple `'` a celdas que inicien con `=`, `+`, `-`, `@`, `\t`, `\r`).
  - Límite de seguridad de filas: `MAX_ROWS = 5000` y `MAX_COLUMNS = 100` para prevenir saturación de memoria.
  - Conversión determinista de fechas seriales de Excel a formato ISO-8601 (`YYYY-MM-DD`).
  - Coerción segura de strings de error de fórmula (`#REF!`, `#N/A`) a `null`.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/spreadsheet-parser-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter.ts`
  - `apps/web/src/features/ai-ingestion/domain/utils/excel-date-converter.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter.test.ts`

---

## Proposal
- **Approach summary:** Implementar un adaptador de streaming para hojas de cálculo con saneamiento de fórmulas, soporte para codificaciones con tildes hispanas y mapeo inteligente de columnas a esquemas canónicos.
- **Technical design:**
  1. **Formula Injection Sanitizer:**
     - Función pura `sanitizeCellString(value: string): string`.
  2. **Excel Serial Date Converter:**
     - Función pura `excelSerialToIsoDate(serial: number): string` considerando el desfase del año bisiesto de 1900.
  3. **Streaming Row Parser:**
     - Procesar fila por fila limitando el consumo a `MAX_ROWS`.
- **Alternatives considered:**
  - *Cargar el libro completo como objeto JS en memoria:* Descartado para prevenir memory spikes en Serverless.
- **Tradeoffs:**
  - La lectura en stream mantiene el consumo de RAM constante (<25MB) independientemente del tamaño de la planilla.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *CSV / DDE Formula Injection:* Resuelto con desinfección preventiva con comilla simple.
  2. *Spanish Character Encoding (BOM / Windows-1252):* Resuelto con decodificador UTF-8 con fallback a Windows-1252.
  3. *Formula Errors (#REF!):* Resuelto mapeando errores a valores nulos.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Parser de streaming blindado contra inyecciones y conversor de tipos robusto.
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
- **Next action:** Escribir tests unitarios en `streaming-spreadsheet-adapter.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Desinfección de celdas con fórmulas ejecutables (`=1+1`, `@SUM`, `-2+3`).
  2. Decodificación correcta de caracteres en español (`á, é, í, ó, ú, ñ, Ñ`).
  3. Conversión de fecha serial `44561` a `2022-01-01`.
  4. Coerción de celdas `#REF!` y `#DIV/0!` a `null`.
  5. Límite de corte en `MAX_ROWS = 5000`.
- **Integration tests:**
  - Ingesta de archivo XLSX con múltiples hojas y generación de clientes validados.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-09`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
