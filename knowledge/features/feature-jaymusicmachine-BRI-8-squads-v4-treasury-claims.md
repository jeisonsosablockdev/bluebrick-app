# Problem Spec: squads-v4-treasury-claims (BRI-8)

## What problem exists
Actualmente, el sistema de dispersión y reclamaciones de tesorería (`BRI-8` / `STORY-014-04`) simula las firmas e interacciones con el programa Squads v4 en Solana Devnet (`SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582`), sin ejecutar transacciones reales on-chain. Además, si se requiere procesar miles de transferencias (ej. 20,000 en un proyecto inmobiliario fraccionado), la aproximación tradicional de firmar sublotes de 20 transferencias obligaría al comité a aprobar 1,000 transacciones individualmente en su wallet, lo cual es inmanejable operacionalmente.

Adicionalmente, existen 3 brechas críticas de gobernanza y automatización:
1. Payout Overrides sin cola de aprobación del comité (se aplican de forma inmediata y automática).
2. Ausencia de triggers de cron para expiración de cotizaciones (48h) y retenciones de compliance (12 meses).
3. Estado `CANCELED` inalcanzable para que el usuario cancele sus solicitudes pendientes en `CLAIM_REQUESTED`.

## Why it matters
1. **Seguridad y Verificabilidad**: Todas las operaciones de tesorería deben ser transacciones reales verificables en Solana Devnet mediante el programa Squads v4.
2. **Escalabilidad Operacional**: El comité multisig debe poder aprobar la dispersión global de una corrida de distribución con **1 sola firma por propuesta marco**, delegando el despacho desatendido en sublotes de 20 transferencias al motor de BRIDS.
3. **Control Interno**: El cambio de wallet de pago debe pasar por una cola de aprobación `PENDING` -> `APPROVED`/`REJECTED` por parte del comité para prevenir insider threats.

## What outcome is expected
1. Integración formal del SDK `@sqds/multisig` para crear Propuestas Marco on-chain en Squads v4 en Solana Devnet.
2. Adoptar el **Modelo Delegated Squads Allowance**, donde el comité aprueba la propuesta marco por el monto global de la corrida (`runId`), y el worker desatendido (`squads-batch.ts`) procesa automáticamente los sublotes de 20 transferencias (`MAX_LEGS_PER_BATCH = 20`).
3. Interfaz nativa conectada entre `/admin/distributions` (donde se seleccionan las corridas finalizadas) y `/admin/treasury/squads` (donde se firma la propuesta marco y se monitorea el despacho desatendido).
4. Cierre completo de las 3 brechas de gobernanza: tabla `distribution_payout_overrides`, endpoints de cron `/api/cron/*` y endpoint de cancelación `/api/claims/[claimId]/cancel`.

## What gaps exist today
- `@sqds/multisig` no está instalado en `package.json`.
- `submitPayoutOverride` aplica cambios de wallet sin revisión del comité.
- No existen endpoints API para los monitores de cronjobs (`QUOTE_EXPIRY_MONITOR`, `COMPLIANCE_TTL_MONITOR`).
- No existe vista de administración nativa en `/admin/treasury/squads`.

## What questions remain open
- Ninguna. La arquitectura de Delegated Allowance y la interfaz administrativa fueron discutidas y alineadas.
