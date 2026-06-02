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

function renderMediaSection(testProperty: PropertyDetail) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PropertyDetailMediaSection, { property: testProperty }));
  });

  return { container, root };
}

describe("PropertyDetailMediaSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders uploaded marketplace gallery and property images", () => {
    const { container, root } = renderMediaSection(property);

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

  it("renders each media type as an accessible carousel", () => {
    const carouselProperty = {
      ...property,
      propertyImages: Array.from({ length: 5 }, (_, index) => ({
        id: `property-${index + 1}`,
        url: `https://cdn.example.com/property-${index + 1}.jpg`,
        title: `Property image ${index + 1}`,
        alt: `Property view ${index + 1}`,
        displayOrder: index + 1,
        mimeType: "image/jpeg",
        fileName: `property-${index + 1}.jpg`,
        fileRefId: `file-property-${index + 1}`,
        source: "upload"
      }))
    } as PropertyDetail;
    const { container, root } = renderMediaSection(carouselProperty);

    const galleryCarousel = container.querySelector('[data-testid="project-media-carousel-gallery"]');
    const propertyCarousel = container.querySelector('[data-testid="project-media-carousel-property"]');
    expect(galleryCarousel).toBeTruthy();
    expect(propertyCarousel).toBeTruthy();
    expect(galleryCarousel?.querySelector("button[aria-label='Next Gallery image']")).toBeNull();
    expect(propertyCarousel?.textContent).toContain("5 images");
    expect(propertyCarousel?.textContent).toContain("1 / 5");
    expect(propertyCarousel?.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/property-1.jpg");

    const nextButton = propertyCarousel?.querySelector("button[aria-label='Next Property image']");
    expect(nextButton?.className).toContain("min-h-11");

    act(() => {
      nextButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(propertyCarousel?.textContent).toContain("2 / 5");
    expect(propertyCarousel?.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/property-2.jpg");

    act(() => {
      propertyCarousel?.querySelector("button[aria-label='Previous Property image']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(propertyCarousel?.textContent).toContain("1 / 5");
    expect(propertyCarousel?.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/property-1.jpg");

    act(() => {
      root.unmount();
    });
  });

  it("renders nothing when the marketplace entry has no media arrays", () => {
    const { container, root } = renderMediaSection({
      ...property,
      galleryImages: [],
      propertyImages: []
    } as PropertyDetail);

    expect(container.textContent).toBe("");

    act(() => {
      root.unmount();
    });
  });
});
