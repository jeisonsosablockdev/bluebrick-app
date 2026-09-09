/**
 * Type declarations for Google Apps Script Webhook Template.
 */
export function scheduleDebouncedSync(fileId?: string): void;
export function sendDebouncedWebhook(): { statusCode: number; body: string };
export function sendImmediateWebhook(fileId?: string): { statusCode: number; body: string };
export function onSheetEditTrigger(e?: unknown): void;
export function onOpen(): void;
export function cancelScheduledTriggers(handlerName: string): void;
export function getScriptConfig(key: string, defaultValue?: string): string;
export function executeWebhookPost(source: string, fileId?: string): { statusCode: number; body: string };
