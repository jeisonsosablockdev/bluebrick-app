import Link from "next/link";

import type { TemplatePageShellProps } from "./types";

function BreadcrumbTrail({ breadcrumbs }: { breadcrumbs: TemplatePageShellProps["breadcrumbs"] }) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={`${item.href}-${item.label}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={item.href}>
                  {item.label}
                </Link>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ContextLinks({ relatedLinks }: { relatedLinks: TemplatePageShellProps["relatedLinks"] }) {
  if (!relatedLinks || relatedLinks.length === 0) {
    return null;
  }

  return (
    <section aria-label="Related content" className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Related content</h2>
      <ul className="mt-3 space-y-2">
        {relatedLinks.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link className="inline-flex min-h-11 items-center text-sm text-primary hover:underline" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Toc({ items }: { items: TemplatePageShellProps["tableOfContents"] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Table of contents" className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">On this page</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a className="inline-flex min-h-11 items-center text-sm text-primary hover:underline" href={`#${item.id}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PrevNextLinks({
  previousLink,
  nextLink
}: {
  previousLink: TemplatePageShellProps["previousLink"];
  nextLink: TemplatePageShellProps["nextLink"];
}) {
  if (!previousLink && !nextLink) {
    return null;
  }

  return (
    <nav
      aria-label="Context navigation"
      className="mt-8 grid gap-3 sm:grid-cols-2"
    >
      <div className="rounded-xl border border-border bg-card p-4">
        {previousLink ? (
          <Link className="inline-flex min-h-11 items-center text-sm text-primary hover:underline" href={previousLink.href}>
            Previous: {previousLink.label}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Previous: N/A</span>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 sm:text-right">
        {nextLink ? (
          <Link className="inline-flex min-h-11 items-center text-sm text-primary hover:underline" href={nextLink.href}>
            Next: {nextLink.label}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Next: N/A</span>
        )}
      </div>
    </nav>
  );
}

export function TemplatePageShell({
  title,
  summary,
  breadcrumbs,
  tableOfContents,
  relatedLinks,
  previousLink,
  nextLink,
  children
}: TemplatePageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <BreadcrumbTrail breadcrumbs={breadcrumbs} />

      <header className="mt-4 max-w-3xl">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">{summary}</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 rounded-2xl border border-border bg-card p-5 md:p-7">{children}</article>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Toc items={tableOfContents} />
          <ContextLinks relatedLinks={relatedLinks} />
        </aside>
      </div>

      <PrevNextLinks previousLink={previousLink} nextLink={nextLink} />
    </main>
  );
}
