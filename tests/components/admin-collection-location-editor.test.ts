// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCollectionLocationEditor } from "@/features/admin/presentation/admin-collection-location-editor";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderEditor(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(AdminCollectionLocationEditor, {
      entryId: "entry-1",
      googleMapsEmbedApiKey: "test-google-maps-key",
      locale: "en",
      content: {
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
        galleryImages: [],
        propertyImages: [],
        documents: [],
        fractionalInvestmentSummary: null,
        propertyInformation: null,
        googleMapsPlace: null,
        updatedBy: "Admin111",
        updatedAt: "2026-04-26T02:00:00.000Z"
      }
    }));
  });

  return { container, root };
}

describe("features/admin/presentation/admin-collection-location-editor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the autocomplete search field and local-selection guidance", () => {
    const { container, root } = renderEditor();

    expect(container.textContent).toContain("Search address");
    expect(container.textContent).toContain("Select an address to preview the reduced Maps payload before saving.");
    expect(container.textContent).toContain("Open in Google Maps");
    expect(container.textContent).toContain("Save location");
    expect(container.textContent).toContain("Cancel");

    act(() => {
      root.unmount();
    });
  });
});
