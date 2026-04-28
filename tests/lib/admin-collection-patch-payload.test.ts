import { describe, expect, it } from "vitest";

import {
  AdminCollectionPatchPayloadError,
  isAdminCollectionPatchPayloadError,
  parseAdminCollectionPatchPayload
} from "@/lib/admin/collection-patch-payload";

function expectPayloadError(
  work: () => unknown,
  input: {
    code: string;
    status: number;
  }
): void {
  try {
    work();
    throw new Error("Expected parse to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(AdminCollectionPatchPayloadError);
    expect(isAdminCollectionPatchPayloadError(error)).toBe(true);
    expect((error as AdminCollectionPatchPayloadError).code).toBe(input.code);
    expect((error as AdminCollectionPatchPayloadError).status).toBe(input.status);
  }
}

describe("lib/admin/collection-patch-payload", () => {
  it("parses summary section payloads into repository-ready updates", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "summary",
      data: {
        fractionalInvestmentSummary: "  Stable yield profile. "
      }
    });

    expect(result).toEqual({
      section: "summary",
      fractionalInvestmentSummary: "Stable yield profile."
    });
  });

  it("parses nullable text sections for intentional clears", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "propertyInformation",
      data: {
        propertyInformation: null
      }
    });

    expect(result).toEqual({
      section: "propertyInformation",
      propertyInformation: null
    });
  });

  it("parses gallery payloads with optional property image updates", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "gallery",
      data: {
        galleryImages: [
          {
            id: "gallery-1",
            url: "https://cdn.example.com/gallery-1.jpg",
            title: "Gallery image",
            alt: "Gallery image",
            displayOrder: 1,
            mimeType: "image/jpeg",
            fileName: "gallery-1.jpg",
            fileRefId: "file-gallery-1",
            source: "upload"
          }
        ],
        propertyImages: []
      }
    });

    expect(result.section).toBe("gallery");
    expect(result.galleryImages).toHaveLength(1);
    expect(result.propertyImages).toEqual([]);
  });

  it("parses document payloads with approved document tags only", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "documents",
      data: {
        documents: [
          {
            id: "document-1",
            tag: "legal",
            title: "Operating Agreement",
            label: "Operating Agreement",
            description: "",
            url: "https://cdn.example.com/agreement.pdf",
            displayOrder: 1,
            mimeType: "application/pdf",
            fileName: "agreement.pdf",
            fileRefId: "file-document-1",
            source: "upload"
          }
        ]
      }
    });

    expect(result.documents?.[0]?.tag).toBe("legal");
  });

  it("parses google maps payloads for later dedicated integration slices", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "googleMapsPlace",
      data: {
        googleMapsPlace: {
          placeLabel: "Tower A",
          formattedAddress: "123 Market Street",
          lat: 4.711,
          lng: -74.072,
          googleMapsUrl: "https://maps.google.com/?q=tower-a",
          placeId: "place-1"
        }
      }
    });

    expect(result.googleMapsPlace?.placeId).toBe("place-1");
  });

  it("parses canonical location form payloads into repository-ready updates", () => {
    const result = parseAdminCollectionPatchPayload({
      section: "locationForm",
      data: {
        country: "Colombia",
        stateProvince: "DC",
        city: " Bogota ",
        address: " Calle 72 #10-34 ",
        geoLat: "4.711",
        geoLng: "-74.072"
      }
    });

    expect(result).toEqual({
      section: "locationForm",
      country: "CO",
      stateProvince: "Bogotá D.C.",
      city: "Bogota",
      address: "Calle 72 #10-34",
      geoLat: 4.711,
      geoLng: -74.072
    });
  });

  it("rejects immutable cover fields anywhere in the payload", () => {
    expectPayloadError(
      () => parseAdminCollectionPatchPayload({
        section: "summary",
        data: {
          fractionalInvestmentSummary: "Stable yield.",
          coverImageUrl: "https://cdn.example.com/new-cover.jpg"
        }
      }),
      {
        code: "IMMUTABLE_COVER_FIELD",
        status: 400
      }
    );
  });

  it("rejects unknown sections and malformed data deterministically", () => {
    expectPayloadError(
      () => parseAdminCollectionPatchPayload({
        section: "cover",
        data: {
          title: "New cover"
        }
      }),
      {
        code: "INVALID_COLLECTION_PAYLOAD",
        status: 400
      }
    );

    expectPayloadError(
      () => parseAdminCollectionPatchPayload({
        section: "documents",
        data: {
          documents: [
            {
              id: "document-1",
              tag: "unsupported",
              title: "Document",
              label: "Document",
              description: "",
              url: "not-a-url",
              displayOrder: 1,
              mimeType: null,
              fileName: null,
              fileRefId: null,
              source: "upload"
            }
          ]
        }
      }),
      {
        code: "INVALID_COLLECTION_PAYLOAD",
        status: 400
      }
    );

    expectPayloadError(
      () => parseAdminCollectionPatchPayload({
        section: "locationForm",
        data: {
          country: "Latam",
          city: "Bogota",
          address: "Calle 72 #10-34"
        }
      }),
      {
        code: "INVALID_COLLECTION_PAYLOAD",
        status: 400
      }
    );
  });
});
