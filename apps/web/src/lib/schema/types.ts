export interface SchemaBase {
  "@context": "https://schema.org";
  "@type": string;
}

export interface OrganizationSchema extends SchemaBase {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

export interface WebSiteSchema extends SchemaBase {
  "@type": "WebSite";
  name: string;
  url: string;
  publisher?: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

export interface WebPageSchema extends SchemaBase {
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
}

export interface ArticleSchema extends SchemaBase {
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  author: {
    "@type": "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

export interface TechArticleSchema extends Omit<ArticleSchema, "@type"> {
  "@type": "TechArticle";
  proficiencyLevel?: "beginner" | "intermediate" | "advanced";
}

export interface FaqQuestionSchema {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

export interface FAQPageSchema extends SchemaBase {
  "@type": "FAQPage";
  name: string;
  url: string;
  mainEntity: FaqQuestionSchema[];
}

export interface DefinedTermSchema extends SchemaBase {
  "@type": "DefinedTerm";
  name: string;
  description: string;
  url: string;
  inDefinedTermSet?: string;
}

export interface BreadcrumbListItemSchema {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema extends SchemaBase {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbListItemSchema[];
}

export type JsonLdSchema =
  | OrganizationSchema
  | WebSiteSchema
  | WebPageSchema
  | ArticleSchema
  | TechArticleSchema
  | FAQPageSchema
  | DefinedTermSchema
  | BreadcrumbListSchema;

export interface SchemaBreadcrumbItem {
  name: string;
  item: string;
}

export type SchemaKind = JsonLdSchema["@type"];
