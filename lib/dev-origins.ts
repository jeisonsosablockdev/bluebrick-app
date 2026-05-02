import os from "node:os";

function readExtraAllowedDevOrigins(): string[] {
  const raw = process.env.NEXT_DEV_ALLOWED_ORIGINS?.trim() ?? "";
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function listLocalNetworkHosts(): string[] {
  const interfaces = os.networkInterfaces();
  const hosts = new Set<string>();

  for (const values of Object.values(interfaces)) {
    for (const entry of values ?? []) {
      if (entry.internal || entry.family !== "IPv4") {
        continue;
      }

      hosts.add(entry.address);
    }
  }

  return [...hosts];
}

export function getAllowedDevOrigins(): string[] {
  const values = new Set<string>([
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...listLocalNetworkHosts(),
    ...readExtraAllowedDevOrigins()
  ]);

  return [...values];
}
