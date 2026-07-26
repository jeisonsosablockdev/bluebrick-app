# Solution Spec: squads-v4-treasury-claims Implementation (BRI-8)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `solana` (Solana Kit & Squads v4) & `frontend` (Admin UI) & `db` (Governance Schema)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

La solución implementa la integración del SDK `@sqds/multisig` en Solana Devnet bajo el **Modelo Delegated Squads Allowance** (firma única multisig por corrida marco, despacho desatendido en sublotes de 20 transferencias), la verificación criptográfica nativa por **Árboles de Merkle (`merkleRoot`)**, el programa Anchor `project_config_notary` para la **PDA Notario On-Chain**, la lectura directa de fechas en `distribution-engine.ts`, y la eliminación total de APIs REST de mutación directa.

```
+-------------------------------------------------------------------------+
| 1. Presentation Layer (app/admin/distributions, app/admin/treasury/squads)|
|    - DistributionsConsole: Acción "Crear Propuesta Marco Squads"        |
|    - SquadsMultisigConsole: Firma 1/1 de Propuesta Marco & Live Monitor  |
|    - Controls: Toggle "Expandir/Ocultar Todos", Badges case_number       |
|    - Governance Alert: Banner Alerta Modificación project_start_at/end_at|
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
| 2. Application/Consumption Layer (app/api/admin/batches/*, cron/*)     |
|    - POST /api/admin/batches/create-master-proposal                     |
|    - POST /api/admin/collections/[id]/date-change-request (PENDING)     |
|    - POST /api/admin/batches/[id]/approve & /api/cron/*                 |
|    - HTTP Validators: IMMUTABLE_PROJECT_DATE_FIELDS (400 rejection)      |
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
| 3. Domain/Pipelines/Services Layer (lib/squads/, lib/claims/, lib/dist)|
|    - squads-batch.ts: Motor desatendido (Sublotes de 20 transferencias) |
|    - distribution-engine.ts: Lectura DIRECTA desde PDA Notario Solana RPC|
|    - claim-flow.ts: Gobernanza Payout Overrides con case_number         |
|    - Merkle Tree: Keccak256 leaf hashing (claimId, pubkey, amount)      |
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
| 4. Infrastructure Layer (programs/project_config_notary, Solana RPC)    |
|    - ProjectConfigPDA: PDA Notario on-chain para project_start_at/end_at|
|    - Program SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582 (Squads v4)     |
|    - Postgres DB: Read-Model Cache de lectura informativa               |
+-------------------------------------------------------------------------+
```

## 3. Atomic Slices & Story Breakdown (STORY-015-01 a STORY-015-07)

- **STORY-015-01**: Integración `@sqds/multisig` y worker desatendido en sublotes de 20 transferencias.
- **STORY-015-02**: Consola nativa UI en `/admin/treasury/squads` con controles minimalistas "Expandir Todos / Ocultar Todos", badges `case_number` y Banner de Auditoría de Fechas del Proyecto.
- **STORY-015-03**: Gobernanza de Payout Overrides en 2 pasos asociando el `case_number` obligatorio.
- **STORY-015-04**: Endpoints API para cronjobs de 48h (`claims-expiry`), 12 meses (`compliance-ttl`) y ruta de cancelación por el usuario.
- **STORY-015-05**: Rechazo global (`proposalReject`), veto granular (`vetoClaimItem`), freno de emergencia (`circuitBreaker`) y Verificación Criptográfica por **Árboles de Merkle (`merkleRoot`)**.
- **STORY-015-06**: Programa Anchor/Pinocchio `project_config_notary` para la **PDA Notario `ProjectConfigPDA`** en Solana Devnet.
- **STORY-015-07**: Conexión de `distribution-engine.ts` para lectura directa RPC desde Solana, Postgres como caché informativo (*Read-Model Cache*) y desmantelamiento de APIs HTTP de mutación directa.

## 4. TDD (Test-Driven Development) Strategy

### Unit/Integration Tests
- **Test File Paths**:
  - `tests/lib/squads-batch.test.ts`
  - `tests/lib/payout-override-governance.test.ts`
  - `tests/api/cron-endpoints.test.ts`
  - `tests/lib/distribution-engine-pda.test.ts`
- **Assertion Goals**:
  - Validar que la creación de Propuesta Marco genera el Allowance total en la PDA de la corrida.
  - Verificar que las hojas del Árbol de Merkle satisfacen la `merkleRoot` firmada.
  - Confirmar que `distribution-engine.ts` lee directamente la PDA Notario on-chain e ignora modificaciones manuales en Postgres DB.
  - Validar que las peticiones PATCH con campos de fechas son rechazadas con `400 IMMUTABLE_PROJECT_DATE_FIELD`.

## 5. Local Definition of Done (DoD)
- [ ] Todas las 7 historias de EPIC-015 especificadas sin cabos sueltos.
- [ ] La suite de pruebas de regresión pasa al 100% en verde.
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] Documentación de arquitectura local y de base de datos totalmente sincronizada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims.md)
- **Solution Spec**: [feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims-implementation.md)
- **Linear Issue**: [Linear Ticket #BRI-8](https://linear.app/brids-app/issue/BRI-8)
