export const PERFORMANCE_BASELINE = {
  webVitals: {
    lcpMs: 2500,
    cls: 0.1,
    inpMs: 200
  },
  build: {
    maxBuildSeconds: 300
  },
  caching: {
    contentSMaxAgeSeconds: 300,
    contentStaleWhileRevalidateSeconds: 600
  }
} as const;

export type RuntimePerformanceSnapshot = {
  rssBytes: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
};

export function readRuntimePerformanceSnapshot(): RuntimePerformanceSnapshot {
  const usage = process.memoryUsage();

  return {
    rssBytes: usage.rss,
    heapUsedBytes: usage.heapUsed,
    heapTotalBytes: usage.heapTotal
  };
}
