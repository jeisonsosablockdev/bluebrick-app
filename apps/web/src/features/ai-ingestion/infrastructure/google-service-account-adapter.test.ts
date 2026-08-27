/**
 * ============================================================================
 * Layer 4: Infrastructure Tests - Google Service Account Adapter
 * ============================================================================
 * Test Suite: Adversarial TDD Suite for GoogleServiceAccountAdapter.
 * Validates: RS256 signing, multiformat PEM sanitization, Singleflight deduplication,
 * clock-skew mitigation (-30s iat), proactive 5-minute cache buffer, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from 'node:crypto';
import { GoogleServiceAccountAdapter, ServiceAccountConfig } from './google-service-account-adapter';
import { GoogleAuthDomainError } from '../domain/ports/google-auth-port';

describe('GoogleServiceAccountAdapter - Adversarial TDD Suite', () => {
  let validTestEmail: string;
  let validPrivateKeyPem: string;

  beforeEach(() => {
    vi.useFakeTimers();
    validTestEmail = 'ingestion-sa@bluebrick-dev.iam.gserviceaccount.com';

    // Generate real 2048-bit RSA key pair for cryptographic validity in tests
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    validPrivateKeyPem = keyPair.privateKey;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('1. Configuration & PEM Key Sanitization', () => {
    it('should throw MISSING_CREDENTIALS when clientEmail is empty', () => {
      expect(() => {
        new GoogleServiceAccountAdapter({ clientEmail: '', privateKey: validPrivateKeyPem });
      }).toThrowError(
        expect.objectContaining({ code: 'MISSING_CREDENTIALS' })
      );
    });

    it('should throw MISSING_CREDENTIALS when privateKey is empty', () => {
      expect(() => {
        new GoogleServiceAccountAdapter({ clientEmail: validTestEmail, privateKey: '' });
      }).toThrowError(
        expect.objectContaining({ code: 'MISSING_CREDENTIALS' })
      );
    });

    it('should sanitize double-escaped newlines (\\n) and CRLF in privateKey', async () => {
      const escapedKey = validPrivateKeyPem.replace(/\n/g, '\\n');
      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: escapedKey,
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'mock-token-1', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await adapter.getAccessToken();
      expect(result.token).toBe('mock-token-1');
      expect(result.tokenType).toBe('Bearer');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should strip surrounding quotes from privateKey string', async () => {
      const quotedKey = `"${validPrivateKeyPem.replace(/\n/g, '\\n')}"`;
      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: quotedKey,
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'quoted-token', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await adapter.getAccessToken();
      expect(result.token).toBe('quoted-token');
    });

    it('should decode Base64 encoded PEM privateKey', async () => {
      const base64Key = Buffer.from(validPrivateKeyPem, 'utf-8').toString('base64');
      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: base64Key,
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'b64-token', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await adapter.getAccessToken();
      expect(result.token).toBe('b64-token');
    });

    it('should throw MALFORMED_PRIVATE_KEY if privateKey lacks PEM headers', () => {
      expect(() => {
        new GoogleServiceAccountAdapter({
          clientEmail: validTestEmail,
          privateKey: 'NOT_A_VALID_PEM_HEADER_OR_KEY',
        });
      }).toThrowError(
        expect.objectContaining({ code: 'MALFORMED_PRIVATE_KEY' })
      );
    });
  });

  describe('2. Single-Flight Concurrency & Token Caching', () => {
    it('should deduplicate 10 concurrent requests into exactly 1 HTTP call (Thundering Herd Protection)', async () => {
      let fetchCalls = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        fetchCalls++;
        await new Promise((res) => setTimeout(res, 50));
        return new Response(
          JSON.stringify({ access_token: 'single-flight-token', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      // Launch 10 simultaneous requests
      const promises = Array.from({ length: 10 }, () => adapter.getAccessToken());
      vi.advanceTimersByTime(50);
      const results = await Promise.all(promises);

      expect(fetchCalls).toBe(1);
      results.forEach((res) => {
        expect(res.token).toBe('single-flight-token');
      });
    });

    it('should serve from cache within valid TTL window and refresh when past 5-minute buffer', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'token-initial', expires_in: 3600, token_type: 'Bearer' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'token-refreshed', expires_in: 3600, token_type: 'Bearer' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
        clockSkewBufferSeconds: 300, // 5-minute buffer
      });

      const t1 = await adapter.getAccessToken();
      expect(t1.token).toBe('token-initial');

      // Advance by 3000 seconds (50 mins) -> 600s remaining > 300s buffer -> Should hit memory cache
      vi.advanceTimersByTime(3000 * 1000);
      const t2 = await adapter.getAccessToken();
      expect(t2.token).toBe('token-initial');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Advance 350 seconds more -> 250s remaining < 300s buffer -> Proactive refresh triggered
      vi.advanceTimersByTime(350 * 1000);
      const t3 = await adapter.getAccessToken();
      expect(t3.token).toBe('token-refreshed');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should force refresh when forceRefresh=true even if token is still cached', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'token-1', expires_in: 3600, token_type: 'Bearer' }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: 'token-forced', expires_in: 3600, token_type: 'Bearer' }),
            { status: 200 }
          )
        );

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      const t1 = await adapter.getAccessToken();
      expect(t1.token).toBe('token-1');

      const t2 = await adapter.getAccessToken(true);
      expect(t2.token).toBe('token-forced');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Clock Skew & JWT Payload Claims', () => {
    it('should generate JWT with iat backdated by 30 seconds for clock drift mitigation', async () => {
      let capturedAssertion = '';
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const bodyStr = String(init?.body || '');
        const params = new URLSearchParams(bodyStr);
        capturedAssertion = params.get('assertion') || '';
        return new Response(
          JSON.stringify({ access_token: 'jwt-verified-token', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200 }
        );
      });

      const startTimeMs = 1700000000000;
      vi.setSystemTime(startTimeMs);
      const nowSeconds = Math.floor(startTimeMs / 1000);

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      await adapter.getAccessToken();

      expect(capturedAssertion).toBeTruthy();
      const [, payloadBase64] = capturedAssertion.split('.');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));

      expect(payload.iss).toBe(validTestEmail);
      expect(payload.aud).toBe('https://oauth2.googleapis.com/token');
      expect(payload.scope).toBe('https://www.googleapis.com/auth/drive.readonly');
      expect(payload.iat).toBe(nowSeconds - 30); // Verified -30s clock drift
      expect(payload.exp).toBe(nowSeconds + 3600);
    });
  });

  describe('4. Error Boundaries, Rate Limits & Redaction', () => {
    it('should map HTTP 400 invalid_grant to INVALID_GRANT error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      await expect(adapter.getAccessToken()).rejects.toThrowError(
        expect.objectContaining({ code: 'INVALID_GRANT', retryable: false })
      );
    });

    it('should map HTTP 429 to RATE_LIMITED error with retryable = true', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Too Many Requests', { status: 429 })
      );

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      await expect(adapter.getAccessToken()).rejects.toThrowError(
        expect.objectContaining({ code: 'RATE_LIMITED', retryable: true })
      );
    });

    it('should map network abort / timeout to OAUTH_NETWORK_ERROR with retryable = true', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
        const signal = init?.signal;
        await new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
        return new Response('');
      });

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
        fetchTimeoutMs: 100,
      });

      const promise = adapter.getAccessToken();
      vi.advanceTimersByTime(150);

      await expect(promise).rejects.toThrowError(
        expect.objectContaining({ code: 'OAUTH_NETWORK_ERROR', retryable: true })
      );
    });

    it('should never expose private key material or JWT signature assertion in error messages', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Internal Server Error with leaked query', { status: 500 })
      );

      const adapter = new GoogleServiceAccountAdapter({
        clientEmail: validTestEmail,
        privateKey: validPrivateKeyPem,
      });

      try {
        await adapter.getAccessToken();
        expect.unreachable('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(GoogleAuthDomainError);
        expect(err.message).not.toContain(validPrivateKeyPem);
        expect(err.message).not.toContain('eyJhbGciOiJSUzI1NiIs');
      }
    });
  });
});
