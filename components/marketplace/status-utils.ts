import type { ListingStatus } from "@/lib/property-service";

export function listingStatusLabel(status: ListingStatus): string {
  if (status === "active") {
    return "Activo";
  }

  if (status === "funding") {
    return "Funding";
  }

  return "Sold out";
}

export function listingStatusClasses(status: ListingStatus): string {
  if (status === "active") {
    return "bg-emerald-500/15 text-emerald-200";
  }

  if (status === "funding") {
    return "bg-amber-500/15 text-amber-200";
  }

  return "bg-slate-500/20 text-slate-200";
}
