import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AdminCollectionGalleryShell,
  buildAdminCollectionGalleryGroups
} from "@/features/admin/presentation/admin-collection-gallery-shell";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

const content: AdminCollectionContentRecord = {
  entryId: "entry-1",
  title: "Ocean View Residences",
  city: "Cartagena",
  country: "CO",
  stateProvince: "Bolivar",
  postalCode: "130001",
  locationLabel: "Bocagrande Waterfront",
  detailedLocation: "Avenida San Martin 7-14, Bocagrande",
  geoLat: 10.3997,
  geoLng: -75.5553,
  createdBy: "Admin111",
  coverImageUrl: "https://cdn.example.com/ocean.jpg",
  collectionAddress: "Collection111",
  candyMachineAddress: "Candy111",
  galleryImages: [
    {
      id: "gallery-1",
      url: "https://cdn.example.com/gallery-1.jpg",
      title: "Ocean lounge",
      alt: "Ocean lounge",
      displayOrder: 1,
      mimeType: "image/jpeg",
      fileName: "gallery-1.jpg",
      fileRefId: "file-gallery-1",
      source: "marketplace"
    }
  ],
  propertyImages: [
    {
      id: "property-1",
      url: "https://cdn.example.com/property-1.jpg",
      title: "Facade",
      alt: "Facade",
      displayOrder: 1,
      mimeType: "image/jpeg",
      fileName: "property-1.jpg",
      fileRefId: "file-property-1",
      source: "snapshot"
    }
  ],
  documents: [],
  fractionalInvestmentSummary: "Stable income.",
  propertyInformation: "Prime oceanfront location.",
  googleMapsPlace: null,
  updatedBy: "Admin111",
  updatedAt: "2026-04-26T02:00:00.000Z"
};

describe("features/admin/presentation/admin-collection-gallery-shell", () => {
  it("keeps gallery and property groups distinct", () => {
    const groups = buildAdminCollectionGalleryGroups(content);

    expect(groups).toEqual([
      {
        key: "gallery",
        items: content.galleryImages,
        count: 1
      },
      {
        key: "property",
        items: content.propertyImages,
        count: 1
      }
    ]);
  });

  it("renders the gallery shell with separate tabs and staged media actions", () => {
    const html = renderToStaticMarkup(
      createElement(AdminCollectionGalleryShell, {
        content,
        locale: "en"
      })
    );

    expect(html).toContain("Media reference");
    expect(html).toContain("Marketplace gallery");
    expect(html).toContain("Property imagery");
    expect(html).toContain("Add gallery image");
    expect(html).toContain("Replace gallery image");
    expect(html).toContain("Delete gallery image");
    expect(html).toContain("Ocean lounge");
  });
});
