---
type: Feature Spec
title: Harness System Enhancement, Subagent Enforcement & 4-Layer Standard Architecture (BRI-181)
description: Creación de hooks.json, integración con task-init.sh, adición de subagentes atómicos (api, db, state) y formalización de la Arquitectura Estándar en 4 Capas para Solana & Next.js.
tags: [governance, agents, harness, layered-architecture, bri-181]
timestamp: 2026-07-21T22:25:55Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & 4-Layer Standard Architecture (BRI-181)

## What problem exists
1. El sistema de harness de agentes carecía de un mecanismo declarativo (`hooks.json`) para obligar el uso de subagentes especializados durante las fases del ciclo de vida del desarrollo.
2. Existían configuraciones obsoletas (`.cursor/`, `replit.nix`, `structure.yaml`).
3. Faltaba la formalización explícita de la **Arquitectura Estándar en 4 Capas** para dApps de Solana y Next.js App Router (Presentation, Application/Consumption, Domain/Pipelines, Infrastructure/DB & RPC).

## Why it matters
Para prevenir el *drifting* cognitivo de los modelos de IA y asegurar la separación estricta de capas monorepo, es indispensable contar con la **Arquitectura Estándar en 4 Capas** que mapee 1:1 con nuestros subagentes atómicos (`frontend`, `state`, `solana`/`architect`, `db`/`api`) y prohíba patrones obsoletos (`@solana/web3.js` v1, `new Connection()`, sintaxis imperativa).

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Actualización del subagente `architect.yaml` (`web3-layered-architect-guardian`) para formalizar las **4 Capas Estándar**:
   - **Presentation Layer**: UI pura (`/app`, `/components`).
   - **Application / Consumption Layer**: Hooks reactivos y estado (`/lib/hooks`, `/lib/state`).
   - **Domain / Pipelines Layer**: Lógica de negocio y transacciones `@solana/kit` (`/lib/pipelines`).
   - **Infrastructure Layer**: RPC, indexadores, PostgreSQL y servicios externos (`/lib/db`, `/lib/api`, `/lib/solana/rpc`, `/db`).
3. Creación de subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Creación de `.agents/hooks.json` para orquestación del ciclo de vida y bindings por dominio.
5. Integración de `.agents/hooks.json` en `scripts/task-init.sh`.
6. Sincronización de políticas globales en `AGENTS.md`.

## What gaps exist today
- `architect.yaml` definía 3 capas agregadas; debe reflejar la **Arquitectura Estándar en 4 Capas** de Solana para dar ownership determinista a cada subagente.

## What questions remain open
- Ninguna. La formalización en 4 capas fue consensuada en la entrevista Socrática.
