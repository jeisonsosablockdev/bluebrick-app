import { TemplatePageShell } from "./page-shell";

interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqTemplateProps {
  title: string;
  summary: string;
  entries: FaqEntry[];
}

export function FaqTemplate({ title, summary, entries }: FaqTemplateProps) {
  return (
    <TemplatePageShell
      title={title}
      summary={summary}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" },
        { label: "FAQ", href: "/knowledge/faq" }
      ]}
      tableOfContents={entries.map((entry, index) => ({
        id: `faq-${index + 1}`,
        label: entry.question
      }))}
    >
      <div className="space-y-5">
        {entries.map((entry, index) => (
          <section id={`faq-${index + 1}`} key={entry.question} className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">{entry.question}</h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">{entry.answer}</p>
          </section>
        ))}
      </div>
    </TemplatePageShell>
  );
}
