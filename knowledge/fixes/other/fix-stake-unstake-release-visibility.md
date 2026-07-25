---
type: Fix Spec
title: Fix Stake Unstake Release Visibility
description: Fix Stake Unstake Release Visibility - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/other/fix-stake-unstake-release-visibility.md
---

# Fix - Stake / Unstake release visibility

## Espanol

## Resumen

`/protected/stake` deja de ser un modulo `dev-only`.

Stake / Unstake forma parte del flujo activo de producto despues de comprar/mintear un NFT BRIDS desde marketplace. Por tanto, la ruta y su entrada de navegacion deben estar disponibles tambien en RC/release-like environments.

## Problema

El release gate `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES` ocultaba `/protected/stake` junto con otros modulos internos.

Eso bloqueaba la verificacion natural del flujo:

1. admin crea Candy Machine y marketplace entry;
2. usuario compra/mintea desde marketplace;
3. usuario entra a Stake / Unstake con la wallet owner;
4. sistema lista NFTs BRIDS elegibles y permite freeze/unfreeze solo si pasan validacion on-chain.

## Decision

- `/protected/stake` queda visible en release-like environments.
- `Stake / Unstake` queda visible en la navegacion protegida.
- Portfolio, Rentas, Historial y rutas admin internas siguen controladas por `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES`.
- La visibilidad no cambia seguridad: la ruta sigue requiriendo sesion wallet y los assets siguen verificando owner, collection y `FreezeDelegate Owner`.

## Riesgo

El riesgo principal es exponer una superficie sensible antes de completar pruebas devnet finales.

Mitigacion:

- la ruta no lista assets sin wallet autenticada;
- `/api/protected/stake/assets` filtra por wallet owner;
- prepare/submit validan sesion, ownership y estado on-chain;
- los NFTs sin `FreezeDelegate Owner` siguen apareciendo como no soportados o son rechazados.

## English

## Summary

`/protected/stake` is no longer a `dev-only` module.

Stake / Unstake is part of the active product flow after buying/minting a BRIDS NFT from marketplace. Therefore, the route and its navigation entry must also be available in RC/release-like environments.

## Problem

The `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES` release gate hid `/protected/stake` together with internal modules.

That blocked the natural verification flow:

1. admin creates the Candy Machine and marketplace entry;
2. user buys/mints from marketplace;
3. user enters Stake / Unstake with the owner wallet;
4. system lists eligible BRIDS NFTs and enables freeze/unfreeze only after on-chain validation.

## Decision

- `/protected/stake` is visible in release-like environments.
- `Stake / Unstake` is visible in protected navigation.
- Portfolio, Yield, History, and internal admin routes remain controlled by `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES`.
- Visibility does not change security: the route still requires a wallet session, and assets still verify owner, collection, and `FreezeDelegate Owner`.

## Risk

The main risk is exposing a sensitive surface before final devnet proof is attached.

Mitigation:

- the route does not list assets without an authenticated wallet;
- `/api/protected/stake/assets` filters by owner wallet;
- prepare/submit validate session, ownership, and on-chain state;
- NFTs without `FreezeDelegate Owner` still appear as unsupported or are rejected.
