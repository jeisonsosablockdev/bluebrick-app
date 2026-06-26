---
type: Feature Spec
title: Feature Nft Permanent Transfer Delegate
description: Feature Nft Permanent Transfer Delegate - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-nft-permanent-transfer-delegate.md
---

# Feature: Permanent Transfer Delegate en deploy de collection Core

## Resumen
- Se agregó soporte explícito para configurar `permanentTransferDelegate` durante el flujo de deploy de collection Core.
- La configuración queda alineada con el modelo de autoridad ya usado para `permanentFreezeDelegate`.

## Alcance técnico
- `lib/core-candy-machine-admin.ts`
- `tests/lib/core-candy-machine-admin-validation.test.ts`
- `knowledge/nft-spec.md`

## Prueba en devnet
- Collection: `8rytxyRG4NsZ6b6Vz59Hskyp1PoM4MBqtvTLkdHbpRCF`
- Candy Machine: `AqQidPn1Da5HH6EzjFN2iFXw6aNFNG3oYyKnMjq5B8f5`
- Transacción: `i5JG91SZbgU9YBdJMpT3y5oDhWFPVaJhseg71bsDnGM81bXk9WVCGNwyafnbCX9tgpFdiQems4XLNZLipjyMgeJ`

## Trazabilidad
- Flow IDs:
  - `445c7226-0441-4dc8-8bfe-83ecf9bb8eb2`
  - `9d478ae0-c04e-4b0c-8ba4-2c33a7718509`
