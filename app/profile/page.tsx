import type { Metadata } from "next";
import { OverviewModule } from "@/components/dashboard/overview-module";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Investor Dashboard",
  description: "General account summary, portfolio KPIs, and overview.",
  path: "/profile",
  section: "profile"
});

export default function ProfileOverviewPage() {
  return <OverviewModule />;
}
