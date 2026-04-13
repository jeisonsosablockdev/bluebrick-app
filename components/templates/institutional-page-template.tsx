import { TemplatePageShell } from "./page-shell";
import type { TemplateLink } from "./types";

interface InstitutionalPageTemplateProps {
  title: string;
  summary: string;
  sectionTitle: string;
  sectionBody: string;
  breadcrumbs?: TemplateLink[];
}

export function InstitutionalPageTemplate({
  title,
  summary,
  sectionTitle,
  sectionBody,
  breadcrumbs = [
    { label: "Home", href: "/" },
    { label: title, href: `/${title.toLowerCase().replace(/\s+/g, "-")}` }
  ]
}: InstitutionalPageTemplateProps) {
  return (
    <TemplatePageShell title={title} summary={summary} breadcrumbs={breadcrumbs}>
      <section id="overview" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">{sectionTitle}</h2>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">{sectionBody}</p>
      </section>
    </TemplatePageShell>
  );
}
