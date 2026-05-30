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
  layers?: Array<{ id: string; source?: string; type: string; "source-layer"?: string }>;
};

const mapboxStreetsV8SourceLayers = new Set([
  "admin",
  "aeroway",
  "airport_label",
  "building",
  "housenum_label",
  "landuse_overlay",
  "landuse",
  "motorway_junction",
  "natural_label",
  "place_label",
  "poi_label",
  "road",
  "structure",
  "transit_stop_label",
  "water",
  "waterway"
]);

const mapboxCountriesV1SourceLayers = new Set(["country_boundaries"]);

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
    expect(style.sources?.countryBoundaries).toEqual({
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1"
    });
    expect(style.layers?.length).toBeGreaterThan(10);
  });

  it("keeps the Decimal-inspired BRIDS palette in the style contract", () => {
    expect(styleText).toContain("#02040A");
    expect(styleText).toContain("#030712");
    expect(styleText).toContain("#2FC6FF");
    expect(styleText).toContain("#7C3AED");
    expect(styleText).toContain("#A78BFA");
  });

  it("uses the Mapbox Countries v1 source to make USA the bright marketplace landmass", () => {
    const usaLayer = style.layers?.find((layer) => layer.id === "usa-land-cyan");

    expect(usaLayer).toMatchObject({
      source: "countryBoundaries",
      "source-layer": "country_boundaries",
      type: "fill"
    });
    expect(JSON.stringify(usaLayer)).toContain("iso_3166_1_alpha_3");
    expect(JSON.stringify(usaLayer)).toContain("USA");
  });

  it("keeps generic POIs muted so marketplace entries can be the primary POIs", () => {
    expect(style.metadata?.["brids:primaryPoiRule"]).toContain("Marketplace entries");
    expect(style.layers?.map((layer) => layer.id)).toContain("poi-labels-muted");
  });

  it("only references source layers available in each Mapbox vector tileset", () => {
    const vectorLayers = style.layers?.filter((layer) => layer.source && layer["source-layer"]);

    expect(vectorLayers?.length).toBeGreaterThan(0);
    for (const layer of vectorLayers ?? []) {
      if (layer.source === "composite") {
        expect(mapboxStreetsV8SourceLayers.has(layer["source-layer"] ?? "")).toBe(true);
      } else if (layer.source === "countryBoundaries") {
        expect(mapboxCountriesV1SourceLayers.has(layer["source-layer"] ?? "")).toBe(true);
      } else {
        throw new Error(`Unexpected vector source "${layer.source}" in layer "${layer.id}"`);
      }
    }
  });

  it("does not embed Mapbox access tokens in the committed style artifact", () => {
    expect(styleText).not.toMatch(/\bpk\.[A-Za-z0-9._-]+/);
    expect(styleText).not.toMatch(/\bsk\.[A-Za-z0-9._-]+/);
    expect(styleText).not.toContain("MAPBOX_ACCESS_TOKEN");
    expect(styleText).not.toContain("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
  });
});
