/**
 * ============================================================================
 * Feature: AI-Augmented Ingestion Pipeline & Schema Alignment
 * ============================================================================
 * Public Barrel Export following 4-Layer Feature-Driven Design.
 */

// Layer 2: Application Services
export * from './application/services/differential-sync-service';

// Layer 3: Domain Ports, Models, Types & Schemas
export * from './domain/ports/google-auth-port';
export * from './domain/ports/drive-changes-port';
export * from './domain/ports/blob-storage-port';
export * from './domain/models/sync-event-models';
export * from './domain/schemas/canonical-client-schema';
export * from './domain/schemas/canonical-project-schema';
export * from './domain/schemas/canonical-media-schema';
export * from './domain/schemas/canonical-sync-record-schema';

// Layer 4: Infrastructure Adapters
export * from './infrastructure/google-service-account-adapter';
export * from './infrastructure/google-drive-changes-adapter';
export * from './infrastructure/vercel-blob-adapter';
