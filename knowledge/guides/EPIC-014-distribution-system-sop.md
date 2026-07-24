# Guía de Procedimiento Operativo (SOP): Sistema de Distribución de Rendimientos (EPIC-014)

---

## 📋 Información General

Esta guía documenta el procedimiento operativo paso a paso para ejecutar, verificar y auditar el sistema de distribución de rendimientos inmobiliarios de **BRIDS** en **Solana Devnet**.

---

## 🔄 Flujo Operativo de 8 Etapas

```
[Etapa 1: Aprovisionamiento] -> [Etapa 2: Provieniencia de Mint] -> [Etapa 3: Stake/Freeze Eventos]
                                                                                │
[Etapa 6: Reclamo de Usuario] <- [Etapa 5: Comité de Revisión] <- [Etapa 4: Snapshot & Cálculo]
          │
[Etapa 7: Dispersión Squads v4] -> [Etapa 8: Monitoreo TTL Compliance]
```

---

### Etapa 1: Aprovisionamiento de Infraestructura & RPC Archival

1. **Verificar Estado de Nodos RPC Archival**:
   - Ejecutar la ruta de salud administrativa:
     ```http
     GET /api/admin/archival/health
     ```
   - El sistema valida la retención de ledger de `helius-archive` (primario) y `alchemy-archive` (secundario) y actualiza el campo `min_ledger_slot` en la base de datos.
   - **Criterio de éxito**: Ambos proveedores retornan `healthy: true`. Si ambos fallan para el rango requerido, cualquier ejecución de cálculo pasará a estado `BLOCKED` con la razón `dual_provider_gap`.

2. **Registrar Origen de Candy Machine**:
   - Configurar la relación proyecto ↔ Candy Machine en la tabla `project_candy_machine_sources`:
     ```typescript
     await upsertProjectCandyMachineSource({
       projectId: "proyecto-cartagena-01",
       candyMachineAddress: "<CANDY_MACHINE_DEVNET_ADDRESS>",
       collectionAddress: "<COLLECTION_DEVNET_ADDRESS>",
       authorizedSupply: 100,
       nftPriceMinor: 100000000n, // 100 USDC
       unsoldInventoryPolicy: "exclude_unsold"
     });
     ```

3. **Congelar Autoridad de Mint**:
   - Tras alcanzar el umbral de financiamiento, congelar la autoridad de mint en la Candy Machine de Solana y registrar la confirmación:
     ```typescript
     await recordMintAuthorityFreeze({
       projectId: "proyecto-cartagena-01",
       confirmedAt: new Date()
     });
     ```
   - Esto congela el denominador del pozo y previene la dilución tardía de inversores.

---

### Etapa 2: Verificación de Proveniencia de Mint

1. **Ejecutar Job de Backfill de Proveniencia**:
   - Invocar el endpoint administrativo:
     ```http
     POST /api/admin/provenance/backfill
     Content-Type: application/json

     {
       "projectId": "proyecto-cartagena-01"
     }
     ```
   - El job escanea todos los NFTs de la colección mediante Helius DAS (`getAssetsByGroup`), consulta el historial de transacciones en los nodos RPC Archival y registra cada activo en `asset_project_origins`.

2. **Criterios de Clasificación de Activos**:
   - `provenance_status = 'validated'`: Transacción de mint verificada en RPC Archival. **Únicos activos elegibles para el cálculo**.
   - `provenance_status = 'needs_review'`: Transacción recortada o no verificable. **Excluidos automáticamente del cálculo financiero**.

---

### Etapa 3: Acumulación de Tiempo Congelado (Stake/Unstake)

1. **Congelamiento de Activos (Stake)**:
   - El usuario congela su NFT desde la plataforma utilizando la extensión `FreezeDelegate` de MPL Core (autoridad `Owner`).
   - El webhook de Helius detecta la instrucción `freeze` en Solana y activa la reconciliación:
     ```typescript
     await reconcileSubmittedStakeActionBySignature({ signature: "<TX_SIGNATURE>" });
     ```
   - La transacción se valida contra los nodos RPC Archival y se inserta en `user_profile_stake_events`.

2. **Descongelamiento de Activos (Unstake)**:
   - Al descongelar (`unfreeze`), el evento cierra el intervalo de ganancias activo para dicho activo.

---

### Etapa 4: Configuración de Snapshot & Cálculo Determinista de Hamilton

1. **Crear Snapshot de Distribución (DRAFT)**:
   - Registrar el parámetro de distribución:
     ```typescript
     const { run } = await createDistributionSnapshot({
       projectId: "proyecto-cartagena-01",
       eligibilityStartAt: "2026-01-01T00:00:00Z",
       eligibilityEndAt: "2026-06-01T00:00:00Z",
       availableTreasuryEarningsMinor: 1000000000n, // 1,000 USDC disponibles
       distributionPoolAmountMinor: 500000000n,   // 500 USDC a repartir
       tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
       treasuryVault: "<SQUADS_VAULT_ADDRESS>",
       createdByActorId: "admin-principal"
     });
     ```
   - **Guarda de Seguridad**: Si `distributionPoolAmountMinor > availableTreasuryEarningsMinor`, la llamada falla inmediatamente.

2. **Ejecutar el Cálculo de Distribución**:
   - Invocar la ejecución del algoritmo:
     ```typescript
     const result = await executeDistributionCalculation(run.id);
     ```
   - **Pasos Internos del Cálculo**:
     - Obtiene activos validados (`provenance_status = 'validated'`).
     - Reconstruye los intervalos discontinuos `(frozenAt, thawedAt)` desde RPC Archival.
     - Aplica el recorte (*clipping*) a la ventana de elegibilidad del proyecto.
     - Suma los segundos congelados por wallet (`wallet_time_weight`).
     - **Guarda de Participación Cero**: Si `pool_time_weight == 0n`, el run pasa a `BLOCKED` con la razón `no_eligible_participation`.
     - **Aritmética de Enteros Hamilton (Resto Mayor)**:
       - *Pase 1*: `floor(poolAmount * walletWeight / poolWeight)` en matemática entera de 64 bits (`BigInt`).
       - *Pase 2*: Ordena los residuos exactos en forma descendente con desempate por 1) residuo DESC, 2) timestamp de primer congelamiento ASC (FIFO), 3) dirección de wallet ASC (alfabetico). Reparte 1 unidad menor por wallet hasta agotar el residuo.
       - *Invariante de Suma*: Verifica que `Σ grossAmountMinor == distributionPoolAmountMinor`.
     - Transiciona el estado del run a `ready_for_review`.

---

### Etapa 5: Paquete de Revisión del Comité

1. **Generar Paquete de Dispersión**:
   - El comité solicita la inspección del paquete:
     ```http
     POST /api/admin/distribution/runs/{runId}/committee
     Content-Type: application/json

     {
       "action": "review"
     }
     ```
   - Retorna la estructura `DispersionPackage` con totales brutos/netos, desglose por wallet, contexto RPC de slot finalizado y banderas de cumplimiento.

2. **Aprobar Dispersión**:
   - Tras validar los totales, el comité aprueba la dispersión:
     ```http
     POST /api/admin/distribution/runs/{runId}/committee
     Content-Type: application/json

     {
       "action": "approve",
       "reason": "Verificación de montos brutos y proveniencia completada exitosamente."
     }
     ```
   - El estado del run pasa a `approved_for_dispersion`. Si el comité rechaza (`action: "reject"`), el run pasa a `committee_rejected` y se devuelve a `draft` para recalcular.

---

### Etapa 6: Ciclo de Vida de Reclamo del Usuario (Claim)

1. **Solicitar Cotización de Reclamo (Quote)**:
   - El usuario autenticado solicita su cotización:
     ```http
     POST /api/protected/claims
     Content-Type: application/json

     {
       "runId": "<RUN_ID>"
     }
     ```
   - **Protección Concurrente**: El sistema adquiere un bloqueo transaccional advisory lock en PostgreSQL (`pg_advisory_xact_lock`) sobre `(wallet, runId)` para impedir doble reclamo.
   - **Re-check de Compliance**: Si la wallet está en estado `restricted_aml` o `suspended`, la cotización pasa automáticamente a `compliance_hold`.
   - **Cálculo de Comisión**: Aplica la política de comisión versionada activa (`candy_machine` > `project` > `global`). La comisión se deduce del bruto (`fee <= gross`).
   - Se fija un TTL de **48 horas** (`quote_expires_at`).

2. **Confirmar Reclamo**:
   - El usuario confirma dentro del periodo de 48 horas:
     ```http
     POST /api/protected/claims/{claimId}/confirm
     ```
   - Si transcurren más de 48 horas sin confirmación, la cotización expira (`expired`) y el saldo puede volver a ser cotizado. Al confirmar, el reclamo pasa a `approved_for_dispersion`.

3. **(Opcional) Solicitud de Cambio de Wallet de Pago**:
   - Para redirigir el pago a una nueva wallet, el usuario debe presentar una prueba criptográfica SIWS (*Sign-In With Solana*) firmada por la wallet original.

---

### Etapa 7: Ejecución en Lotes Multisig Squads v4

1. **Agrupar Reclamos Confirmados en Lotes**:
   - Los reclamos confirmados se agrupan en lotes de transferencia mediante Squads v4:
     ```typescript
     const batches = await createPayoutBatchesFromClaims({
       projectId: "proyecto-cartagena-01",
       runId: "<RUN_ID>",
       tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
       treasuryVault: "<SQUADS_VAULT_ADDRESS>",
       createdByActorId: "admin-principal"
     });
     ```
   - **Guarda de Límite de CUs**: Se impone strictly **`MAX_LEGS_PER_BATCH = 20`** instrucciones por propuesta. Si hay 45 reclamos, se generan 3 propuestas (20 + 20 + 5).
   - Se resuelven las Cuentas de Tokens Asociadas (ATAs) de cada beneficiario.
   - Los reclamos pasan a estado `queued_for_payout`.

2. **Aprobación y Firma en Squads v4**:
   - Los miembros del comité multisig aprueban y firman la propuesta en la CLI/interfaz de Squads v4.
   - Se envía la transacción en lote (`initiate_batch_transfer`) a Solana Devnet.

3. **Reconciliación de Pago**:
   - Tras confirmarse la firma en blockchain, el reconciliador actualiza el estado:
     ```typescript
     await reconcilePayoutBatch({
       batchId: "<BATCH_ID>",
       txSignature: "<SOLANA_DEVNET_TX_SIGNATURE>"
     });
     ```
   - Si alguna leg individual falla (ej. ATA congelada), dicho item pasa a `FAILED` mientras los demás completan en `PARTIALLY_FAILED`, permitiendo su reintento en una cola de fallos aislada.

---

### Etapa 8: Monitoreo de TTL de Compliance (12 Meses)

1. **Job Automatizado de Limpieza y Recuperación**:
   - Un cron job diario ejecuta el monitoreo de retenciones por cumplimiento:
     ```typescript
     const result = await runComplianceHoldTtlMonitor();
     ```
   - **Regla de 12 Meses**: Cualquier reclamo que permanezca en `COMPLIANCE_HOLD` durante más de 12 meses (365 días) transiciona a `compliance_hold_expired` y posteriormente a `clawback_to_treasury`.
   - Los fondos no reclamados se acreditan a la reserva de tesorería del proyecto (`TreasuryClawbackReserve`).
