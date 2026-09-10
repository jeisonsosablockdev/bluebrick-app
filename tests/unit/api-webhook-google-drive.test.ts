/**
 * ============================================================================
 * @file tests/unit/api-webhook-google-drive.test.ts
 * @description Layer 1 & Security: Unit Test Suite for Google Drive Webhook Route
 * ============================================================================
 * Purpose: Verifies HTTP transport, cryptographic authorization, distributed
 * persistent cooldown handling, handshake acknowledgment, and trailing-edge
 * flags for the /api/webhooks/google-drive Route Handler.
 *
 * Invariants Tested:
 *  - 401 Unauthorized when credentials are missing, malformed, or mismatch.
 *  - 200 OK for Google Drive subscription handshake ('x-goog-resource-state: sync').
 *  - 200 OK for Bearer token, X-Goog-Channel-Token, or x-bluebrick-webhook-secret.
 *  - 200 OK with status: 'cooldown' and pending: true when cooldown_until > NOW().
 *  - 200 OK with status: 'sync_dispatched' when cooldown has elapsed.
 *  - Cooldown bypass when force: true or x-force-sync: true is provided.
 *  - Configurable cooldown window via SYNC_COOLDOWN_MINUTES (default 30m).
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/google-drive/route';
import { getCooldownWindowMinutes } from '@/features/ai-ingestion';

// Mocks for Layer 2 Application Services & Repositories
const mockTriggerSyncAction = vi.fn();
const mockGetSyncState = vi.fn();
const mockAcquireCooldownOrMarkPending = vi.fn();

vi.mock('@/features/ai-ingestion', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/features/ai-ingestion');
  return {
    ...actual,
    triggerSyncAction: (...args: unknown[]) => mockTriggerSyncAction(...args),
    getDashboardSyncState: () => mockGetSyncState(),
    acquireCooldownOrMarkPending: (...args: unknown[]) => mockAcquireCooldownOrMarkPending(...args),
  };
});

describe('BBC-021: Google Drive Webhook Route Handler (@spec BBC-021)', () => {
  const originalEnv = process.env;
  const TEST_SECRET = 'super-secret-drive-webhook-token-32b';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DRIVE_WEBHOOK_SECRET: TEST_SECRET,
      SYNC_COOLDOWN_MINUTES: '30',
    };

    // Default mock: cooldown is idle and acquired successfully
    mockAcquireCooldownOrMarkPending.mockResolvedValue({
      acquired: true,
      pending: false,
      cooldownUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    mockTriggerSyncAction.mockResolvedValue({
      success: true,
      message: 'Dashboard synchronization completed successfully.',
      totalEntitiesSynced: 155,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==========================================================================
  // 1. Cryptographic Authorization Invariants
  // ==========================================================================

  it('[@spec BBC-021:AUTH-01] should return 401 Unauthorized when credentials are completely missing', async () => {
    // Arrange: Request without authorization headers
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
    expect(mockTriggerSyncAction).not.toHaveBeenCalled();
  });

  it('[@spec BBC-021:AUTH-01] should return 401 Unauthorized when secret is incorrect', async () => {
    // Arrange: Request with invalid Bearer token
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret-value',
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
    expect(mockTriggerSyncAction).not.toHaveBeenCalled();
  });

  it('[@spec BBC-021:AUTH-02] should accept request with valid Authorization Bearer token', async () => {
    // Arrange: Request with valid Bearer token
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('dispatched');
  });

  it('[@spec BBC-021:AUTH-03] should accept request with valid X-Goog-Channel-Token header', async () => {
    // Arrange: Google Drive push notification header
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        'x-goog-channel-token': TEST_SECRET,
        'x-goog-resource-state': 'update',
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('[@spec BBC-021:AUTH-04] should accept request with custom x-bluebrick-webhook-secret header from Apps Script', async () => {
    // Arrange: Google Apps Script custom header
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        'x-bluebrick-webhook-secret': TEST_SECRET,
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ==========================================================================
  // 2. Google Subscription Handshake Verification
  // ==========================================================================

  it('[@spec BBC-021:HANDSHAKE-01] should acknowledge sync handshake without dispatching sync service', async () => {
    // Arrange: Handshake request from Google Drive API v3
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        'x-goog-channel-token': TEST_SECRET,
        'x-goog-resource-state': 'sync',
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.message).toContain('handshake verified');
    expect(mockTriggerSyncAction).not.toHaveBeenCalled();
    expect(mockAcquireCooldownOrMarkPending).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // 3. Distributed Persistent Cooldown & Trailing-Edge Invariants
  // ==========================================================================

  it('[@spec BBC-021:COOLDOWN-01] should return status cooldown and pending true when cooldown is active', async () => {
    // Arrange: Active cooldown in persistent state
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    mockAcquireCooldownOrMarkPending.mockResolvedValueOnce({
      acquired: false,
      pending: true,
      cooldownUntil: futureDate,
      message: 'Cooldown active. Trailing-edge pending flag set.',
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe('cooldown');
    expect(body.pending).toBe(true);
    expect(body.cooldownUntil).toBe(futureDate);
    expect(mockTriggerSyncAction).not.toHaveBeenCalled();
  });

  it('[@spec BBC-021:COOLDOWN-02] should dispatch background sync and return status sync_dispatched when cooldown is expired', async () => {
    // Arrange: Cooldown acquired
    const newCooldown = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    mockAcquireCooldownOrMarkPending.mockResolvedValueOnce({
      acquired: true,
      pending: false,
      cooldownUntil: newCooldown,
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('sync_dispatched');
    expect(mockAcquireCooldownOrMarkPending).toHaveBeenCalledTimes(1);
  });

  it('[@spec BBC-021:COOLDOWN-03] should bypass cooldown when x-force-sync header is present', async () => {
    // Arrange: Request with force bypass header
    const req = new NextRequest('http://localhost:3000/api/webhooks/google-drive', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'x-force-sync': 'true',
      },
    });

    // Act
    const res = await POST(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockAcquireCooldownOrMarkPending).toHaveBeenCalledWith(
      expect.objectContaining({ force: true })
    );
  });

  // ==========================================================================
  // 4. Configuration Helpers
  // ==========================================================================

  it('[@spec BBC-021:CONFIG-01] should parse SYNC_COOLDOWN_MINUTES correctly with fallback to 30 min', () => {
    process.env.SYNC_COOLDOWN_MINUTES = '45';
    expect(getCooldownWindowMinutes()).toBe(45);

    process.env.SYNC_COOLDOWN_MINUTES = 'invalid';
    expect(getCooldownWindowMinutes()).toBe(30);

    delete process.env.SYNC_COOLDOWN_MINUTES;
    expect(getCooldownWindowMinutes()).toBe(30);
  });
});
