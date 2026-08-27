/**
 * ============================================================================
 * Feature: AI-Augmented Ingestion Pipeline & Schema Alignment
 * ============================================================================
 * Public Barrel Export following 4-Layer Feature-Driven Design.
 */

// Layer 3: Domain Ports, Types & Schemas
export * from './domain/ports/google-auth-port';
export * from './domain/schemas/canonical-client-schema';
export * from './domain/schemas/canonical-project-schema';
export * from './domain/schemas/canonical-media-schema';
export * from './domain/schemas/canonical-sync-record-schema';

// Layer 4: Infrastructure Adapters
export * from './infrastructure/google-service-account-adapter';
