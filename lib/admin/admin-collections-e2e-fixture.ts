import type { NextRequest } from "next/server";

import type {
  AdminCollectionBlockchainPanel
} from "@/lib/admin/collection-blockchain-panel";
import type {
  AdminCollectionContentRecord
} from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import type { AdminCollectionReadModel } from "@/lib/admin/collections-read-model";

const E2E_ADMIN_COLLECTIONS_FIXTURE_COOKIE = "brids_admin_collections_fixture";
const BRI_101_FIXTURE_KEY = "bri-101";

type AdminCollectionsE2eFixture = {
  collections: AdminCollectionReadModel[];
  detailsByEntryId: Record<
    string,
    {
      ownership: AdminCollectionOwnership;
      content: AdminCollectionContentRecord;
      blockchain: AdminCollectionBlockchainPanel;
    }
  >;
};

function buildBri101Fixture(): AdminCollectionsE2eFixture {
  return {
    collections: [
      {
        entryId: "entry-bri-101-primary",
        title: "Oceanview Fractional Tower",
        coverImageUrl: "/brand/brids-logo.svg",
        collectionAddress: "CollectionOceanview11111111111111111111111111",
        candyMachineAddress: "CandyOceanview111111111111111111111111111",
        updatedAt: "2026-04-26T20:15:00.000Z",
        validationState: "linked",
        editableSections: ["summary", "propertyInformation", "gallery", "documents"]
      },
      {
        entryId: "entry-bri-101-review",
        title: "Harbor Reserve Phase II",
        coverImageUrl: "/brand/brids-mark.svg",
        collectionAddress: "CollectionHarborReserve2222222222222222222222",
        candyMachineAddress: "CandyHarborReserve2222222222222222222222222",
        updatedAt: "2026-04-25T18:00:00.000Z",
        validationState: "missing_snapshot",
        editableSections: []
      }
    ],
    detailsByEntryId: {
      "entry-bri-101-primary": {
        ownership: {
          entryId: "entry-bri-101-primary",
          adminId: "Admin111",
          title: "Oceanview Fractional Tower",
          coverImageUrl: "/brand/brids-logo.svg",
          collectionAddress: "CollectionOceanview11111111111111111111111111",
          candyMachineAddress: "CandyOceanview111111111111111111111111111",
          snapshotId: "snapshot-bri-101-primary",
          snapshotDraftId: "draft-bri-101-primary",
          snapshotVerificationStatus: "verified",
          snapshotMarketplaceHandoffStatus: "completed",
          updatedAt: "2026-04-26T20:15:00.000Z"
        },
        content: {
          entryId: "entry-bri-101-primary",
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
              label: "Legal prospectus",
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
            "Oceanview opens with a deterministic summary so Playwright can verify section-level persistence feedback.",
          propertyInformation:
            "Downtown tower with hospitality and retail mix. Property information stays independently editable from the summary.",
          googleMapsPlace: {
            placeLabel: "Oceanview Fractional Tower",
            formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
            lat: 10.3997,
            lng: -75.5553,
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower",
            placeId: "place-oceanview"
          },
          updatedBy: "Admin111",
          updatedAt: "2026-04-26T20:15:00.000Z"
        },
        blockchain: {
          baseAddresses: {
            collectionAddress: "CollectionOceanview11111111111111111111111111",
            candyMachineAddress: "CandyOceanview111111111111111111111111111",
            assetMintAddress: "AssetMintOceanview111111111111111111111111"
          },
          authorities: {
            thirdPartySigner: "ThirdPartySignerOceanview1111111111111111111",
            freezeDelegate: "FreezeDelegateOceanview1111111111111111111111",
            transferDelegate: "TransferDelegateOceanview1111111111111111111",
            appdataAuthority: "AppdataAuthorityOceanview1111111111111111111"
          },
          guards: {
            startDateIso: "2026-04-26T20:00:00.000Z",
            tokenPaymentMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            tokenPaymentDestination: "ATAOceanviewUsdcDestination11111111111111111"
          },
          appdata: {
            revenueShareBps: 2500,
            yieldBps: 1300,
            yieldMode: "linear",
            lockedAt: 1775031177,
            eligibleFrom: 1775031177,
            earningStartTs: 1775031177,
            distributionEnabled: false,
            economicVersion: "v1",
            lastUpdatedAt: 1775031297,
            updatedBy: "story-006-03-admin-update"
          }
        }
      }
    }
  };
}

function resolveFixtureKey(request: NextRequest): string | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const raw = request.cookies.get(E2E_ADMIN_COLLECTIONS_FIXTURE_COOKIE)?.value?.trim().toLowerCase() ?? "";
  return raw.length > 0 ? raw : null;
}

export function getAdminCollectionsE2eFixture(
  request: NextRequest
): AdminCollectionsE2eFixture | null {
  const fixtureKey = resolveFixtureKey(request);
  if (fixtureKey !== BRI_101_FIXTURE_KEY) {
    return null;
  }

  return buildBri101Fixture();
}
