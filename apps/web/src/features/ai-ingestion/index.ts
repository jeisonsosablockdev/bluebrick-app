/**
 * ============================================================================
 * Feature: AI-Augmented Ingestion Pipeline & Schema Alignment
 * ============================================================================
 * Public Barrel Export following 4-Layer Feature-Driven Design.
 */

// Layer 1: Presentation Components
export * from './presentation/components/project-media-gallery';
export * from './presentation/components/hitl-split-viewer';

// Layer 2: Application Services, Actions & RSC Queries
export * from './application/services/differential-sync-service';
export * from './application/services/video-ingestion-service';
export * from './application/services/dashboard-sync-service';
export * from './application/actions/hitl-review-actions';
export * from './application/queries/get-dashboard-data-query';

// Layer 3: Domain Ports, Models, Policies, Math, Validators, Scoring, Utils, Types & Schemas
export * from './domain/ports/google-auth-port';
export * from './domain/ports/drive-changes-port';
export * from './domain/ports/blob-storage-port';
export * from './domain/ports/image-processor-port';
export * from './domain/ports/focal-point-port';
export * from './domain/ports/video-tagger-port';
export * from './domain/ports/pdf-extractor-port';
export * from './domain/ports/spreadsheet-parser-port';
export * from './domain/ports/repositories-port';
export * from './domain/policies/image-quality-policy';
export * from './domain/policies/hitl-rbac-policy';
export * from './domain/math/smart-crop-calculator';
export * from './domain/validators/nit-validator';
export * from './domain/scoring/confidence-scoring-engine';
export * from './domain/scoring/anomaly-detector';
export * from './domain/utils/excel-date-converter';
export * from './domain/models/sync-event-models';
export * from './domain/models/dashboard-sync-models';
export * from './domain/schemas/canonical-client-schema';
export * from './domain/schemas/canonical-project-schema';
export * from './domain/schemas/canonical-media-schema';
export * from './domain/schemas/canonical-sync-record-schema';
export * from './domain/schemas/canonical-dashboard-schema';

// Layer 4: Infrastructure Adapters
export * from './infrastructure/google-service-account-adapter';
export * from './infrastructure/google-drive-changes-adapter';
export * from './infrastructure/vercel-blob-adapter';
export * from './infrastructure/sharp-image-processor-adapter';
export * from './infrastructure/gemini-focal-point-adapter';
export * from './infrastructure/gemini-video-tagger-adapter';
export * from './infrastructure/gemini-pdf-extractor-adapter';
export * from './infrastructure/streaming-spreadsheet-adapter';
export * from './infrastructure/postgres-ingestion-repository';
