import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID,
  enableAdminCollectionsFixture
} from "./helpers/admin-collections-fixture";
import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const PRIMARY_ENTRY_ID = ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID;

function buildPatchedContent() {
  return {
    entryId: PRIMARY_ENTRY_ID,
    title: "Oceanview Fractional Tower",
    city: "Cartagena",
    country: "CO",
    locationLabel: "Bocagrande Waterfront",
    detailedLocation: "Avenida San Martin 7-14, Bocagrande",
    createdBy: "Admin111",
    coverImageUrl: "/brand/brids-logo.svg",
    collectionAddress: "CollectionOceanview11111111111111111111111111",
    candyMachineAddress: "CandyOceanview111111111111111111111111111",
    galleryImages: [
      {
        id: "gallery-1",
        url: "/brand/brids-logo.svg",
        title: "Atrium render",
        alt: "Atrium render",
        displayOrder: 1,
        mimeType: "image/jpeg",
        fileName: "oceanview-gallery-1.jpg",
        fileRefId: "file-gallery-1",
        source: "marketplace"
      }
    ],
    propertyImages: [
      {
        id: "property-1",
        url: "/brand/brids-mark.svg",
        title: "Lobby photography",
        alt: "Lobby photography",
        displayOrder: 1,
        mimeType: "image/jpeg",
        fileName: "oceanview-property-1.jpg",
        fileRefId: "file-property-1",
        source: "marketplace"
      }
    ],
    documents: [
      {
        id: "document-1",
        tag: "legal",
        title: "Legal prospectus",
        label: "Legal prospectus - reviewed",
        description: "Primary investor disclosure package.",
        url: "https://cdn.example.com/oceanview-legal-prospectus.pdf",
        displayOrder: 1,
        mimeType: "application/pdf",
        fileName: "oceanview-legal-prospectus.pdf",
        fileRefId: "file-document-1",
        source: "upload"
      }
    ],
    fractionalInvestmentSummary:
      "Oceanview summary saved through the Playwright admin collections flow.",
    propertyInformation:
      "Updated property information saved independently from summary and documents.",
    googleMapsPlace: {
      placeLabel: "Oceanview Fractional Tower",
      formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
      lat: 10.3997,
      lng: -75.5553,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower",
      placeId: "place-oceanview"
    },
    updatedBy: "Admin111",
    updatedAt: "2026-04-26T20:45:00.000Z"
  };
}

test.describe("admin collections primary flow", () => {
  test("covers index access, detail entry, allowed edits, and read-only cover behavior", async ({
    page
  }) => {
    const availability = getWalletAvailability("admin");
    test.skip(!availability.exists, availability.reason);

    const me = await authenticateWithWalletRole(page, "admin");
    expect(me.authenticated).toBe(true);
    expect(me.role).toBe("admin");

    await enableAdminCollectionsFixture(page);

    const patchedContent = buildPatchedContent();
    const patchSections: string[] = [];

    await page.route(`**/api/admin/collections/${PRIMARY_ENTRY_ID}`, async (route) => {
      const request = route.request();

      if (request.method() !== "PATCH") {
        await route.continue();
        return;
      }

      const payload = request.postDataJSON() as {
        section?: string;
      };
      patchSections.push(payload.section ?? "unknown");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            section: payload.section,
            content: patchedContent
          }
        })
      });
    });

    await page.goto("/admin/collections");

    await expect(page.locator("h1")).toHaveText(/Collections/i);
    await expect(page.getByText("Oceanview Fractional Tower")).toBeVisible();
    await expect(page.getByText("Harbor Reserve Phase II")).toBeVisible();
    await expect(page.getByRole("button", { name: /Needs review/i })).toBeDisabled();

    await page.getByRole("link", { name: /Manage project/i }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/collections/${PRIMARY_ENTRY_ID}$`));
    await expect(page.getByText(/Managed from Candy Machine/i)).toBeVisible();
    await expect(page.getByText(/Read-only cover/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Save cover/i })).toHaveCount(0);

    const summaryField = page.locator("#collection-summary-editor");
    await summaryField.fill("Oceanview summary saved through the Playwright admin collections flow.");
    await page.getByRole("button", { name: /Save summary/i }).click();
    await expect(
      page.getByText("Summary saved. The latest persisted value is already reflected below.")
    ).toBeVisible();

    const propertyField = page.locator("#collection-property-information-editor");
    await propertyField.fill("Updated property information saved independently from summary and documents.");
    await page.getByRole("button", { name: /Save property information/i }).click();
    await expect(
      page.getByText("Property information saved. The latest persisted text is already reflected below.")
    ).toBeVisible();

    await page.getByLabel(/Label/i).fill("Legal prospectus - reviewed");
    await page.getByRole("button", { name: /Save documents/i }).click();
    await expect(
      page.getByText("Documents saved. The latest persisted document list is already reflected below.")
    ).toBeVisible();

    expect(patchSections).toEqual(["summary", "propertyInformation", "documents"]);
  });
});
