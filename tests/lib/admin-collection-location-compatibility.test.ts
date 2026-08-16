import { describe, expect, it } from "vitest";

import { normalizeAdminCollectionLocationForm } from "@/lib/admin/admin-collection-location-form";
import { parseAdminCollectionPatchPayload } from "@/lib/admin/collection-patch-payload";
import { mapCollectionBootstrapFromSnapshot } from "@/lib/admin/collection-bootstrap-mapper";

describe("canonical location contract compatibility", () => {
  it("converges create, bootstrap, and PATCH flows onto the same canonical shape", () => {
    const createShape = normalizeAdminCollectionLocationForm({
      country: "Colombia",
      stateProvince: "ANT",
      city: "Medellin",
      address: "Carrera 43A #1-50",
      geoLat: "6.25184",
      geoLng: "-75.56359"
    });

    const bootstrapResult = mapCollectionBootstrapFromSnapshot({
      formSnapshot: {
        country: "Colombia",
        state: "ANT",
        city: "Medellin",
        address: "Carrera 43A #1-50",
        geoLat: "6.25184",
        geoLng: "-75.56359"
      },
      uploadedFiles: [],
      existingDocumentsJson: []
    });

    const patchResult = parseAdminCollectionPatchPayload({
      section: "locationForm",
      data: {
        country: "Colombia",
        stateProvince: "ANT",
        city: "Medellin",
        address: "Carrera 43A #1-50",
        geoLat: "6.25184",
        geoLng: "-75.56359"
      }
    });

    expect(createShape).toEqual({
      country: "CO",
      stateProvince: "Antioquia",
      city: "Medellin",
      address: "Carrera 43A #1-50",
      postalCode: null,
      geoLat: 6.25184,
      geoLng: -75.56359
    });
    expect(bootstrapResult.payload).toMatchObject(createShape);
    expect(patchResult).toEqual({
      section: "locationForm",
      ...createShape
    });
  });
});
