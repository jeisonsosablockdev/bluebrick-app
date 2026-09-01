/**
 * @file scripts/sync-dashboard-excel.ts
 * @description Operational Script - Syncs DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx
 * from Google Drive directly into Neon PostgreSQL 7 relational tables.
 * 
 * Features:
 *   - Fetches live XLSX binary stream from Google Drive using Service Account OAuth2 JWT.
 *   - Parses all 7 operational sheets through StreamingSpreadsheetAdapter.
 *   - Atomic transaction upsert across:
 *       1. dashboard_projects (Proyectos)
 *       2. dashboard_investors (Inversionistas)
 *       3. dashboard_investments (Inversiones)
 *       4. dashboard_project_phases (Fases_Proyecto)
 *       5. dashboard_opportunities (Oportunidades)
 *       6. dashboard_reinvestment_transactions (Transacciones_Reinversion)
 *       7. dashboard_investor_summaries (Resumen_Dashboard)
 *   - Syncs existing reinvestment_opportunities for zero backward regressions.
 */

// Intercept server-only for standalone Node script execution
import module from "node:module";
const originalRequire = (module as any).prototype.require;
(module as any).prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments as any);
};

import { Pool } from "pg";

const DASHBOARD_FILE_ID = "1MToOPlgJnmrLk8kDYooyQeCrTqT3HtGl";

async function main() {
  console.log("=== BlueBrick Multi-Sheet Dashboard Sync ===");

  const { GoogleServiceAccountAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/google-service-account-adapter");
  const { StreamingSpreadsheetAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter");

  // Step 1: Initialize Google Service Account Adapter and get access token
  const authAdapter = new GoogleServiceAccountAdapter({
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  });

  console.log("Authenticating with Google Drive...");
  const auth = await authAdapter.getAccessToken();

  console.log("Downloading DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx from Google Drive...");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${DASHBOARD_FILE_ID}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download Excel file: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`Downloaded ${buffer.length} bytes.`);

  // Step 2: Parse all 7 sheets with StreamingSpreadsheetAdapter
  console.log("Parsing multi-sheet workbook with StreamingSpreadsheetAdapter...");
  const spreadsheetAdapter = new StreamingSpreadsheetAdapter();
  const workbookData = await spreadsheetAdapter.parseDashboardWorkbook(buffer, "dashboard.xlsx");

  console.log(`Parsed entities:`);
  console.log(`  - Proyectos: ${workbookData.proyectos.length}`);
  console.log(`  - Inversionistas: ${workbookData.inversionistas.length}`);
  console.log(`  - Inversiones: ${workbookData.inversiones.length}`);
  console.log(`  - Fases de Proyecto: ${workbookData.fases.length}`);
  console.log(`  - Oportunidades: ${workbookData.oportunidades.length}`);
  console.log(`  - Transacciones: ${workbookData.transacciones.length}`);
  console.log(`  - Resumenes: ${workbookData.resumenes.length}`);

  // Step 3: Connect to Neon PostgreSQL and run atomic upserts
  console.log("Connecting to Neon PostgreSQL...");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Upsert dashboard_projects
    for (const proj of workbookData.proyectos) {
      await client.query(
        `INSERT INTO dashboard_projects (id_inversion, nombre, direccion, tipo_proyecto, timing_months, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id_inversion) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           direccion = EXCLUDED.direccion,
           tipo_proyecto = EXCLUDED.tipo_proyecto,
           timing_months = EXCLUDED.timing_months,
           updated_at = NOW()`,
        [proj.idInversion, proj.nombre, proj.ciudad, proj.tipoProyecto, proj.duracionMeses]
      );
    }

    // 2. Upsert dashboard_investors
    for (const inv of workbookData.inversionistas) {
      await client.query(
        `INSERT INTO dashboard_investors (id_inversionista, nombre, email, tipo_inversionista, fecha_ingreso, timing_months, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id_inversionista) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           email = EXCLUDED.email,
           tipo_inversionista = EXCLUDED.tipo_inversionista,
           fecha_ingreso = EXCLUDED.fecha_ingreso,
           timing_months = EXCLUDED.timing_months,
           updated_at = NOW()`,
        [inv.idInversionista, inv.nombre, inv.email, inv.tipoInversionista, inv.fechaIngreso, inv.timingMonths]
      );
    }

    // 3. Upsert dashboard_investments
    for (const inv of workbookData.inversiones) {
      const invId = inv.id || `INV_${inv.idInversion}_${inv.idInversionista}`;
      await client.query(
        `INSERT INTO dashboard_investments (
           id, id_inversion, id_inversionista, nombre_proyecto, ciudad, tipo_propiedad, tipo_proyecto,
           monto_invertido, roi_pct, estado, fecha_inicio, duracion_meses, rango_esperado, fecha_timing,
           allocation_pct, imagen_url, avance_fase_pct, fase_actual, ganancia_proyectada, rendimiento_devengado, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
         ON CONFLICT (id) DO UPDATE SET
           nombre_proyecto = EXCLUDED.nombre_proyecto,
           ciudad = EXCLUDED.ciudad,
           monto_invertido = EXCLUDED.monto_invertido,
           roi_pct = EXCLUDED.roi_pct,
           estado = EXCLUDED.estado,
           duracion_meses = EXCLUDED.duracion_meses,
           fecha_timing = EXCLUDED.fecha_timing,
           allocation_pct = EXCLUDED.allocation_pct,
           imagen_url = EXCLUDED.imagen_url,
           avance_fase_pct = EXCLUDED.avance_fase_pct,
           fase_actual = EXCLUDED.fase_actual,
           ganancia_proyectada = EXCLUDED.ganancia_proyectada,
           rendimiento_devengado = EXCLUDED.rendimiento_devengado,
           updated_at = NOW()`,
        [
          invId,
          inv.idInversion,
          inv.idInversionista,
          inv.nombreProyecto,
          inv.ciudad,
          inv.tipoPropiedad,
          inv.tipoProyecto,
          inv.montoInvertido,
          inv.roiPct,
          inv.estado,
          inv.fechaInicio,
          inv.duracionMeses,
          inv.rangoEsperado,
          inv.fechaTiming,
          inv.allocationPct,
          inv.imagenUrl,
          inv.avanceFasePct,
          inv.faseActual,
          inv.gananciaProyectada,
          inv.rendimientoDevengado,
        ]
      );
    }

    // 4. Upsert dashboard_project_phases
    for (const phase of workbookData.fases) {
      const phaseId = `${phase.idFase}_${phase.idInversion}`;
      const img1 = phase.imagenes[0] || null;
      const img2 = phase.imagenes[1] || null;
      const img3 = phase.imagenes[2] || null;

      await client.query(
        `INSERT INTO dashboard_project_phases (
           id, id_fase, id_inversion, orden, nombre_fase, estado, fecha_inicio, fecha_fin,
           imagen_url_1, imagen_url_2, imagen_url_3, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         ON CONFLICT (id) DO UPDATE SET
           orden = EXCLUDED.orden,
           nombre_fase = EXCLUDED.nombre_fase,
           estado = EXCLUDED.estado,
           fecha_inicio = EXCLUDED.fecha_inicio,
           fecha_fin = EXCLUDED.fecha_fin,
           imagen_url_1 = EXCLUDED.imagen_url_1,
           imagen_url_2 = EXCLUDED.imagen_url_2,
           imagen_url_3 = EXCLUDED.imagen_url_3,
           updated_at = NOW()`,
        [
          phaseId,
          phase.idFase,
          phase.idInversion,
          phase.orden,
          phase.nombreFase,
          phase.estado,
          phase.fechaInicio,
          phase.fechaFin,
          img1,
          img2,
          img3,
        ]
      );
    }

    // 5. Upsert dashboard_opportunities
    for (const opp of workbookData.oportunidades) {
      const oppId = opp.id || "opp_" + opp.titulo.toLowerCase().replace(/[^a-z0-9]/g, "_");
      await client.query(
        `INSERT INTO dashboard_opportunities (
           id_oportunidad, nombre_proyecto, ciudad, roi_estimado, ticket_minimo, activa, gradient, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, TRUE, $6, NOW())
         ON CONFLICT (id_oportunidad) DO UPDATE SET
           nombre_proyecto = EXCLUDED.nombre_proyecto,
           ciudad = EXCLUDED.ciudad,
           roi_estimado = EXCLUDED.roi_estimado,
           ticket_minimo = EXCLUDED.ticket_minimo,
           updated_at = NOW()`,
        [oppId, opp.titulo, opp.ciudad, opp.roiProyectado > 1 ? opp.roiProyectado / 100 : opp.roiProyectado, opp.inversionMinima, opp.gradient]
      );

      // Backward compatibility: also sync into reinvestment_opportunities
      await client.query(
        `INSERT INTO reinvestment_opportunities (id, title, city, projected_roi, min_investment, days_left, gradient)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           city = EXCLUDED.city,
           projected_roi = EXCLUDED.projected_roi,
           min_investment = EXCLUDED.min_investment,
           gradient = EXCLUDED.gradient`,
        [oppId, opp.titulo, opp.ciudad, opp.roiProyectado, opp.inversionMinima, opp.diasRestantes, opp.gradient]
      );
    }

    // 6. Upsert dashboard_reinvestment_transactions
    for (const trx of workbookData.transacciones) {
      await client.query(
        `INSERT INTO dashboard_reinvestment_transactions (
           id_transaccion, id_inversionista, id_oportunidad, monto, fecha_solicitud, estado, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id_transaccion) DO UPDATE SET
           monto = EXCLUDED.monto,
           estado = EXCLUDED.estado,
           updated_at = NOW()`,
        [trx.idTransaccion, trx.idInversionista, trx.idOportunidad, trx.monto, trx.fechaSolicitud || new Date(), trx.estado]
      );
    }

    // 7. Upsert dashboard_investor_summaries
    for (const res of workbookData.resumenes) {
      await client.query(
        `INSERT INTO dashboard_investor_summaries (
           id_inversionista, nombre, patrimonio_total_invertido, rendimiento_acumulado,
           capital_total_actual, roi_ponderado, num_activas, num_concluidas,
           capital_disponible_reinversion, ganancia_proyectada_total, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (id_inversionista) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           patrimonio_total_invertido = EXCLUDED.patrimonio_total_invertido,
           rendimiento_acumulado = EXCLUDED.rendimiento_acumulado,
           capital_total_actual = EXCLUDED.capital_total_actual,
           roi_ponderado = EXCLUDED.roi_ponderado,
           num_activas = EXCLUDED.num_activas,
           num_concluidas = EXCLUDED.num_concluidas,
           capital_disponible_reinversion = EXCLUDED.capital_disponible_reinversion,
           ganancia_proyectada_total = EXCLUDED.ganancia_proyectada_total,
           updated_at = NOW()`,
        [
          res.idInversionista,
          res.nombre,
          res.patrimonioTotalInvertido,
          res.rendimientoAcumulado,
          res.capitalTotalActual,
          res.roiPonderado,
          res.numActivas,
          res.numConcluidas,
          res.capitalDisponibleReinversion,
          res.gananciaProyectadaTotal,
        ]
      );
    }

    await client.query("COMMIT");
    console.log("✅ Successfully synced all 7 tables in Neon PostgreSQL!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Sync transaction failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
