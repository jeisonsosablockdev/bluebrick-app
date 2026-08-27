/**
 * ============================================================================
 * Layer 4: Infrastructure - Google Service Account JWT Authenticator
 * ============================================================================
 * Purpose: Provides a resilient, concurrency-safe OAuth2 Bearer token provider
 * for Google Drive API using RS256 JWT assertions and a Google Service Account.
 * Invariants:
 *  - Server-only isolation (never leaked or executed on the client).
 *  - Single-flight promise deduplication to eliminate the Thundering Herd.
 *  - -30s clock drift buffer on 'iat' to prevent Google token rejection.
 *  - 300s (5-minute) proactive refresh window before actual token expiration.
 *  - Sanitization of multiformat PEM keys (escaped \n, quotes, Base64).
 *  - Full redaction of signed assertions and private keys in error traces.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import * as crypto from 'node:crypto';
import {
  IGoogleAuthProviderPort,
  AccessTokenPayload,
  GoogleAuthDomainError,
} from '../domain/ports/google-auth-port';

/**
 * Configuration options for GoogleServiceAccountAdapter.
 */
export interface ServiceAccountConfig {
  /** The client email of the Google Service Account (e.g. name@project.iam.gserviceaccount.com) */
  readonly clientEmail: string;
  /** The RSA private key in PEM or Base64 format */
  readonly privateKey: string;
  /** The OAuth2 token endpoint URL (default: https://oauth2.googleapis.com/token) */
  readonly tokenEndpoint?: string;
  /** Proactive buffer in seconds to refresh before token expiry (default: 300s) */
  readonly clockSkewBufferSeconds?: number;
  /** Timeout budget in milliseconds for the HTTP token request (default: 8000ms) */
  readonly fetchTimeoutMs?: number;
}

/**
 * Sanitizes and normalizes PEM private key strings from environment variables.
 * Handles escaped newlines (\\n), CRLF (\\r\\n), surrounding quotes, and Base64 encoding.
 * 
 * @param rawKey - The unparsed raw private key string
 * @returns Clean PEM-formatted RSA private key
 * @throws {GoogleAuthDomainError} If the key lacks valid PEM boundary headers
 */
export function sanitizePrivateKey(rawKey: string): string {
  // Step 1: Trim and strip surrounding quotes
  let key = (rawKey ?? '').trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Step 2: Unescape literal newline and CRLF sequences
  key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  // Step 3: Handle Base64-encoded PEM strings
  if (
    !key.includes('-----BEGIN PRIVATE KEY-----') &&
    !key.includes('-----BEGIN RSA PRIVATE KEY-----')
  ) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf-8');
      if (
        decoded.includes('-----BEGIN PRIVATE KEY-----') ||
        decoded.includes('-----BEGIN RSA PRIVATE KEY-----')
      ) {
        key = decoded.trim();
      }
    } catch {
      // Fall through to boundary validation check
    }
  }

  // Step 4: Validate PEM boundary integrity
  if (
    !key.includes('-----BEGIN PRIVATE KEY-----') &&
    !key.includes('-----BEGIN RSA PRIVATE KEY-----')
  ) {
    throw new GoogleAuthDomainError(
      'MALFORMED_PRIVATE_KEY',
      'Private key is not a valid PEM RSA private key (missing boundary headers)'
    );
  }

  return key;
}

/**
 * Infrastructure Adapter implementing IGoogleAuthProviderPort.
 */
export class GoogleServiceAccountAdapter implements IGoogleAuthProviderPort {
  private cachedToken: AccessTokenPayload | null = null;
  private inFlightPromise: Promise<AccessTokenPayload> | null = null;
  private readonly config: {
    clientEmail: string;
    privateKey: string;
    tokenEndpoint: string;
    clockSkewBufferSeconds: number;
    fetchTimeoutMs: number;
  };

  /**
   * Constructs a new GoogleServiceAccountAdapter.
   * 
   * @param config - The service account configuration options
   */
  constructor(config: ServiceAccountConfig) {
    // Step 1: Validate required parameters
    if (!config?.clientEmail || typeof config.clientEmail !== 'string' || config.clientEmail.trim() === '') {
      throw new GoogleAuthDomainError(
        'MISSING_CREDENTIALS',
        'Google Service Account client email is required and cannot be empty'
      );
    }

    if (!config?.privateKey || typeof config.privateKey !== 'string' || config.privateKey.trim() === '') {
      throw new GoogleAuthDomainError(
        'MISSING_CREDENTIALS',
        'Google Service Account private key is required and cannot be empty'
      );
    }

    // Step 2: Sanitize the private key
    const sanitizedKey = sanitizePrivateKey(config.privateKey);

    this.config = {
      clientEmail: config.clientEmail.trim(),
      privateKey: sanitizedKey,
      tokenEndpoint: config.tokenEndpoint ?? 'https://oauth2.googleapis.com/token',
      clockSkewBufferSeconds: config.clockSkewBufferSeconds ?? 300, // 5-minute safety margin
      fetchTimeoutMs: config.fetchTimeoutMs ?? 8000,
    };
  }

  /**
   * Obtains a valid OAuth2 Bearer token, leveraging single-flight deduplication
   * and proactive in-memory cache refresh.
   * 
   * @param forceRefresh - If true, bypasses the active cache
   */
  public async getAccessToken(forceRefresh = false): Promise<AccessTokenPayload> {
    const now = Date.now();
    const expiryThresholdMs = this.config.clockSkewBufferSeconds * 1000;

    // Step 1: Check active memory cache if not force refreshing
    if (!forceRefresh && this.cachedToken && (this.cachedToken.expiresAtUtc - expiryThresholdMs > now)) {
      return this.cachedToken;
    }

    // Step 2: Single-flight lock (deduplicate concurrent in-flight requests)
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    // Step 3: Initiate atomic token acquisition
    this.inFlightPromise = (async () => {
      try {
        const token = await this.requestNewOAuthToken();
        this.cachedToken = token;
        return token;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
  }

  /**
   * Invalidate active memory token cache.
   */
  public invalidateCache(): void {
    this.cachedToken = null;
  }

  /**
   * Constructs the signed RS256 JWT assertion and exchanges it for an OAuth2 token.
   */
  private async requestNewOAuthToken(): Promise<AccessTokenPayload> {
    // Step 1: Construct signed RS256 JWT with clock-drift compensation (-30s iat)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: this.config.clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: this.config.tokenEndpoint,
      exp: nowSeconds + 3600,
      iat: nowSeconds - 30, // Clock-drift buffer against time desync
    };

    let signedAssertion: string;
    try {
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signingInput = `${encodedHeader}.${encodedPayload}`;

      const signer = crypto.createSign('RSA-SHA256');
      signer.update(signingInput);
      signer.end();
      const signature = signer.sign(this.config.privateKey, 'base64url');
      signedAssertion = `${signingInput}.${signature}`;
    } catch (err: unknown) {
      throw new GoogleAuthDomainError(
        'TOKEN_SIGNING_FAILED',
        'Failed to generate cryptographic RS256 JWT signature from private key',
        false,
        err
      );
    }

    // Step 2: Execute HTTP POST to Google OAuth endpoint with timeout budget
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeoutMs);

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: signedAssertion,
        }),
        signal: controller.signal,
      });

      // Step 3: Handle HTTP Error Statuses deterministically
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown response body');
        
        if (response.status === 429) {
          throw new GoogleAuthDomainError(
            'RATE_LIMITED',
            'Google OAuth endpoint rate limited the request. Retry with exponential backoff.',
            true
          );
        }

        if (response.status === 400 && errorText.includes('invalid_grant')) {
          throw new GoogleAuthDomainError(
            'INVALID_GRANT',
            'Google OAuth rejected assertion with invalid_grant. Check service account permissions or key validity.',
            false
          );
        }

        const isServerError = response.status >= 500;
        throw new GoogleAuthDomainError(
          'OAUTH_NETWORK_ERROR',
          `Google OAuth endpoint returned HTTP ${response.status}: ${errorText.slice(0, 150)}`,
          isServerError
        );
      }

      // Step 4: Parse token response
      const data = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
        token_type?: string;
      };

      if (!data?.access_token || typeof data.access_token !== 'string') {
        throw new GoogleAuthDomainError(
          'OAUTH_NETWORK_ERROR',
          'Malformed OAuth response: missing access_token in response JSON',
          false
        );
      }

      const expiresInSeconds = typeof data.expires_in === 'number' ? data.expires_in : 3600;

      return {
        token: data.access_token,
        tokenType: 'Bearer',
        expiresAtUtc: Date.now() + expiresInSeconds * 1000,
      };
    } catch (err: unknown) {
      if (err instanceof GoogleAuthDomainError) {
        throw err;
      }

      const isAbort = (err as Error)?.name === 'AbortError';
      const safeMessage = isAbort
        ? `OAuth request timed out after ${this.config.fetchTimeoutMs}ms`
        : ((err as Error)?.message || 'Network connection failed');

      // Redact any possible assertion substring
      const redactedMessage = safeMessage.replace(/assertion=[^&\s]+/g, 'assertion=[REDACTED]');

      throw new GoogleAuthDomainError(
        'OAUTH_NETWORK_ERROR',
        `Network error during Google OAuth token exchange: ${redactedMessage}`,
        true,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
