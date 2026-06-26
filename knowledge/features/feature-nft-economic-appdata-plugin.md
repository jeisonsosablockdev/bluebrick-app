# Feature: Economic AppData Plugin en NFTs Core (STORY-006-03)

## Resumen
- Se incorporó `AppData` como contenedor económico on-chain por NFT.
- El flujo de mint ahora prepara transacciones para:
  - adjuntar el adapter `AppData` (`ExternalPluginAdapterSchema.Json`)
  - escribir payload económico inicial `v1`
- Se validó en servidor el contrato `AppData v1` con controles de seguridad:
  - catálogo cerrado para `yield_mode` (`cap | linear`)
  - rango estricto de basis points (`0..10000`)
  - rechazo de claves no soportadas (sin propiedades extra)
  - campos de auditoría obligatorios (`last_updated_at`, `updated_by`)

## Alcance técnico
- `lib/core-candy-machine-admin.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `tests/lib/core-candy-machine-admin-validation.test.ts`
- `knowledge/architecture.md`
- `knowledge/authority-model.md`
- `knowledge/state-machine.md`
- `knowledge/threat-model.md`
- `knowledge/devnet-proof.md`
- `knowledge/nft-spec.md`

## Prueba en devnet
- Wallet administradora: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Collection: `2vPD7d2ojHbMTa4CubV5MwzhQKRNrc1DFbTpBBTBszHi`
- Asset: `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK`
- Transacciones:
  - `3UJFwJDhmU56FRhbxURZGkYN2Vc7QtxkDhnd6stKgJE2mudcepzQxHcvs7bYDMNegnTeN6dEkUobToHPBmPg3h9N` (`CreateCollectionV2`)
  - `39mG3FSESWfASb74cDdkYbX9LGxDQXKc9Eiy8vt3CNF2R1jFDjn9Z5wgmBWiFGmBQquyyDDAb1mfvT7uxs9sS4ek` (`CreateV2`)
  - `2FshFpvXW6543eNE5Vot9k4po4Cr8PTSUga66tCg517H1GFKaCHTfKHe6ZSfZxeJkpx8inuYEYMNr5DuFhD4tnY3` (`AddExternalPluginAdapter`)
  - `3pvRzuw6LvrrY61zpRGCHSjcbgfTd5MY2Tm5b84Q1Nw5wiyFTCr1iD9hiRgmNkJPktzxcdYk1UoujfYxpCXvuYFC` (write inicial)
  - `rrPY2Fp1hVHYojhLwhuzbCAid1796FzGaSbiw21PfBEAoTMZCTZJRPbnazBp45RhTtMPRRHqVhvPAri9oVbKdcX` (update)

## Estado final validado on-chain
```json
{
  "revenue_share_bps": 2500,
  "yield_bps": 1300,
  "yield_mode": "linear",
  "locked_at": 1775031177,
  "eligible_from": 1775031177,
  "earning_start_ts": 1775031177,
  "distribution_enabled": false,
  "economic_version": "v1",
  "last_updated_at": 1775031297,
  "updated_by": "story-006-03-admin-update"
}
```
