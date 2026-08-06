import type { Metadata } from "next";
import { getTransparencyMetricsQuery, TransparencyPageClient } from "@/features/transparency-portal";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Transparency & Strategy",
  description: "Transparency dashboard with verifiable public platform metrics and on-chain audit models.",
  path: "/transparency",
  section: "transparency"
});

export default async function TransparencyPage() {
  const { summary, models } = await getTransparencyMetricsQuery();
  return <TransparencyPageClient summary={summary} models={models} />;
}
