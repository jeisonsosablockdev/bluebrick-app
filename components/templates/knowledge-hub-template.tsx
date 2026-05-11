import Link from "next/link";

import { TemplatePageShell } from "./page-shell";
import type { TemplateLink } from "./types";

interface KnowledgeHubTemplateProps {
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    description: string;
    links: TemplateLink[];
  }>;
}

export function KnowledgeHubTemplate({ title, summary, sections }: KnowledgeHubTemplateProps) {
  return (
    <TemplatePageShell
      title={title}
      summary={summary}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" }
      ]}
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{section.title}</h2>
            <p className="text-sm text-muted-foreground md:text-base">{section.description}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {section.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    className="flex min-h-11 items-center rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-accent hover:underline"
                    data-testid="knowledge-hub-link"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </TemplatePageShell>
  );
}
