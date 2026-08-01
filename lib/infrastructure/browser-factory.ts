import { chromium, type Browser, type LaunchOptions } from 'playwright';

export type BrowserEngineMode = 'agent-data' | 'visual-e2e';

export type BrowserTaskPurpose =
  | 'agent-scraping'
  | 'seo-check'
  | 'dom-validation'
  | 'metadata-verify'
  | 'text-extraction'
  | 'visual-qa'
  | 'screenshot'
  | 'synpress-wallet'
  | 'pdf-generation'
  | 'canvas-webgl';

export interface BrowserFactoryConfigOptions {
  customWsUrl?: string;
  headless?: boolean;
}

export interface BrowserFactoryConfig {
  mode: BrowserEngineMode;
  isCdpConnection: boolean;
  wsEndpoint?: string;
  launchOptions?: LaunchOptions;
}

const DEFAULT_LIGHTPANDA_WS = process.env.LIGHTPANDA_WS_URL || 'ws://127.0.0.1:9222';

/**
 * Playbook Decision Function: Determines if a given task purpose should be routed
 * to Lightpanda (ultra-fast, zero-graphics, 90% token reduction) vs. Chromium (visual rendering).
 */
export function shouldUseLightpanda(taskType: BrowserTaskPurpose): boolean {
  switch (taskType) {
    case 'agent-scraping':
    case 'seo-check':
    case 'dom-validation':
    case 'metadata-verify':
    case 'text-extraction':
      return true;
    case 'visual-qa':
    case 'screenshot':
    case 'synpress-wallet':
    case 'pdf-generation':
    case 'canvas-webgl':
    default:
      return false;
  }
}

/**
 * Returns configuration object for Playwright browser instantiation based on engine mode.
 */
export function getBrowserModeConfig(
  mode: BrowserEngineMode,
  options: BrowserFactoryConfigOptions = {}
): BrowserFactoryConfig {
  if (mode === 'agent-data') {
    return {
      mode: 'agent-data',
      isCdpConnection: true,
      wsEndpoint: options.customWsUrl || DEFAULT_LIGHTPANDA_WS,
    };
  }

  return {
    mode: 'visual-e2e',
    isCdpConnection: false,
    launchOptions: {
      headless: options.headless ?? true,
    },
  };
}

/**
 * Instantiates or connects a Playwright Browser instance according to the selected mode.
 */
export async function getBrowserInstance(
  mode: BrowserEngineMode = 'agent-data',
  options: BrowserFactoryConfigOptions = {}
): Promise<Browser> {
  const config = getBrowserModeConfig(mode, options);

  if (config.isCdpConnection && config.wsEndpoint) {
    return await chromium.connectOverCDP(config.wsEndpoint);
  }

  return await chromium.launch(config.launchOptions);
}
