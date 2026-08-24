/**
 * @file apps/web/src/components/seo/structured-data.tsx
 * @description Layer 1: Presentation - Schema.org JSON-LD Structured Data Component.
 * Safely embeds schema structured entities into the HTML document head.
 */

import React from "react";
import { generatePlatformJsonLd } from "@/lib/pipelines/seo-metadata-pipeline";

/**
 * StructuredData renders the platform Schema.org JSON-LD script tag.
 */
export function StructuredData(): React.JSX.Element {
  const jsonLd = generatePlatformJsonLd();

  // Step 1: Render script tag containing JSON-LD payload
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
