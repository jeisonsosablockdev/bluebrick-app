---
type: RFC
title: STORY-015-02 Admin Distributions & Treasury Multisig UI Integration
description: Especificación técnica y diseño detallado de la interfaz nativa minimalista para la firma multisig Squads v4, con control global de expansión ("Expandir Todos / Ocultar Todos"), desglose de Staking por Tiempo, dirección de origen, dirección de pago, dirección del NFT y Alerta de Auditoría de Cambios de Fechas de Inicio y Finalización (project_start_at / project_end_at).
tags: [rfcs, nextjs, ui, admin, distributions, treasury, squads, staking, minimalist, audit, project-dates]
timestamp: 2026-07-25T19:26:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui.md
---

# STORY-015-02-admin-distributions-treasury-ui

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-02-admin-distributions-treasury-ui`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: El comité requiere transparencia absoluta sobre las fechas operativas empleadas para calcular las rentas (`project_start_at` y `project_end_at`). Si un administrador edita la fecha de inicio o de finalización (lo cual puede diluir o ajustar el rendimiento de los holders), el comité debe ser alertado en pantalla de forma prominente antes de firmar en Squads v4.
- **Why now**: Proteger al comité multisig contra manipulación de fechas y garantizar auditoría clara de diluciones o prórrogas.
- **Constraints**: Sistema de diseño nativo BRIDS (Inter font, dark glassmorphism UI, i18n).
- **Affected paths**: `components/admin/distributions-console.tsx`, `app/admin/treasury/squads/page.tsx`, `components/admin/squads-multisig-console.tsx`.

## Technical UI Specification (Diseño Minimalista, Expansión & Alerta de Fechas)

### 1. Panel de Inspección de Fechas y Alerta de Auditoría (`Header Governance Card`)
Antes de autorizar la Propuesta Marco en Squads v4 en `/admin/treasury/squads`, el encabezado de la pantalla presenta la **Tarjeta de Inspección de Fechas del Proyecto**:
- **Fechas Oficiales del Proyecto**: Muestra `project_start_at` y `project_end_at` (ej. `Inicio: 2026-03-15` · `Fin: 2028-12-31`).
- **Ventana de la Corrida**: Muestra el rango financiero de la corrida (`periodStartAt` a `periodEndAt`).
- **Alerta Prominente de Modificación de Fecha (Audit Warning Banner)**:
  - Si `project_start_at` o `project_end_at` fueron modificadas o diferidas, la interfaz renderiza una **Alerta Destacada en Amarillo/Rojo**:
  > ⚠️ **ALERTA DE AUDITORÍA DE FECHA DE FINALIZACIÓN DEL PROYECTO**
  > La fecha `project_end_at` de este inmueble fue modificada el `10/03/2026 a las 14:20 UTC` por el usuario `admin-01`.
  > **Fecha Anterior**: `2027-12-31` $\rightarrow$ **Nueva Fecha Aplicada**: `2028-12-31`.
  > **Motivo Registrado**: *"Prórroga de contrato de arrendamiento por 12 meses adicionales - Adenda #3"*.

### 2. Barra de Controles Globales de la Tabla
- **Toggle Global**: Botón **"Expandir Todos" / "Ocultar Todos"** (*Expand All / Collapse All*) en el encabezado de la tabla para abrir o cerrar de golpe todas las filas colapsables de beneficiarios.

### 3. Vista Filas Minimalistas (Vista por Defecto)
Cada fila muestra por defecto únicamente la información esencial:
- **[Chevron 🔽/🔼]**: Botón de expansión individual por beneficiario.
- **Usuario / Identidad**: Nombre KYC verificado (`Carlos Mendoza` `@carlos_m`).
- **Días de Stake**: Días que mantuvo el NFT congelado en el período (ej. `15.0 días (50%)`).
- **Wallet de Pago (`payout_wallet`)**: Dirección de destino donde se depositarán los USDC (con badge de override si aplica: `🟡 CASE-2026-0891`).
- **Neto a Recibir**: Monto neto a transferir (ej. **`$1,176.00 USDC`**).

### 4. Panel Desplegable de Detalle (Vista Expandida por Fila)
Al pulsar el chevron de una fila (o pulsar "Expandir Todos"), se despliega un panel minimalista con los datos de auditoría:
- **Dirección de Origen (Wallet Titular)**: Wallet original que registró las acciones de freeze/stake (`3tW8...x9K2`).
- **Dirección a la que se va a Pagar**: Wallet autorizada para la dispersión (`7mQ1...p4N9`).
- **Dirección del NFT (Asset Mint Pubkey)**: Dirección pública de la cuenta Mint/Asset en Solana Devnet (`Asset: 9xP2...v4M1`).
- **Fecha y Días desde el Mint**: Fecha exacta del minting en Candy Machine (ej. `2026-01-15` · *40 días desde el mint*).
- **Intervalo de Staking Verificado**: Rango exacto de días congelados en el período (ej. `01/03/2026 al 15/03/2026`).
- **Desglose Financiero**: Monto Bruto (`$1,200.00 USDC`), Comisión BRIDS (`$24.00 USDC`), Neto Final (`$1,176.00 USDC`).

---

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Alerta de auditoría de modificación de `project_start_at` y `project_end_at` renderizada en el encabezado de `/admin/treasury/squads`.
  - [ ] Control global "Expandir Todos / Ocultar Todos" y desglose minimalista de beneficiarios funcionando en UI.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
