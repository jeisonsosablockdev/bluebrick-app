---
type: Feature Spec
title: Harness System Enhancement, 4-Layer Architecture, Clean-Code & Double-Gatekeeper Protocol (BRI-181)
description: Creación de hooks.json, integración con task-init.sh, subagentes atómicos, 4 Capas Estándar, auditoría Clean Code y Protocolo de Doble Compuerta para el agente Arquitecto.
tags: [governance, agents, harness, layered-architecture, clean-code, double-gatekeeper, bri-181]
timestamp: 2026-07-21T22:35:25Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & Double-Gatekeeper Architecture (BRI-181)

## What problem exists
1. El sistema de harness carecía de enforcement declarativo (`hooks.json`) y subagentes atómicos por dominio (`api`, `db`, `state`).
2. Existían configuraciones obsoletas (`.cursor/`, `replit.nix`, `structure.yaml`).
3. Faltaba formalizar la **Arquitectura Estándar en 4 Capas** para dApps de Solana y Next.js App Router (Presentation, Application/Consumption, Domain/Pipelines, Infrastructure).
4. El agente Arquitecto solo auditaba el código al final del proceso. Faltaba un **Protocolo de Doble Compuerta (Double-Gatekeeper)** para validar el diseño de capas ANTES de escribir código y auditar el diff al FINAL.

## Why it matters
Prevenir el trabajo desperdiciado (*re-work*) requiere que `architect` valide y apruebe la estructura de carpetas e importaciones proyectadas ANTES de implementar (Compuerta 1) y vuelva a auditar el diff final antes del commit (Compuerta 2), garantizando cero violaciones a las 4 capas y cero presencia de sintaxis prohibida (`@solana/web3.js` v1).

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Formalización de la **Arquitectura Estándar en 4 Capas** en `architect.yaml` y `AGENTS.md`.
3. Creación de subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Creación de `.agents/hooks.json` e integración en `scripts/task-init.sh`.
5. Auditoría Clean Code y desacoplamiento dinámico en `task-init.sh`.
6. Implementación del **Protocolo de Doble Compuerta (Double-Gatekeeper Architect Protocol)** en `.agents/hooks.json` y `AGENTS.md`.

## What gaps exist today
- Faltaba formalizar la SPEC-6 para el Protocolo de Doble Compuerta de Architect.

## What questions remain open
- Ninguna. El flujo de Doble Compuerta de Architect fue formalizado.
