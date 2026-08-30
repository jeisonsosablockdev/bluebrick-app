---
type: RFC
title: STORY-001-01 Google Service Account Auth & Token Handler
description: RFC Story for Google Service Account OAuth2 JWT Bearer authentication, RS256 token exchange, clock-drift buffer, and singleflight deduplication.
tags: [rfc, story, google-drive, auth, jwt, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-01-service-account-auth.md
---

# STORY-001-01-service-account-auth

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-01`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-01-service-account-auth`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Para acceder a las carpetas compartidas de Google Drive corporativo sin forzar login interactivo de usuario ni sufrir de expiración de sesiones, se requiere un proveedor de tokens OAuth2 autónomo respaldado por una Google Service Account y aserciones JWT firmadas con RS256.
- **Why now:** Es el componente fundacional para toda la ingesta automatizada desde Google Drive.
- **Constraints:**
  - Cero filtración de credenciales al cliente (`import 'server-only'`).
  - Mitigación de *Thundering Herd*: Si múltiples peticiones concurrentes solicitan token simultáneamente, se debe deduplicar a una única llamada HTTP a Google OAuth.
  - Mitigación de deriva de reloj (*Clock Skew*): Descontar 30 segundos al campo `iat` del JWT (`iat = now - 30s`) para evitar rechazos `invalid_grant` por desfase de NTP.
  - Refresco proactivo en memoria: Si el token expira en menos de 300 segundos (5 minutos), solicitar uno nuevo.
  - Sanitización de claves PEM multiformato (manejo de comillas, `\n`, `\r\n` y Base64).
  - Redacción estricta de trazas: Nunca imprimir la clave privada ni la aserción firmada en logs o errores.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/google-auth-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/google-service-account-adapter.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/google-service-account-adapter.test.ts`
  - `apps/web/src/features/ai-ingestion/index.ts`

---

## Proposal
- **Approach summary:** Implementar `IGoogleAuthProviderPort` en la capa de Dominio y `GoogleServiceAccountAdapter` en la capa de Infraestructura con firma nativa `node:crypto` RS256, deduplicación *single-flight*, refresco anticipado y manejo de errores tipados.
- **Technical design:**
  1. **Domain Port (`google-auth-port.ts`):**
     - Interfaz `IGoogleAuthProviderPort` con método `getAccessToken(forceRefresh?: boolean): Promise<AccessTokenPayload>`.
     - Tipo de error de dominio `GoogleAuthDomainError` con códigos deterministas (`MISSING_CREDENTIALS`, `MALFORMED_PRIVATE_KEY`, `INVALID_GRANT`, `RATE_LIMITED`, `OAUTH_NETWORK_ERROR`, `TOKEN_SIGNING_FAILED`).
  2. **Infrastructure Adapter (`google-service-account-adapter.ts`):**
     - `sanitizePrivateKey`: Normalización robusta de PEM multiformato.
     - `inFlightPromise`: Deduplicación concurrente atómica.
     - Creación de aserción JWT con firma RS256 y compensación de -30s en `iat`.
     - Manejo de códigos HTTP de Google con detección de rate limit 429 (`retryable = true`).
- **Alternatives considered:**
  - *Google APIs Client Library oficial (`googleapis`):* Descartada por tamaño de bundle excesivo (>50MB) y dependencias complejas; la firma con `node:crypto` y `fetch` estándar es más rápida, ligera y predecible en serverless.
- **Tradeoffs:**
  - Implementación manual de la firma JWT RS256 a cambio de bundle zero-dependency y rendimiento óptimo.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Thundering Herd Race Condition:* Resuelto mediante `inFlightPromise` mutex deduplicator.
  2. *Clock Skew / NTP Desync:* Resuelto restando 30s al `iat`.
  3. *Unescaped Newline Crash:* Resuelto con `sanitizePrivateKey` soportando `\n`, `\r\n` y Base64.
  4. *Sensitive Token/Key Leak in Logs:* Resuelto con redacción regex de aserciones y mensajes seguros.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Arquitectura en 4 capas estricta con puerto en Dominio, adaptador en Infraestructura con Singleflight y suite TDD adversarial.
- **Changes accepted:** Todas las recomendaciones de los tres subagentes integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado unánimemente por subagentes de Arquitectura, Seguridad y QA.

---

## Status
- **Current status:** `approved`
- **Next action:** Proceder con STORY-001-02 (Canonical Domain Contracts & Zod Validation Gate).
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests (`google-service-account-adapter.test.ts`):**
  1. *MISSING_CREDENTIALS:* Error si falta email o private key.
  2. *MALFORMED_PRIVATE_KEY:* Error si la clave no tiene encabezados PEM.
  3. *PEM Sanitization:* Soporte de `\n`, `\r\n`, comillas y Base64.
  4. *Singleflight Deduplication:* 10 peticiones concurrentes generan exactamente 1 llamada HTTP POST a Google OAuth.
  5. *Cache & Proactive Refresh:* Token reutilizado dentro del TTL; refrescado automáticamente cuando restan <= 300 segundos.
  6. *Clock Skew Backdating:* Verificación de `iat = now - 30` en el payload JWT.
  7. *HTTP Error Handling:* Mapeo de HTTP 400 `invalid_grant`, HTTP 429 `RATE_LIMITED` y `ECONNRESET`.
  8. *Log Redaction:* Comprobación de que `assertion` y claves no aparecen en los mensajes de error.
- **Integration tests:**
  - Verificación de obtención de token contra endpoint mockeado y validación de contrato.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-01`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
