import type { Metadata } from "next";

import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: "Company profile, mission, and operating principles for BRIDS.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <InstitutionalPageTemplate
      title="About"
      summary="Company profile, mission, and operating principles for BRIDS."
      sectionTitle="Institutional profile"
      sectionBody="This route is the canonical institutional namespace for company-level communication. It is intentionally separated from knowledge and regulatory layers to avoid URL drift and keep semantic boundaries stable."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" }
      ]}
    />
  );
}
