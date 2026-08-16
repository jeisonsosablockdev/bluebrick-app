# Problem Spec: squads-v4-treasury-claims (BRI-8)

## What problem exists
Actualmente, el sistema de dispersión y reclamaciones de tesorería (`BRI-8` / `STORY-014-04`) simula las firmas e interacciones con el programa Squads v4 en Solana Devnet (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`), sin ejecutar transacciones reales on-chain. Además, si se requiere procesar miles de transferencias (ej. 20,000 en un proyecto inmobiliario fraccionado), la aproximación tradicional de firmar sublotes de 20 transferencias obligaría al comité a aprobar 1,000 transacciones individualmente en su wallet, lo cual es inmanejable operacionalmente.

Adicionalmente, existen 3 brechas críticas de gobernanza, seguridad y arquitectura:
1. **Ausencia de Verificación Criptográfica On-Chain**: No existe un contrato de liquidación que impida a un worker desatendido modificar destinatarios o montos; una simple lista de transferencias no verifica una prueba criptográfica (Merkle Proof) contra una raíz sellada on-chain.
2. **Payout Overrides sin Cola de Aprobación**: Solicitudes de cambio de wallet de pago se aplicaban sin pasar por revisión de cumplimiento del comité con `case_number`.
3. **Monitores de Ciclo de Vida y Cancelación**: Ausencia de triggers de cron para expiración de cotizaciones (48h) y retenciones de compliance (12 meses), además de la falta de una ruta para que el usuario cancele sus solicitudes en estado `CLAIM_REQUESTED`.
4. **Desalineación con la Arquitectura FDD Monorepo (PR #327)**: La base de código previa utilizaba symlinks en root y rutas monolíticas, requiriendo su reorganización estricta en el nuevo estándar Monorepo 4-Layer Feature-Driven Design (`apps/web/src/features/staking-distribution`, `apps/web/src/features/admin`, `packages/solana-client`, `programs/`).

## Why it matters
1. **Seguridad Cero-Confianza (Zero-Trust Security)**: Todas las operaciones de tesorería deben ser transacciones reales verificables en Solana Devnet. Ningún agente off-chain recibe autoridad de Vault ni puede alterar un payout tras el voto del comité.
2. **Escalabilidad Operacional Criptográfica**: El comité multisig debe aprobar la dispersión global de una corrida (`runId`) con **1 sola firma de setup** que crea, fondea y sella un `PayoutRun` en el programa on-chain `payout_settlement`. Cualquier cranker no privilegiado liquida claims individuales presentando su Merkle Proof, registrando un `ClaimReceipt` inmutable que previene el doble pago.
3. **Gobernanza y Trazabilidad**: El cambio de wallet de pago exige obligatoriamente un `case_number` en estado `PENDING` aprobado en `/admin/compliance`.
4. **Alineación Monorepo FDD**: El diseño debe adherirse rigurosamente a las 4 capas limpias (Presentation, Application, Domain, Infrastructure) y a la separación entre Next.js Web App Router (`apps/web`) y los contratos Solana Anchor (`programs/`).

## What outcome is expected
1. Integración formal del SDK `@sqds/multisig` y del programa Anchor `payout_settlement` en Solana Devnet.
2. Adopción del **Modelo Payout Settlement con Escrow PDA & Merkle Proof Enforcement On-Chain** (reemplaza definitivamente el modelo obsoleto de spending limits o sublotes desprotegidos).
3. Consola de administración nativa en `apps/web/src/features/admin/presentation/treasury-console.tsx` y `/admin/treasury/squads` conectada con `/admin/distributions` para monitoreo en vivo de propuestas y liquidaciones.
4. Cierre completo de las brechas de gobernanza: tabla `distribution_payout_overrides` con `case_number`, endpoints de cron `/api/cron/*` y endpoint de cancelación `/api/claims/[claimId]/cancel`.
5. Programa Anchor `project_config_notary` para la PDA Notario On-Chain que resguarda las fechas inmutables del proyecto, consumido directamente vía RPC por `distribution-engine.ts`.

## What gaps exist today
- `programs/payout_settlement` y `programs/project_config_notary` deben ser estructurados e implementados en `programs/`.
- `@sqds/multisig` debe integrarse a través de adaptadores aislados en `@/features/staking-distribution/infrastructure/` y `lib/solana-kit/compat/squads.ts`.
- `submitPayoutOverride` debe exigir `case_number` y persistir en estado `PENDING`.
- Las rutas API y cronjobs deben residir en `apps/web/src/app/api/` importando lógica únicamente desde los Feature Slices FDD (`@/features/*`).

## Why Anchor Contracts are Included in Scope
1. **Limitaciones Físicas de Solana (MTU ~1232 bytes)**: Cada instrucción de transferencia SPL Token consume ~150-200 bytes, limitando una transacción a ~20 transferencias. Para dispersar rendimientos a 10,000 holders, el comité multisig tendría que firmar ~500 transacciones manuales.
2. **Inseguridad de Spending Limits**: Los límites de gasto de Squads entregan fondos discrecionales a una wallet de worker off-chain, permitiendo que una clave comprometida desvíe la totalidad del límite a wallets atacantes sin control de snapshot.
3. **Solución Óptima Zero-Trust (`programs/payout_settlement`)**: El comité aprueba una única propuesta en Squads que fondea un Escrow PDA y sella la `merkleRoot`. Los pagos son liquidados de forma permissionless con Merkle Proofs y generan un `ClaimReceipt` PDA que impide matemáticamente el doble gasto.
4. **Resguardo de Fechas Operativas (`programs/project_config_notary`)**: Las fechas del proyecto (`project_start_at`/`project_end_at`) se resguardan en una PDA de Solana modificable únicamente mediante CPI de la Vault PDA de Squads, impidiendo la manipulación fraudulenta en bases de datos off-chain.

## What questions remain open
- Ninguna. La arquitectura de Payout Settlement con Merkle Root on-chain, PDA Notario y la estructura Monorepo FDD están totalmente justificadas y acordadas.
