/**
 * ============================================================================
 * @file tests/unit/apps-script-webhook.test.ts
 * @description Unit Test Suite for Google Apps Script Trailing-Edge Webhook
 * ============================================================================
 * Purpose: Verifies the behavior of the Google Apps Script integration template
 * (scripts/google-drive/apps-script-webhook.js) under simulated Google Apps Script
 * runtime globals (ScriptApp, UrlFetchApp, PropertiesService, SpreadsheetApp).
 *
 * Invariants Tested:
 *  - Debounce consolidation: Every new edit cancels prior scheduled triggers and
 *    sets a single trigger for 30 minutes in the future.
 *  - Authentication: Outgoing HTTP POST includes x-bluebrick-webhook-secret header.
 *  - Trailing-edge trigger execution: sendDebouncedWebhook dispatches the webhook and cleans up.
 *  - Immediate manual trigger: sendImmediateWebhook dispatches immediately with MANUAL source.
 *  - Missing secret/url handling: Throws informative error when properties are absent.
 *
 * Architecture: External Integration / Client Dispatcher.
 *
 * @spec BBC-021
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('BBC-021: Google Apps Script Trailing-Edge Webhook (@spec BBC-021)', () => {
  let mockProperties: Record<string, string>;
  let mockTriggers: Array<{
    getHandlerFunction: () => string;
    getUniqueId: () => string;
  }>;
  let scheduledTriggers: Array<{ handler: string; delayMs: number }>;
  let fetchCalls: Array<{ url: string; options: any }>;

  // Mock Google Apps Script Globals
  let mockScriptApp: any;
  let mockPropertiesService: any;
  let mockUrlFetchApp: any;
  let mockSpreadsheetApp: any;

  beforeEach(() => {
    mockProperties = {
      BLUEBRICK_WEBHOOK_URL: 'https://bluebrick.investments/api/webhooks/google-drive',
      BLUEBRICK_WEBHOOK_SECRET: 'super-secret-token-12345',
      COOLDOWN_MINUTES: '30',
    };

    mockTriggers = [];
    scheduledTriggers = [];
    fetchCalls = [];

    mockPropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key: string) => mockProperties[key] ?? null,
        setProperty: (key: string, val: string) => {
          mockProperties[key] = val;
        },
        deleteProperty: (key: string) => {
          delete mockProperties[key];
        },
      }),
    };

    mockScriptApp = {
      getProjectTriggers: () => [...mockTriggers],
      deleteTrigger: (trigger: any) => {
        const idx = mockTriggers.findIndex((t) => t.getUniqueId() === trigger.getUniqueId());
        if (idx !== -1) {
          mockTriggers.splice(idx, 1);
        }
      },
      newTrigger: (handlerName: string) => {
        let afterMs = 0;
        const builder = {
          timeBased: () => builder,
          after: (ms: number) => {
            afterMs = ms;
            return builder;
          },
          create: () => {
            const uid = `trigger_${Date.now()}_${Math.random()}`;
            const trigger = {
              getHandlerFunction: () => handlerName,
              getUniqueId: () => uid,
            };
            mockTriggers.push(trigger);
            scheduledTriggers.push({ handler: handlerName, delayMs: afterMs });
            return trigger;
          },
        };
        return builder;
      },
    };

    mockUrlFetchApp = {
      fetch: (url: string, options: any) => {
        fetchCalls.push({ url, options });
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ success: true, message: 'Sync accepted' }),
        };
      },
    };

    mockSpreadsheetApp = {
      getUi: () => ({
        createMenu: () => ({
          addItem: () => ({ addToUi: () => {} }),
        }),
        alert: vi.fn(),
      }),
    };

    // Attach mocks to global scope for testing Google Apps Script module
    (global as any).ScriptApp = mockScriptApp;
    (global as any).PropertiesService = mockPropertiesService;
    (global as any).UrlFetchApp = mockUrlFetchApp;
    (global as any).SpreadsheetApp = mockSpreadsheetApp;
  });

  it('[@spec BBC-021:APPS-SCRIPT-01] scheduleDebouncedSync should cancel existing triggers and register a single trigger for 30 minutes', async () => {
    // Arrange: Pre-populate an existing debounced trigger from an earlier edit
    mockTriggers.push({
      getHandlerFunction: () => 'sendDebouncedWebhook',
      getUniqueId: () => 'existing-trigger-1',
    });
    mockTriggers.push({
      getHandlerFunction: () => 'otherFunction',
      getUniqueId: () => 'other-trigger-2',
    });

    const appsScript = await import('../../scripts/google-drive/apps-script-webhook.js');

    // Act: Simulate first edit
    appsScript.scheduleDebouncedSync('FILE_ABC_01');

    // Assert: Existing sendDebouncedWebhook trigger was deleted; other trigger preserved
    expect(mockTriggers.some((t) => t.getUniqueId() === 'existing-trigger-1')).toBe(false);
    expect(mockTriggers.some((t) => t.getUniqueId() === 'other-trigger-2')).toBe(true);

    // Assert: New trigger created with 30-minute delay (30 * 60 * 1000 = 1800000 ms)
    expect(scheduledTriggers.length).toBe(1);
    expect(scheduledTriggers[0].handler).toBe('sendDebouncedWebhook');
    expect(scheduledTriggers[0].delayMs).toBe(30 * 60 * 1000);
    expect(mockProperties['PENDING_FILE_ID']).toBe('FILE_ABC_01');

    // Act: Rapid subsequent edit 5 seconds later should reset debounce timer
    appsScript.scheduleDebouncedSync('FILE_ABC_01');

    // Assert: Previous trigger cancelled, exactly 1 active sendDebouncedWebhook trigger remains
    const activeDebounceTriggers = mockTriggers.filter((t) => t.getHandlerFunction() === 'sendDebouncedWebhook');
    expect(activeDebounceTriggers.length).toBe(1);
  });

  it('[@spec BBC-021:APPS-SCRIPT-02] sendDebouncedWebhook should dispatch HTTP POST with secret header and clean up state', async () => {
    mockProperties['PENDING_FILE_ID'] = 'FILE_XYZ_99';
    mockTriggers.push({
      getHandlerFunction: () => 'sendDebouncedWebhook',
      getUniqueId: () => 'trigger-to-cleanup',
    });

    const appsScript = await import('../../scripts/google-drive/apps-script-webhook.js');

    // Act
    appsScript.sendDebouncedWebhook();

    // Assert: HTTP POST dispatched with exact authentication header
    expect(fetchCalls.length).toBe(1);
    const call = fetchCalls[0];
    expect(call.url).toBe('https://bluebrick.investments/api/webhooks/google-drive');
    expect(call.options.method).toBe('post');
    expect(call.options.headers['x-bluebrick-webhook-secret']).toBe('super-secret-token-12345');
    expect(call.options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(call.options.payload);
    expect(body.source).toBe('GOOGLE_APPS_SCRIPT_TRAILING_EDGE');
    expect(body.fileId).toBe('FILE_XYZ_99');

    // Assert: Cleanup completed
    expect(mockProperties['PENDING_FILE_ID']).toBeUndefined();
    expect(mockTriggers.some((t) => t.getUniqueId() === 'trigger-to-cleanup')).toBe(false);
  });

  it('[@spec BBC-021:APPS-SCRIPT-03] sendImmediateWebhook should dispatch immediately with MANUAL source', async () => {
    const appsScript = await import('../../scripts/google-drive/apps-script-webhook.js');

    // Act
    appsScript.sendImmediateWebhook('FILE_MANUAL_123');

    // Assert
    expect(fetchCalls.length).toBe(1);
    const call = fetchCalls[0];
    expect(call.options.headers['x-bluebrick-webhook-secret']).toBe('super-secret-token-12345');
    const body = JSON.parse(call.options.payload);
    expect(body.source).toBe('GOOGLE_APPS_SCRIPT_MANUAL');
    expect(body.fileId).toBe('FILE_MANUAL_123');
  });

  it('[@spec BBC-021:APPS-SCRIPT-04] should throw error if webhook URL or secret is missing', async () => {
    delete mockProperties['BLUEBRICK_WEBHOOK_SECRET'];
    const appsScript = await import('../../scripts/google-drive/apps-script-webhook.js');

    expect(() => appsScript.sendImmediateWebhook('FILE_ERR')).toThrow(
      /BLUEBRICK_WEBHOOK_SECRET is not configured/
    );
  });
});
