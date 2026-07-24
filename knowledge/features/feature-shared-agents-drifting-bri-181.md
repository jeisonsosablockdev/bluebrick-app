---
type: Feature Spec
title: Feature Shared Agents Drifting BRI- 181
description: Feature Shared Agents Drifting BRI- 181 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-agents-drifting-bri-181.md
---

# Problem Artifact: Solución problemas de drifting y orquestación en agentes (BRI-181)

## What problem exists
El proyecto posee dos directorios para gobernar el comportamiento de los agentes: `.codex/` y `.agents/`. Las definiciones de los subagentes especialistas (`solana`, `frontend`, `nft`, `reviewer`, `security`, `docs`, `qa`, `reasoning`, `planner`) residen exclusivamente bajo `.codex/agents/*.toml` usando un formato propietario de Codex que requiere modelos no soportados directamente (Qwen/GPT-5.5) y que no está estructurado para las herramientas del SDK de Google Antigravity. Esto genera drifting en las políticas y expone al sistema a incoherencias en la ejecución.

## Why it matters
Para consolidar un entorno estable y evitar confusión de reglas en los modelos Gemini y del SDK de Antigravity, es mandatorio tener un único directorio de verdad para los agentes. Mantener `.codex/` genera una doble configuración y permite la obsolescencia de las políticas si no se mantienen sincronizadas en ambos lados.

## What outcome is expected
La migración de todas las configuraciones útiles y definiciones de subagentes especialistas a `.agents/agents/*.yaml`, configurando el modelo de forma dinámica (`inherit`) para heredar automáticamente el LLM activo en el runner/sesión y soportando la estructura de metadatos universal. Asimismo, la eliminación definitiva de la carpeta heredada `.codex/` y la actualización de referencias globales en `AGENTS.md` y `GEMINI.md`.

## What gaps exist today
- Los subagentes especialistas solo existen como TOMLs dentro de `.codex/agents/`.
- `AGENTS.md` y otros archivos hacen referencia a políticas y flujos dentro de `.codex/`.
- No hay un directorio `.agents/agents/` en el proyecto para referenciar identidades de especialistas optimizados para Gemini.

## What questions remain open
- Ninguna. Se definió el uso de YAML (`.yaml`) como el formato estándar por ser interoperable con cualquier runner y altamente legible para modelos Gemini.
