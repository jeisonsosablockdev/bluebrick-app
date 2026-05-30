import { beforeEach, describe, expect, it, vi } from "vitest";

type MarketplaceEditableCollectionRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  state_province: string | null;
  postal_code: string | null;
  location_label: string;
  detailed_location: string;
  geo_lat: string | number | null;
  geo_lng: string | number | null;
  created_by: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  gallery_images_json: unknown;
  property_images_json: unknown;
  documents_json: unknown;
  fractional_investment_summary: string | null;
  property_information: string | null;
  google_maps_place_json: unknown;
  updated_by: string | null;
  updated_at: string;
};

let selectedRows: MarketplaceEditableCollectionRow[] = [];
let updatedRow: MarketplaceEditableCollectionRow | null = null;
let locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng"];

const queryMock = vi.fn(async (sql: string, _values?: unknown[]) => {
  if (sql.includes("information_schema.columns")) {
    return {
      rows: locationColumnNames.map((column_name) => ({ column_name })),
      rowCount: locationColumnNames.length
    };
  }

  if (sql.includes("WHERE id = ANY($1::text[])")) {
    return {
      rows: selectedRows,
      rowCount: selectedRows.length
    };
  }

  if (sql.includes("UPDATE marketplace_entries")) {
    return {
      rows: updatedRow ? [updatedRow] : [],
      rowCount: updatedRow ? 1 : 0
    };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import {
  applyCollectionBootstrapPayload,
  getAdminCollectionContentByEntryId,
  listAdminCollectionContentsByEntryIds,
  updateAdminCollectionContent
} from "@/lib/admin/collection-content-repository";
import { resetMarketplaceEntryLocationColumnSupportCache } from "@/lib/admin/marketplace-entry-location-columns";
import type {
  CollectionBootstrapDocumentItem,
  CollectionBootstrapImageItem,
  CollectionBootstrapPayload
} from "@/lib/admin/collection-bootstrap-mapper";

function buildRow(input: Partial<MarketplaceEditableCollectionRow> = {}): MarketplaceEditableCollectionRow {
  return {
    id: "entry-1",
    title: "Central Tower",
    city: "Bogota",
    country: "CO",
    state_province: "Cundinamarca",
    postal_code: "110221",
    location_label: "Financial district",
    detailed_location: "Calle 72 # 10-34, Bogota",
    geo_lat: 4.711,
    geo_lng: -74.072,
    created_by: "Admin111",
    image_url: "https://cdn.example.com/cover.jpg",
    collection_address: "Collection111",
    asset_mint_address: "Candy111",
    gallery_images_json: [
      {
        id: "gallery-1",
        url: "https://cdn.example.com/gallery-1.jpg",
        title: "Gallery image 1",
        alt: "Gallery image 1",
        display_order: 1
      }
    ],
    property_images_json: [],
    documents_json: [],
    fractional_investment_summary: "Stable yield profile.",
    property_information: "Prime mixed-use building.",
    google_maps_place_json: {
      placeLabel: "Tower A",
      formattedAddress: "123 Market Street",
      lat: 4.711,
      lng: -74.072,
      googleMapsUrl: "https://maps.google.com/?q=tower-a",
      placeId: "place-1"
    },
    updated_by: "admin@example.com",
    updated_at: "2026-04-24T10:00:00.000Z",
    ...input
  };
}

function findQueryCall(pattern: string): [string, unknown[]] {
  const match = queryMock.mock.calls.find((call) => String(call[0] ?? "").includes(pattern));
  return [String(match?.[0] ?? ""), (match?.[1] ?? []) as unknown[]];
}

describe("lib/admin/collection-content-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    selectedRows = [];
    updatedRow = null;
    locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng"];
    resetMarketplaceEntryLocationColumnSupportCache();
  });

  it("returns null for blank entry ids without querying", async () => {
    const result = await getAdminCollectionContentByEntryId("   ");

    expect(result).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("maps stored editable content and normalizes legacy documents for reads", async () => {
    selectedRows = [
      buildRow({
        gallery_images_json: [
          {
            id: "gallery-1",
            url: "https://cdn.example.com/gallery-1.jpg",
            title: "Gallery image 1",
            alt: "Gallery image 1",
            displayOrder: 1,
            mimeType: "image/jpeg",
            fileName: "gallery-1.jpg",
            fileRefId: "file-gallery-1",
            source: "upload"
          }
        ],
        documents_json: [
          {
            id: "doc-existing",
            label: "Offering memorandum",
            url: "https://cdn.example.com/offering.pdf"
          }
        ]
      })
    ];

    const result = await listAdminCollectionContentsByEntryIds(["entry-1"]);

    expect(result).toEqual([
      {
        entryId: "entry-1",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        stateProvince: "Cundinamarca",
        postalCode: "110221",
        locationLabel: "Financial district",
        detailedLocation: "Calle 72 # 10-34, Bogota",
        geoLat: 4.711,
        geoLng: -74.072,
        createdBy: "Admin111",
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        galleryImages: [
          {
            id: "gallery-1",
            url: "https://cdn.example.com/gallery-1.jpg",
            title: "Gallery image 1",
            alt: "Gallery image 1",
            displayOrder: 1,
            mimeType: "image/jpeg",
            fileName: "gallery-1.jpg",
            fileRefId: "file-gallery-1",
            source: "upload"
          }
        ],
        propertyImages: [],
        documents: [
          {
            id: "document-doc-existing",
            tag: "other",
            title: "Offering memorandum",
            label: "Offering memorandum",
            description: "",
            url: "https://cdn.example.com/offering.pdf",
            displayOrder: 1,
            mimeType: null,
            fileName: "offering.pdf",
            fileRefId: null,
            source: "marketplace"
          }
        ],
        fractionalInvestmentSummary: "Stable yield profile.",
        propertyInformation: "Prime mixed-use building.",
        googleMapsPlace: {
          placeLabel: "Tower A",
          formattedAddress: "123 Market Street",
          lat: 4.711,
          lng: -74.072,
          googleMapsUrl: "https://maps.google.com/?q=tower-a",
          placeId: "place-1"
        },
        updatedBy: "admin@example.com",
        updatedAt: "2026-04-24T10:00:00.000Z"
      }
    ]);
  });

  it("keeps canonical location fields nullable when storage has no state or coordinates", async () => {
    selectedRows = [
      buildRow({
        state_province: null,
        postal_code: null,
        geo_lat: null,
        geo_lng: null
      })
    ];

    const result = await getAdminCollectionContentByEntryId("entry-1");

    expect(result?.stateProvince).toBeNull();
    expect(result?.postalCode).toBeNull();
    expect(result?.geoLat).toBeNull();
    expect(result?.geoLng).toBeNull();
  });

  it("falls back cleanly when canonical location columns are missing in the database", async () => {
    locationColumnNames = [];
    selectedRows = [
      buildRow({
        state_province: null,
        postal_code: null,
        geo_lat: null,
        geo_lng: null
      })
    ];

    const result = await getAdminCollectionContentByEntryId("entry-1");

    expect(result?.stateProvince).toBeNull();
    expect(result?.postalCode).toBeNull();
    expect(result?.geoLat).toBeNull();
    expect(result?.geoLng).toBeNull();

    const sql = String(queryMock.mock.calls[1]?.[0] ?? "");
    expect(sql).toContain("NULL::text AS state_province");
    expect(sql).toContain("NULL::text AS postal_code");
    expect(sql).toContain("NULL::double precision AS geo_lat");
    expect(sql).toContain("NULL::double precision AS geo_lng");
  });

  it("updates only editable collection fields and never touches the immutable cover", async () => {
    updatedRow = buildRow({
      documents_json: [
        {
          id: "document-brochure",
          tag: "brochure",
          title: "Brochure",
          label: "Brochure",
          description: "",
          url: "https://cdn.example.com/brochure.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "brochure.pdf",
          fileRefId: "file-brochure-1",
          source: "upload"
        }
      ],
      property_information: "Updated property information.",
      updated_by: "Admin222"
    });

    const result = await updateAdminCollectionContent({
      entryId: "entry-1",
      updatedBy: " Admin222 ",
      propertyInformation: "  Updated property information. ",
      documents: [
        {
          id: "document-brochure",
          tag: "brochure",
          title: "Brochure",
          label: "Brochure",
          description: "",
          url: "https://cdn.example.com/brochure.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "brochure.pdf",
          fileRefId: "file-brochure-1",
          source: "upload"
        }
      ]
    });

    expect(result?.propertyInformation).toBe("Updated property information.");
    expect(result?.updatedBy).toBe("Admin222");

    const [sql, values] = findQueryCall("UPDATE marketplace_entries");
    expect(sql).toContain("documents_json = $2::jsonb");
    expect(sql).toContain("property_information = $3");
    expect(sql).toContain("updated_by = $4");
    expect(sql).not.toContain("image_url =");
    expect(values).toEqual([
      "entry-1",
      JSON.stringify([
        {
          id: "document-brochure",
          tag: "brochure",
          title: "Brochure",
          label: "Brochure",
          description: "",
          url: "https://cdn.example.com/brochure.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "brochure.pdf",
          fileRefId: "file-brochure-1",
          source: "upload"
        }
      ]),
      "Updated property information.",
      "Admin222"
    ]);
  });

  it("persists reduced google maps payloads through the repository helper", async () => {
    updatedRow = buildRow({
      google_maps_place_json: {
        placeId: "place-2",
        placeLabel: "Harbor Reserve Phase II",
        formattedAddress: "Carrera 1 # 5-20, Cartagena, CO",
        lat: 10.423,
        lng: -75.551,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Harbor%20Reserve%20Phase%20II"
      },
      updated_by: "Admin333"
    });

    const result = await updateAdminCollectionContent({
      entryId: "entry-1",
      updatedBy: " Admin333 ",
      googleMapsPlace: {
        placeId: "place-2",
        placeLabel: "Harbor Reserve Phase II",
        formattedAddress: "Carrera 1 # 5-20, Cartagena, CO",
        lat: 10.423,
        lng: -75.551,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Harbor%20Reserve%20Phase%20II"
      }
    });

    expect(result?.googleMapsPlace?.placeId).toBe("place-2");

    const [sql, values] = findQueryCall("UPDATE marketplace_entries");
    expect(sql).toContain("google_maps_place_json = $2::jsonb");
    expect(sql).toContain("updated_by = $3");
    expect(values).toEqual([
      "entry-1",
      JSON.stringify({
        placeId: "place-2",
        placeLabel: "Harbor Reserve Phase II",
        formattedAddress: "Carrera 1 # 5-20, Cartagena, CO",
        lat: 10.423,
        lng: -75.551,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Harbor%20Reserve%20Phase%20II"
      }),
      "Admin333"
    ]);
  });

  it("persists canonical location form fields through the repository helper", async () => {
    selectedRows = [buildRow()];
    updatedRow = buildRow({
      city: "Medellin",
      country: "CO",
      state_province: "Antioquia",
      postal_code: "050021",
      detailed_location: "Carrera 43A #1-50",
      geo_lat: 6.25184,
      geo_lng: -75.56359,
      updated_by: "Admin444"
    });

    const result = await updateAdminCollectionContent({
      entryId: "entry-1",
      updatedBy: " Admin444 ",
      city: "Medellin",
      country: "CO",
      stateProvince: "Antioquia",
      postalCode: "050021",
      address: "Carrera 43A #1-50",
      geoLat: 6.25184,
      geoLng: -75.56359
    });

    expect(result?.city).toBe("Medellin");
    expect(result?.stateProvince).toBe("Antioquia");
    expect(result?.geoLat).toBe(6.25184);
    expect(result?.geoLng).toBe(-75.56359);

    const [sql, values] = findQueryCall("UPDATE marketplace_entries");
    expect(sql).toContain("google_maps_place_json = $2::jsonb");
    expect(sql).toContain("city = $3");
    expect(sql).toContain("country = $4");
    expect(sql).toContain("state_province = $5");
    expect(sql).toContain("postal_code = $6");
    expect(sql).toContain("detailed_location = $7");
    expect(sql).toContain("location_label = $8");
    expect(sql).toContain("geo_lat = $9");
    expect(sql).toContain("geo_lng = $10");
    expect(sql).toContain("updated_by = $11");
    expect(values).toEqual([
      "entry-1",
      null,
      "Medellin",
      "CO",
      "Antioquia",
      "050021",
      "Carrera 43A #1-50",
      "Medellin, Antioquia, 050021, CO",
      6.25184,
      -75.56359,
      "Admin444"
    ]);
  });

  it("omits unsupported canonical location columns from UPDATE statements", async () => {
    locationColumnNames = [];
    selectedRows = [buildRow()];
    updatedRow = buildRow({
      city: "Medellin",
      country: "CO",
      updated_by: "Admin444"
    });

    await updateAdminCollectionContent({
      entryId: "entry-1",
      updatedBy: " Admin444 ",
      city: "Medellin",
      country: "CO",
      stateProvince: "Antioquia",
      address: "Carrera 43A #1-50",
      geoLat: 6.25184,
      geoLng: -75.56359
    });

    const [sql] = findQueryCall("UPDATE marketplace_entries");
    expect(sql).toContain("city = $3");
    expect(sql).toContain("country = $4");
    expect(sql).toContain("detailed_location = $5");
    expect(sql).toContain("location_label = $6");
    expect(sql).not.toContain("state_province =");
    expect(sql).not.toContain("geo_lat =");
    expect(sql).not.toContain("geo_lng =");
  });

  it("applies a full bootstrap payload through the repository helper", async () => {
    selectedRows = [buildRow()];
    const payload: CollectionBootstrapPayload = {
      galleryImagesJson: [
        {
          id: "gallery-1",
          url: "https://cdn.example.com/gallery-1.jpg",
          title: "Gallery image 1",
          alt: "Gallery image 1",
          displayOrder: 1,
          mimeType: "image/jpeg",
          fileName: "gallery-1.jpg",
          fileRefId: "file-gallery-1",
          source: "upload"
        }
      ] satisfies CollectionBootstrapImageItem[],
      propertyImagesJson: [],
      documentsJson: [
        {
          id: "document-legal-1",
          tag: "legal",
          title: "Legal document 1",
          label: "Legal document 1",
          description: "",
          url: "https://cdn.example.com/legal-1.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "legal-1.pdf",
          fileRefId: "file-legal-1",
          source: "upload"
        }
      ] satisfies CollectionBootstrapDocumentItem[],
      fractionalInvestmentSummary: "Monthly distributions from stabilized rents.",
      propertyInformation: "A coastal mixed-use project.",
      googleMapsPlaceJson: null,
      country: "CO",
      stateProvince: "Bolivar",
      postalCode: "130001",
      city: "Cartagena",
      address: "Avenida San Martin 7-14",
      geoLat: 10.3997,
      geoLng: -75.5553
    };

    updatedRow = buildRow({
      city: payload.city,
      country: payload.country,
      state_province: payload.stateProvince,
      postal_code: payload.postalCode,
      detailed_location: payload.address,
      geo_lat: payload.geoLat,
      geo_lng: payload.geoLng,
      gallery_images_json: payload.galleryImagesJson,
      property_images_json: payload.propertyImagesJson,
      documents_json: payload.documentsJson,
      fractional_investment_summary: payload.fractionalInvestmentSummary,
      property_information: payload.propertyInformation,
      google_maps_place_json: payload.googleMapsPlaceJson,
      updated_by: "bootstrap-script"
    });

    const result = await applyCollectionBootstrapPayload({
      entryId: "entry-1",
      updatedBy: "bootstrap-script",
      payload
    });

    expect(result?.galleryImages).toHaveLength(1);
    expect(result?.documents[0]?.tag).toBe("legal");
    expect(result?.stateProvince).toBe("Bolivar");
    expect(result?.geoLat).toBe(10.3997);
    expect(result?.geoLng).toBe(-75.5553);

    const [sql, values] = findQueryCall("UPDATE marketplace_entries");
    expect(sql).toContain("gallery_images_json = $2::jsonb");
    expect(sql).toContain("property_images_json = $3::jsonb");
    expect(sql).toContain("documents_json = $4::jsonb");
    expect(sql).toContain("fractional_investment_summary = $5");
    expect(sql).toContain("property_information = $6");
    expect(sql).toContain("google_maps_place_json = $7::jsonb");
    expect(sql).toContain("city = $8");
    expect(sql).toContain("country = $9");
    expect(sql).toContain("state_province = $10");
    expect(sql).toContain("postal_code = $11");
    expect(sql).toContain("detailed_location = $12");
    expect(sql).toContain("location_label = $13");
    expect(sql).toContain("geo_lat = $14");
    expect(sql).toContain("geo_lng = $15");
    expect(sql).toContain("updated_by = $16");
    expect(values[12]).toBe("Cartagena, Bolivar, 130001, CO");
    expect(values[15]).toBe("bootstrap-script");
  });
});
