import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const stylePath = join(process.cwd(), "docs/mapbox/brids-marketplace-decimal-style.json");
const styleText = readFileSync(stylePath, "utf8");
const style = JSON.parse(styleText) as {
  version: number;
  name: string;
  metadata?: Record<string, string>;
  sprite?: string;
  glyphs?: string;
  sources?: Record<string, unknown>;
  layers?: Array<{ id: string; type: string }>;
};

describe("Mapbox style artifact", () => {
  it("defines an importable Mapbox Style v8 document for the BRIDS marketplace", () => {
    expect(style.version).toBe(8);
    expect(style.name).toBe("BRIDS Marketplace Decimal");
    expect(style.glyphs).toBe("mapbox://fonts/mapbox/{fontstack}/{range}.pbf");
    expect(style.sprite).toBe("mapbox://sprites/mapbox/dark-v11");
    expect(style.sources?.composite).toEqual({
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8"
    });
    expect(style.layers?.length).toBeGreaterThan(10);
  });

  it("keeps the Decimal-inspired BRIDS palette in the style contract", () => {
    expect(styleText).toContain("#04060F");
    expect(styleText).toContain("#07111F");
    expect(styleText).toContain("#0E1324");
    expect(styleText).toContain("#2FC6FF");
    expect(styleText).toContain("#7C3AED");
  });

  it("keeps generic POIs muted so marketplace entries can be the primary POIs", () => {
    expect(style.metadata?.["brids:primaryPoiRule"]).toContain("Marketplace entries");
    expect(style.layers?.map((layer) => layer.id)).toContain("poi-labels-muted");
  });

  it("does not embed Mapbox access tokens in the committed style artifact", () => {
    expect(styleText).not.toMatch(/\bpk\.[A-Za-z0-9._-]+/);
    expect(styleText).not.toMatch(/\bsk\.[A-Za-z0-9._-]+/);
    expect(styleText).not.toContain("MAPBOX_ACCESS_TOKEN");
    expect(styleText).not.toContain("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
  });
});
