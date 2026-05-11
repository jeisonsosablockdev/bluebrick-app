import type { Metadata } from "next";

import { ForbiddenView } from "@/components/forbidden-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Forbidden",
  description: "Access restricted page.",
  path: "/403",
  section: "system",
  explicitNoIndex: true
});

export default function ForbiddenPage() {
  return <ForbiddenView />;
}
