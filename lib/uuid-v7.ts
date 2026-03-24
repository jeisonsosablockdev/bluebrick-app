import { randomBytes } from "node:crypto";

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

export function generateUuidV7(nowMs = Date.now()): string {
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new Error("nowMs must be a non-negative finite number.");
  }

  const bytes = randomBytes(16);
  const timestamp = BigInt(Math.floor(nowMs));

  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);

  // UUID version 7 marker.
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // RFC 4122 variant marker.
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => toHex(byte));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
