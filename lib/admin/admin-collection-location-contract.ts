import type { CollectionBootstrapGoogleMapsPlace } from "@/lib/admin/collection-bootstrap-mapper";
import {
  buildAdminCollectionGoogleMapsEmbedUrl,
  buildAdminCollectionGoogleMapsUrl,
  buildAdminCollectionLocationLabel,
  buildAdminCollectionLocationQuery
} from "@/lib/admin/admin-collection-location-view";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

export type AdminCollectionLocationMapsContext = {
  city: string;
  country: string;
  locationLabel: string;
  detailedLocation: string;
  currentLabel: string | null;
  currentQuery: string | null;
};

export type AdminCollectionLocationMapsSection = {
  context: AdminCollectionLocationMapsContext;
  googleMapsPlace: CollectionBootstrapGoogleMapsPlace | null;
  outboundUrl: string | null;
  embedUrl: string | null;
};

export function buildAdminCollectionLocationMapsSection(
  content: AdminCollectionContentRecord
): AdminCollectionLocationMapsSection {
  return {
    context: {
      city: content.city,
      country: content.country,
      locationLabel: content.locationLabel,
      detailedLocation: content.detailedLocation,
      currentLabel: buildAdminCollectionLocationLabel(content),
      currentQuery: buildAdminCollectionLocationQuery(content)
    },
    googleMapsPlace: content.googleMapsPlace,
    outboundUrl: buildAdminCollectionGoogleMapsUrl(content),
    embedUrl: buildAdminCollectionGoogleMapsEmbedUrl(content)
  };
}
