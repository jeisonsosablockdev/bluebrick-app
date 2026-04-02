# STORY-005-02-foundation-rpc-address-and-compat-adapters

## Metadata
- Epic: `EPIC-005-full-migration-from-solana-web3-js-to-solana-kit`
- Story ID: `STORY-005-02-foundation-rpc-address-and-compat-adapters`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Hoy no existe una capa foundation única para RPC/address/signers que permita migrar de forma segura y evitar imports directos de `@solana/web3.js` en dominio/app/servicios.
- Why now:
  Sin esta capa base, las historias de auth y pipelines transaccionales tendrian riesgo alto y cambios duplicados.
- Constraints:
  - `@solana/web3-compat` permitido solo en adapters de borde temporal.
  - Prohibido filtrar tipos de `@solana/web3.js` fuera de adapters.
  - Mantener semantica de runtime y seguridad existente.
- Affected paths:
  - `lib/solana.ts`
  - `lib/**` (modulos shared de parseo/address/RPC)
  - `tests/lib/**`

## Proposal
- Approach summary:
  Introducir capa foundation centrada en `@solana/kit` para direcciones, RPC y serializacion base, con adapters de compatibilidad acotados para librerias externas.
- Technical design:
  - Crear namespace de foundation (ejemplo: `lib/solana-kit/*`) con:
    - construccion de cliente RPC.
    - normalizacion de address/public key strings.
    - helpers de serializacion/deserializacion transaccional usados por capas superiores.
  - Adapter boundary temporal:
    - `lib/solana-kit/compat/*` como unica zona donde se acepta `@solana/web3-compat`.
    - Regla de arquitectura: dominio/UI/servicios no importan `@solana/web3.js` ni `@solana/web3-compat` directamente.
  - Agregar check de arquitectura (regla lint) para detectar imports prohibidos fuera de adapters.
  - Publicar recetario operativo para patrones repetidos en `docs/guides/solana-kit-migration-recipes.md`.
- Alternatives considered:
  - Migrar cada modulo con utilidades ad-hoc: rechazado por duplicacion y deriva.
- Tradeoffs:
  - Costo inicial de foundation, a cambio de menor riesgo en historias 03-05.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. El boundary temporal debe estar explicitamente documentado para evitar deuda permanente.
2. La capa foundation debe mantener API minima y estable para evitar churn.
3. Debe existir criterio claro para retirar adapters en historia de cierre.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se aprueba crear capa foundation + compat adapters acotados + regla de arquitectura para imports.
- Changes accepted:
  - Compatibilidad temporal estricta solo en `compat/*`.
  - Checklist de retiro de compat en `STORY-005-05`.
- Changes rejected (with rationale):
  - Permitir compat amplia en cualquier capa (rechazado por riesgo de deuda estructural).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Historia aprobada como prerequisite tecnico de migraciones funcionales.

## Status
- Current status: `approved`
- Next action:
  Ejecutar `STORY-005-03` sobre auth/firma/anti-bot reutilizando foundation.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Pruebas de parseo/address normalization y fallos de validacion.
- Integration tests:
  - Validacion de cliente RPC y serializacion base en utilidades compartidas.
- Devnet validation (if applicable):
  - Smoke checks de llamadas RPC clave en devnet.
- Responsive QA (if applicable):
  - N/A.

## Traceability
- Related issue(s): `EPIC-005`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
