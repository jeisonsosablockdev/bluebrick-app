import { describe, expect, it } from 'vitest';
import {
  getBrowserModeConfig,
  shouldUseLightpanda,
  type BrowserEngineMode,
  type BrowserTaskPurpose,
} from "../../apps/web/src/lib/infrastructure/browser-factory";

describe('BrowserFactory Infrastructure Unit Tests', () => {
  describe('shouldUseLightpanda decision playbook', () => {
    it('returns true for agent-data and non-visual scraping tasks', () => {
      const lightpandaTasks: BrowserTaskPurpose[] = [
        'agent-scraping',
        'seo-check',
        'dom-validation',
        'metadata-verify',
        'text-extraction',
      ];

      for (const task of lightpandaTasks) {
        expect(shouldUseLightpanda(task)).toBe(true);
      }
    });

    it('returns false for visual, screenshot, and wallet extension tasks', () => {
      const visualTasks: BrowserTaskPurpose[] = [
        'visual-qa',
        'screenshot',
        'synpress-wallet',
        'pdf-generation',
        'canvas-webgl',
      ];

      for (const task of visualTasks) {
        expect(shouldUseLightpanda(task)).toBe(false);
      }
    });
  });

  describe('getBrowserModeConfig configuration generator', () => {
    it('generates CDP WebSocket configuration for agent-data mode', () => {
      const config = getBrowserModeConfig('agent-data', {
        customWsUrl: 'ws://custom-lightpanda:9222',
      });

      expect(config.mode).toBe('agent-data');
      expect(config.isCdpConnection).toBe(true);
      expect(config.wsEndpoint).toBe('ws://custom-lightpanda:9222');
    });

    it('uses default localhost Lightpanda endpoint when custom URL is omitted', () => {
      const config = getBrowserModeConfig('agent-data');

      expect(config.mode).toBe('agent-data');
      expect(config.isCdpConnection).toBe(true);
      expect(config.wsEndpoint).toContain('9222');
    });

    it('generates native launch configuration for visual-e2e mode', () => {
      const config = getBrowserModeConfig('visual-e2e');

      expect(config.mode).toBe('visual-e2e');
      expect(config.isCdpConnection).toBe(false);
      expect(config.launchOptions?.headless).toBe(true);
    });
  });
});
