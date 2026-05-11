export interface TemplateLink {
  label: string;
  href: string;
}

export interface TemplateTocItem {
  id: string;
  label: string;
}

export interface TemplatePageShellProps {
  title: string;
  summary: string;
  breadcrumbs?: TemplateLink[];
  tableOfContents?: TemplateTocItem[];
  relatedLinks?: TemplateLink[];
  previousLink?: TemplateLink;
  nextLink?: TemplateLink;
  children: React.ReactNode;
}
