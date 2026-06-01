// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string; className?: string; src: string }) => createElement("img", props)
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: () => ({
    t: (copy: { en: string; es: string; pt: string }) => copy.en
  })
}));

import { PropertyDetailMediaSection } from "@/components/marketplace/PropertyDetailMediaSection";
import type { PropertyDetail } from "@/lib/property-service";

const property = {
  id: "brandon-117",
  title: "Fix & Flip Brandon 117",
  galleryImages: [
    {
      id: "gallery-1",
      url: "https://cdn.example.com/gallery.jpg",
      title: "Gallery image 1",
      alt: "Living room",
      displayOrder: 1,
      mimeType: "image/jpeg",
      fileName: "gallery.jpg",
      fileRefId: "file-gallery-1",
      source: "upload"
    }
  ],
  propertyImages: [
    {
      id: "property-1",
      url: "https://cdn.example.com/property.jpg",
      title: "Property image 1",
      alt: "Front elevation",
      displayOrder: 1,
      mimeType: "image/jpeg",
      fileName: "property.jpg",
      fileRefId: "file-property-1",
      source: "upload"
    }
  ]
} as PropertyDetail;

describe("PropertyDetailMediaSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders uploaded marketplace gallery and property images", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailMediaSection, { property }));
    });

    expect(container.textContent).toContain("Project media");
    expect(container.textContent).toContain("Gallery");
    expect(container.textContent).toContain("Property");
    expect(Array.from(container.querySelectorAll("img")).map((image) => image.getAttribute("src"))).toEqual([
      "https://cdn.example.com/gallery.jpg",
      "https://cdn.example.com/property.jpg"
    ]);

    act(() => {
      root.unmount();
    });
  });

  it("renders nothing when the marketplace entry has no media arrays", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailMediaSection, {
        property: {
          ...property,
          galleryImages: [],
          propertyImages: []
        }
      }));
    });

    expect(container.textContent).toBe("");

    act(() => {
      root.unmount();
    });
  });
});
