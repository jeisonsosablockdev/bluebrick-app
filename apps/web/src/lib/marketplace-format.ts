export function formatMarketplaceSoldPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2).replace(/\.00$/, "")}%`;
}
