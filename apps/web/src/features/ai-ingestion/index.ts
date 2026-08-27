/**
 * ============================================================================
 * Feature: AI-Augmented Ingestion Pipeline & Schema Alignment
 * ============================================================================
 * Public Barrel Export following 4-Layer Feature-Driven Design.
 */

// Layer 3: Domain Ports & Types
export * from './domain/ports/google-auth-port';

// Layer 4: Infrastructure Adapters
export * from './infrastructure/google-service-account-adapter';
