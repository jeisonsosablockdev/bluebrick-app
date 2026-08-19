export function readBoundedIntegerEnv(input: {
  env?: Record<string, string | undefined>;
  name: string;
  fallback: number;
  min: number;
  max: number;
}): number {
  const raw = input.env?.[input.name]?.trim();
  if (!raw) {
    return input.fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < input.min) {
    return input.fallback;
  }

  return Math.min(parsed, input.max);
}
