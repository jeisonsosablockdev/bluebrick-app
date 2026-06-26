# STORY-002-07-usdc-token-payment-and-temporary-recipient

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-07-usdc-token-payment-and-temporary-recipient`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-27`
- Last Updated: `2026-03-27`

## Context
- Problem:
  El flujo actual de Core Candy Machine usa `solPayment`, lo que expone el pricing a volatilidad SOL cuando el objetivo de negocio es recaudo en USD.
- Why now:
  El equipo quiere definir el precio inicial del NFT desde el formulario de admin, con base en `Meta de fondeo` y `Costo por NFT`, y cobrar directamente en USDC desde Candy Guards.
- Constraints:
  - Mantener flujo actual de deploy/mint/purchase en devnet.
  - Mantener guardas de seguridad existentes (`startDate`, `thirdPartySigner`).
  - Permitir fase puente con receptor temporal hardcoded y migración posterior a Treasury formal.
  - No romper la trazabilidad y los contratos API ya consumidos por UI.
- Affected paths:
  - `/components/admin/asset-creation-form.tsx`
  - `/components/admin/core-candy-machine-panel.tsx`
  - `/app/api/admin/core-candy-machine/deploy/prepare/route.ts`
  - `/lib/core-candy-machine-admin.ts`
  - `/lib/purchase-service.ts`
  - `/tests/api/admin-core-candy-machine-deploy-prepare-route.test.ts`
  - `/tests/lib/core-candy-machine-admin-validation.test.ts`
  - `/docs/nft-spec.md`
  - `/docs/authority-model.md`
  - `/docs/devnet-proof.md`

## Proposal
- Approach summary:
  Migrar guard de precio de `solPayment` a `tokenPayment` (USDC), manteniendo `startDate + thirdPartySigner`, y usar una fase puente con receptor temporal hardcoded:
  `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`.
- Technical design:
  1. Formulario define precio de NFT en USD/USDC y preserva lógica de `Meta de fondeo` + `Total unidades`.
  2. Backend convierte precio unitario a unidades atómicas de USDC (6 decimales): `amountUsdcAtomic`.
  3. Deploy Core Candy Machine configura:
     - `tokenPayment.mint = USDC_MINT_<ENV>`
     - `tokenPayment.destinationAta = ATA(receptorTemporal, USDC_MINT_<ENV>)`
     - `tokenPayment.amount = amountUsdcAtomic`
  4. Purchase flow deja de leer/escribir `solPayment` y usa `tokenPayment`.
  5. Se documenta deuda técnica para migrar receptor temporal a Treasury por ambiente (`TREASURY_USDC_OWNER`).
  6. Se registran snapshot de pricing y metadatos de guard usado en deploy.
- Alternatives considered:
  - Mantener `solPayment` y convertir USD->SOL en runtime.
  - Cobrar en SOL y hacer swap posterior a USDC.
  - Mantener dual mode (SOL/USDC) en una sola release.
- Tradeoffs:
  - Pros:
    - El pricing on-chain queda alineado con objetivo en dólares.
    - Se elimina volatilidad de SOL en cobro unitario.
    - El diseño queda compatible con futura Treasury.
  - Cons:
    - Requiere manejo de mint USDC por entorno y ATA destino.
    - Introduce deuda técnica temporal por receptor hardcoded.

## Critique
- Reviewer(s):
  - `Product/Engineering review (internal)`
- Critical findings:
1. Definir política de redondeo explícita para `amountUsdcAtomic`.
2. Definir estrategia de ATA destino (asumir existente vs crear en flujo).
3. Evitar residuos de lógica SOL (`DEVNET_MINT_PRICE_LAMPORTS`) en ruta USDC.
- Blocking concerns:
  - Story no puede pasar a implementación hasta definir política final de redondeo y manejo de ATA.

## Resolution
- Final approach after critique:
  Se adopta `tokenPayment` USDC como guard canónico de pricing y se conserva `startDate + thirdPartySigner`.
- Changes accepted:
  - Receptor temporal hardcoded en fase puente.
  - Documentación explícita de migración a Treasury.
  - Contrato de precio en unidades atómicas USDC como valor on-chain final.
  - Política de redondeo adoptada:
    - `unitAtomic = round(usdUnitPrice * 1_000_000)` para input directo.
    - `unitAtomic = ceil(totalAtomic / quantity)` cuando se deriva desde meta de fondeo.
  - Estrategia ATA adoptada:
    - Resolver ATA destino en backend y validar su existencia en deploy/purchase.
    - Si ATA no existe, retornar error explícito de configuración temporal para evitar cobros a cuenta inválida.
- Changes rejected (with rationale):
  - Mantener `solPayment` como default de negocio: rechazado por volatilidad.
  - Branch separado por cada commit del cambio: rechazado por alto acoplamiento funcional.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-27`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado para implementación en rama `nft/program-cm-guard-configurable-price` con estrategia de 3 commits atómicos.

## Status
- Current status: `approved`
- Next action:
  Implementar migración `solPayment -> tokenPayment(USDC)` en backend, purchase flow y formulario admin.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validación de conversión USD->USDC atomic (6 decimales).
  - Validaciones de input (`price <= 0`, overflow, formato inválido).
  - Validación de construcción de guard `tokenPayment`.
- Integration tests:
  - Deploy prepare retorna payload con `tokenPayment` configurado.
  - Purchase quote/prepare usa `tokenPayment` como source of truth.
- Devnet validation (if applicable):
  - Transacción real de deploy con `tokenPayment`.
  - Verificación on-chain de guard y ATA destino.
  - Prueba de compra real con débito en USDC.
- Responsive QA (if applicable):
  - UI pricing block estable en 320/375/768/1024.

## Traceability
- Related issue(s):
  - `TBD`
- Related PR(s):
  - `TBD`
- Final commit hash(es):
  - `TBD`
