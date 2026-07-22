---
type: Feature Spec
title: Harness System Enhancement, Subagent Enforcement, 4-Layer Architecture & Clean-Code Decoupling (BRI-181)
description: Creación de hooks.json, integración con task-init.sh, adición de subagentes atómicos, formalización de la Arquitectura Estándar en 4 Capas y auditoría de desacoplamiento Clean Code.
tags: [governance, agents, harness, layered-architecture, clean-code, bri-181]
timestamp: 2026-07-21T22:27:55Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & 4-Layer Clean-Code Architecture (BRI-181)

## What problem exists
1. El sistema de harness carecía de enforcement declarativo (`hooks.json`) y subagentes atómicos por dominio (`api`, `db`, `state`).
2. Existían configuraciones obsoletas (`.cursor/`, `replit.nix`, `structure.yaml`).
3. Faltaba formalizar la **Arquitectura Estándar en 4 Capas** para dApps de Solana y Next.js App Router (Presentation, Application/Consumption, Domain/Pipelines, Infrastructure).
4. Riesgo de acoplamiento de responsabilidades entre agentes tras incorporar las nuevas definiciones y hooks.

## Why it matters
Para mantener un monorepo limpio y altamente mantenible para agentes de IA, debemos prevenir el acoplamiento directo entre roles de agentes y asegurar que cada especialista mantenga una responsabilidad única (Single Responsibility Principle) con fronteras desacopladas sin interferencias ni duplicación.

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Actualización de `architect.yaml` para formalizar las **4 Capas Estándar** de Solana & Next.js App Router.
3. Creación de subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Creación de `.agents/hooks.json` para orquestación del ciclo de vida y bindings por dominio.
5. Integración de `.agents/hooks.json` en `scripts/task-init.sh`.
6. Sincronización de políticas globales en `AGENTS.md`.
7. Auditoría y refactorización Clean Code (`code-refactoring-refactor-clean`) para evitar acoplamiento entre subagentes y garantizar responsabilidades aisladas.

## What gaps exist today
- Faltaba la SPEC-5 dedicada a la auditoría de desacoplamiento Clean Code para garantizar que los nuevos subagentes no introduzcan acoplamiento ni superposición de paths.

## What questions remain open
- Ninguna. La inclusión de SPEC-5 Clean Code desacoplada fue formalizada.
