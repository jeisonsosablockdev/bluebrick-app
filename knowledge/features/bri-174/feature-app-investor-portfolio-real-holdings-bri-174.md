---
type: Feature Spec
title: Feature App Investor Portfolio Real Holdings BRI- 174
description: Feature App Investor Portfolio Real Holdings BRI- 174 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-investor-portfolio-real-holdings-bri-174.md
---

# Feature BRI-174: Investor Portfolio With Real Collection-Level Holdings

## Espanol

### Problema

`/protected/portfolio` todavia renderiza informacion local hardcoded en `PORTFOLIO_DATA`. Esto produce una pantalla visualmente util, pero no autoritativa:

- Los NFT IDs son ficticios.
- La cantidad/fraccion no sale de la wallet autenticada.
- El porcentaje del proyecto no se calcula desde la oferta real.
- El purchase price y estimated yield no se conectan con datos reales de compra o marketplace.
- Si un usuario posee varios NFTs de la misma collection, la pantalla podria representar posiciones por NFT en vez de una posicion consolidada por proyecto.

### Objetivo

Reemplazar el portfolio placeholder por un read model server-side que muestre posiciones reales agrupadas por collection/proyecto para la wallet autenticada.

Cada posicion debe exponer:

- NFT IDs: lista de assets actualmente poseidos por la wallet dentro de esa collection.
- Quantity / Fraction: cantidad de NFTs poseidos y porcentaje del proyecto.
- Project ownership percentage: `ownedQuantity / supplyTotal`.
- Purchase price: precio de marketplace/listing por NFT multiplicado por cantidad poseida en v1, porque el form admin ya captura `nftPriceUsd`.
- Estimated yield: dato del marketplace/admin form, preferiblemente `economics.projectedNetRoiPct`; fallback `investment.annualRoiPct`.

### Fuente de verdad

1. Sesion protegida: decide si el usuario puede consultar `/protected/portfolio`.
2. Wallet autenticada server-side: decide que wallet se consulta. La UI no puede enviar wallet arbitraria.
3. Inventario server-side de BRIDS: `listStakeAssetsForWallet(walletPublicKey)` define los NFTs actualmente poseidos y elegibles.
4. Marketplace persistido: `readPersistedMarketplaceEntries()` aporta supply, precio unitario, yield estimado, imagenes, documentos, ubicacion y datos economicos capturados en el form admin.
5. Compras confirmadas: `listPurchaseAttempts({ walletPublicKey, status: "confirmed" })` puede aportar contexto de compra, pero v1 no convierte `preparedPriceLamports/quotedPriceLamports` a USD porque esos campos no expresan moneda fiat.

### Regla de agrupacion

El portfolio no renderiza una card por NFT.

El read model agrupa por `collectionAddress`:

- Una collection = una posicion de portfolio.
- `ownedQuantity` = cantidad de NFTs actuales de esa collection.
- `nftIds` = lista de asset addresses poseidos, limitada para UI pero conservando conteo total.
- `projectOwnershipPct` = `ownedQuantity / marketplace.investment.supplyTotal * 100`.

### Regla de precio de compra

El purchase price de la posicion se calcula en este orden:

1. Usar `marketplace.investment.nftPriceUsd * ownedQuantity`.
2. Marcar `priceSource = "marketplace_listing_usd"` para dejar claro que viene del form/listing.
3. No usar `preparedPriceLamports/quotedPriceLamports` como USD.
4. Si no hay dato de marketplace, se muestra estado explicito de no disponible.

La UI debe mostrar la fuente del precio para evitar presentar el precio de listing como dato historico pagado confirmado.

### Estados esperados

- `ready`: inventario y marketplace disponibles.
- `partial`: el inventario existe, pero faltan datos secundarios de marketplace o compras.
- `empty`: la wallet autenticada no posee NFTs BRIDS actuales.
- `wallet_required`: la cuenta esta autenticada pero no hay wallet autenticada.
- `error`: conflicto de sesion o error no recuperable.

### No objetivos

- No implementar claims o distribuciones.
- No cambiar BRI-5/BRI-170 stake/unstake.
- No cambiar mint/deploy ni Metaplex plugins.
- No agregar calculos financieros client-side.
- No usar mock fallback en produccion.
- No depender de compras historicas para inventario actual.

### Principios clean-code obligatorios

- Cada slice tiene una sola responsabilidad.
- Cada slice empieza con prueba RED antes de codigo productivo.
- El servicio de portfolio orquesta fuentes; no mezcla JSX, fetch HTTP ni formateo visual.
- La API solo resuelve auth y delega al servicio.
- La UI solo presenta el DTO y aplica filtros locales no autoritativos.
- Los helpers deben tener nombres de intencion clara y funciones pequenas.
- El cierre debe incluir auditoria clean-code explicita y registrar hallazgos o ausencia de bloqueantes.

### Preguntas cerradas

- Se agrupa por collection, no por NFT individual.
- El inventario actual es la fuente para saber que posee el usuario.
- Marketplace puede alimentar supply, precio, yield e informacion visual/documental.
- Compra confirmada puede enriquecer contexto futuro, pero v1 usa marketplace USD para no mezclar unidades.

## English

### Problem

`/protected/portfolio` still renders local hardcoded data from `PORTFOLIO_DATA`. The page is visually useful, but not authoritative:

- NFT IDs are fictitious.
- Quantity/fraction does not come from the authenticated wallet.
- Project ownership percentage is not calculated from real supply.
- Purchase price and estimated yield are not connected to purchase or marketplace data.
- If a user owns multiple NFTs from the same collection, the page may represent NFT-level positions instead of one consolidated project position.

### Objective

Replace the placeholder portfolio with a server-side read model that displays real positions grouped by collection/project for the authenticated wallet.

Each position must expose:

- NFT IDs: list of assets currently owned by the wallet in that collection.
- Quantity / Fraction: owned NFT count and project percentage.
- Project ownership percentage: `ownedQuantity / supplyTotal`.
- Purchase price: marketplace/listing price per NFT multiplied by owned quantity in v1, because the admin form already captures `nftPriceUsd`.
- Estimated yield: marketplace/admin form data, preferably `economics.projectedNetRoiPct`; fallback `investment.annualRoiPct`.

### Source Of Truth

1. Protected session decides whether the user can query `/protected/portfolio`.
2. Server-authenticated wallet decides which wallet is queried. The UI cannot send an arbitrary wallet.
3. Server-side BRIDS inventory: `listStakeAssetsForWallet(walletPublicKey)` defines currently owned eligible NFTs.
4. Persisted marketplace: `readPersistedMarketplaceEntries()` provides supply, unit price, estimated yield, images, documents, location, and economics captured in the admin form.
5. Confirmed purchases: `listPurchaseAttempts({ walletPublicKey, status: "confirmed" })` may provide purchase context, but v1 does not convert `preparedPriceLamports/quotedPriceLamports` into USD because those fields do not express fiat currency.

### Grouping Rule

The portfolio does not render one card per NFT.

The read model groups by `collectionAddress`:

- One collection = one portfolio position.
- `ownedQuantity` = current NFT count in that collection.
- `nftIds` = owned asset addresses, UI-limited while preserving total count.
- `projectOwnershipPct` = `ownedQuantity / marketplace.investment.supplyTotal * 100`.

### Purchase Price Rule

Position purchase price is resolved in this order:

1. Use `marketplace.investment.nftPriceUsd * ownedQuantity`.
2. Mark `priceSource = "marketplace_listing_usd"` so the source is explicit.
3. Do not use `preparedPriceLamports/quotedPriceLamports` as USD.
4. If marketplace data is unavailable, show an explicit unavailable state.

The UI must show the price source so listing price is not presented as confirmed paid history.

### Expected States

- `ready`: inventory and marketplace data are available.
- `partial`: inventory exists, but secondary marketplace or purchase data is missing.
- `empty`: authenticated wallet currently owns no BRIDS NFTs.
- `wallet_required`: account is authenticated but no wallet is authenticated.
- `error`: session conflict or unrecoverable error.

### Non-Goals

- No claim or distribution implementation.
- No BRI-5/BRI-170 stake/unstake changes.
- No mint/deploy or Metaplex plugin changes.
- No client-side financial authority calculations.
- No production mock fallback.
- No reliance on historical purchases as current ownership inventory.

### Mandatory Clean-Code Principles

- Each slice has a single responsibility.
- Each slice starts with a RED test before production code.
- The portfolio service orchestrates sources; it does not mix JSX, HTTP fetch, or visual formatting.
- The API only resolves auth and delegates to the service.
- The UI only presents the DTO and applies non-authoritative local filters.
- Helpers must use intention-revealing names and remain small.
- Closeout must include an explicit clean-code audit and record findings or absence of blockers.

### Closed Questions

- Group by collection, not by individual NFT.
- Current inventory is the source for what the user owns.
- Marketplace may feed supply, price, yield, and visual/document data.
- Confirmed purchase may enrich future context, but v1 uses marketplace USD to avoid mixing units.
