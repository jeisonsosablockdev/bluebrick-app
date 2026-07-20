---
type: Guide
title: Ai Readable Endpoints Contracts
description: Ai Readable Endpoints Contracts - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/ai-readable-endpoints-contracts.md
---

# AI-readable Endpoints Contracts

## Objetivo
Definir el contrato tecnico estable para consumo por agentes y LLM systems.

## Endpoints y archivos
- `GET /api/knowledge`
- `GET /api/entities`
- `GET /api/definitions`
- `GET /knowledge.json`
- `GET /llms.txt`
- `GET /ai.txt` (opcional por `ENABLE_AI_TXT=true`)

## Reglas de publicacion
- Politica estricta `published-only`.
- Solo se exponen campos publicos y sanitizados.
- Se excluyen campos internos (`body`, `sourcePath`, estructuras privadas).

## Contrato base (JSON)
Todos los payloads JSON usan:
- `schemaVersion` (string versionado, actual `1.0.0`)
- `generatedAt` (ISO timestamp)
- `items` (array de objetos tipados por endpoint)

## Contrato `/api/knowledge` y `/knowledge.json`
Cada item incluye:
- `id`
- `slug`
- `title`
- `summary`
- `layer`
- `type`
- `canonicalPath`
- `updatedAt`
- `tags[]`

## Contrato `/api/definitions`
Cada item incluye:
- `id`
- `slug`
- `term`
- `summary`
- `canonicalPath`
- `updatedAt`
- `layer`
- `tags[]`

## Contrato `/api/entities`
Cada item incluye:
- `id`
- `slug`
- `name`
- `summary`
- `sourceType` (`tag` | `glossary-term`)
- `relatedDocumentSlugs[]`

## `llms.txt`
Documento de descubrimiento con referencias canonicas a endpoints publicos.

## `ai.txt`
- Controlado por feature flag `ENABLE_AI_TXT`.
- Si esta deshabilitado, responde `404 Not Found`.

## Validacion
- Unit/contract tests: `tests/lib/ai-readable-contracts.test.ts`
- Endpoint tests: `tests/api/ai-readable-endpoints.test.ts`
- Gate CI: `npm run validate:ai`
