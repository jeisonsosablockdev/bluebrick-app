import { describe, expect, it } from "vitest";

import {
  detectHeaderAliasCollisions,
  ImportJobInputError,
  parseAndSanitizeImportRows,
  validateImportRow
} from "@/lib/admin/import-jobs";

describe("lib/admin/import-jobs", () => {
  it("detects alias collisions in headers", () => {
    const collisions = detectHeaderAliasCollisions(["geoLong", "geoLng", "assetName"]);
    expect(collisions.length).toBeGreaterThan(0);
  });

  it("sanitizes formula injection in parsed rows", () => {
    const rows = parseAndSanitizeImportRows({
      sourceMimeType: "text/csv",
      sourceSizeBytes: 200,
      content: "assetName,slug,internalCode,country,city\n=SUM(A1:A3),tower,t-1,CO,Medellin"
    });

    expect(rows[0]?.assetName).toBe("'=SUM(A1:A3)");
  });

  it("throws when MIME type is not allowed", () => {
    expect(() =>
      parseAndSanitizeImportRows({
        sourceMimeType: "application/json",
        sourceSizeBytes: 100,
        content: "{\"a\":1}"
      })
    ).toThrow(ImportJobInputError);
  });

  it("throws when header aliases collide to the same canonical key", () => {
    expect(() =>
      parseAndSanitizeImportRows({
        sourceMimeType: "text/csv",
        sourceSizeBytes: 120,
        content: "geoLong,geoLng,assetName,slug,internalCode,country,city\n-75.5,-75.6,Tower,tower,TW-1,CO,Medellin"
      })
    ).toThrow(ImportJobInputError);
  });

  it("throws when CSV row count exceeds limit", () => {
    const header = "assetName,slug,internalCode,country,city";
    const rows = new Array(10_001).fill("Tower,tower,TW-1,CO,Medellin");
    const content = `${header}\n${rows.join("\n")}`;

    expect(() =>
      parseAndSanitizeImportRows({
        sourceMimeType: "text/csv",
        sourceSizeBytes: Buffer.byteLength(content, "utf8"),
        content
      })
    ).toThrow(ImportJobInputError);
  });

  it("returns validation errors for missing required fields", () => {
    const errors = validateImportRow({
      assetName: "",
      slug: "",
      internalCode: "",
      country: "",
      city: ""
    });

    expect(errors.some((error) => error.errorCode === "REQUIRED_FIELD")).toBe(true);
  });

  it("validates collection symbol and exit strategy compatibility", () => {
    const errors = validateImportRow({
      assetName: "Tower",
      slug: "tower",
      internalCode: "T-1",
      country: "CO",
      city: "Medellin",
      collectionSymbol: "invalid-symbol",
      buildingExitStrategy: "unknown"
    });

    expect(errors.some((error) => error.errorCode === "COLLECTION_SYMBOL_INVALID")).toBe(true);
    expect(errors.some((error) => error.errorCode === "EXIT_STRATEGY_INVALID")).toBe(true);
  });
});
