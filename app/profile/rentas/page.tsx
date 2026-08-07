import type { Metadata } from "next";
import { RentasPageClient } from "../../../apps/web/src/features/staking-distribution";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Rentas y Distribuciones",
  description: "Reclama tus dividendos mensuales distribuidos mediante tesoreria Squads v4.",
  path: "/profile/rentas",
  section: "profile"
});

export default function ProfileRentasPage() {
  return <RentasPageClient />;
}
