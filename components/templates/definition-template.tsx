import { TemplatePageShell } from "./page-shell";
import type { TemplateLink } from "./types";

interface DefinitionTemplateProps {
  term: string;
  summary: string;
  definition: string;
  relatedLinks?: TemplateLink[];
}

export function DefinitionTemplate({
  term,
  summary,
  definition,
  relatedLinks
}: DefinitionTemplateProps) {
  return (
    <TemplatePageShell
      title={term}
      summary={summary}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" },
        { label: "Definitions", href: "/knowledge/definitions" },
        { label: term, href: `/knowledge/definitions/${term.toLowerCase().replace(/\s+/g, "-")}` }
      ]}
      relatedLinks={relatedLinks}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Definition</h2>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">{definition}</p>
      </section>
    </TemplatePageShell>
  );
}
