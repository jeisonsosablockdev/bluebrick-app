#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const cacheDir = path.join(process.cwd(), ".cache-synpress");
const filePath = path.join(cacheDir, "phantom-chrome-latest.crx");
const tempPath = `${filePath}.download`;

const fallbackUrls = [
  process.env.SYNPRESS_PHANTOM_CRX_URL,
  "https://crx-backup.phantom.dev/latest.crx",
  "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=131.0.6778.86&acceptformat=crx2,crx3&x=id%3Dbfnaelmomeimhlpmgjnjophhpkkoljpa%26uc"
].filter(Boolean);

async function downloadFrom(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!response.body) {
    throw new Error("Empty response body");
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempPath));
  fs.renameSync(tempPath, filePath);
}

async function main() {
  if (fs.existsSync(filePath)) {
    console.log(`[synpress] Phantom extension cache already present: ${filePath}`);
    return;
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  const errors = [];
  for (const url of fallbackUrls) {
    try {
      console.log(`[synpress] Downloading Phantom extension from: ${url}`);
      await downloadFrom(url);
      console.log(`[synpress] Phantom extension cached at: ${filePath}`);
      return;
    } catch (error) {
      errors.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  throw new Error(
    `Unable to download Phantom extension. Tried:\n${errors.join("\n")}`
  );
}

main().catch((error) => {
  console.error(`[synpress] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
