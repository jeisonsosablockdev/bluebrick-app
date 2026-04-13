import { TemplatePageShell } from "./page-shell";
import type { TemplateLink } from "./types";

interface ResourcePageTemplateProps {
  title: string;
  summary: string;
  body: string;
  relatedLinks?: TemplateLink[];
}

export function ResourcePageTemplate({
  title,
  summary,
  body,
  relatedLinks
}: ResourcePageTemplateProps) {
  return (
    <TemplatePageShell
      title={title}
      summary={summary}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Resources", href: "/resources" },
        { label: title, href: `/resources/${title.toLowerCase().replace(/\s+/g, "-")}` }
      ]}
      relatedLinks={relatedLinks}
    >
      <p className="text-sm leading-7 text-muted-foreground md:text-base">{body}</p>
    </TemplatePageShell>
  );
}
