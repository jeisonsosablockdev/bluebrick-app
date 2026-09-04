/**
 * @file scripts/sync-dashboard-excel.ts
 * @description Operational Script - Syncs DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx
 * from Google Drive directly into Neon PostgreSQL 7 relational tables via DashboardSyncService.
 * 
 * Features:
 *   - Delegates to unified Layer 2 DashboardSyncService.
 *   - Reuses GoogleServiceAccountAdapter, StreamingSpreadsheetAdapter, and Neon connection pool.
 *   - Guarantees 100% DRY alignment between CLI operations and automated Vercel Crons.
 */

// Intercept server-only for standalone Node script execution
import module from "node:module";
const originalRequire = (module as any).prototype.require;
(module as any).prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments as any);
};

import { Pool } from "pg";

async function main() {
  console.log("=== BlueBrick Multi-Sheet Dashboard Sync ===");

  const { GoogleServiceAccountAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/google-service-account-adapter");
  const { StreamingSpreadsheetAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter");
  const { GoogleDriveFolderReaderAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/google-drive-folder-reader-adapter");
  const { VercelBlobAdapter } = await import("../apps/web/src/features/ai-ingestion/infrastructure/vercel-blob-adapter");
  const { DashboardSyncService } = await import("../apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service");

  // Step 1: Initialize Google Service Account Adapter
  const authAdapter = new GoogleServiceAccountAdapter({
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  });

  // Step 2: Initialize Streaming Spreadsheet Adapter, Folder Reader & Blob Storage
  const spreadsheetAdapter = new StreamingSpreadsheetAdapter();
  const folderReader = new GoogleDriveFolderReaderAdapter({ authProvider: authAdapter });
  const blobStorage = new VercelBlobAdapter();

  // Step 3: Initialize Database Connection Pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Step 4: Initialize and execute unified DashboardSyncService
  const syncService = new DashboardSyncService({
    authProvider: authAdapter,
    spreadsheetParser: spreadsheetAdapter,
    dbPool: pool,
    folderReader,
    blobStorage,
  });

  console.log("Executing synchronization via DashboardSyncService...");
  const result = await syncService.executeSync();

  console.log("✅ Successfully synced all 7 tables in Neon PostgreSQL!");
  console.log("Entities synced:", result.counts);
  console.log("Metrics:", result.metrics);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});

