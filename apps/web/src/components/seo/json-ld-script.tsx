import type { JsonLdSchema } from "@/lib/schema";
import { serializeJsonLd, validateJsonLdPayloads } from "@/lib/schema";

interface JsonLdScriptProps {
  schemas: JsonLdSchema[];
  id?: string;
}

export function JsonLdScript({ schemas, id }: JsonLdScriptProps) {
  if (!schemas.length) {
    return null;
  }

  const validated = validateJsonLdPayloads(schemas);

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(validated) }}
    />
  );
}
