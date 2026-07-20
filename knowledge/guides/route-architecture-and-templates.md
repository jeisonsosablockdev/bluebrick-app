---
type: Guide
title: Route Architecture And Templates
description: Route Architecture And Templates - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/route-architecture-and-templates.md
---

# Route Architecture and Reusable Templates

## Objective
Define a stable and scalable public route contract for content pages, with reusable templates and namespace-based collision prevention.

## Canonical Route Namespaces
- Institutional pages: `/{slug}`
- Articles: `/knowledge/articles/{slug}`
- Knowledge base pages: `/knowledge/{slug}`
- FAQ pages: `/knowledge/faq/{slug}`
- Glossary terms: `/knowledge/definitions/{slug}`
- Resources/changelog: `/resources/{slug}`

Central contract implementation:
- `lib/content/routes.ts`

## Slug Namespace Policy
- Slugs can be reused across different document types when namespaces differ.
  - Example: `yield` can exist in article and glossary as long as final canonical paths are different.
- Canonical path collisions are forbidden.
- Collision detection is enforced by route contract tests:
  - `tests/lib/content-routes.test.ts`

## Template System
Reusable template shell:
- `components/templates/page-shell.tsx`

Specialized templates:
- `institutional-page-template.tsx`
- `article-template.tsx`
- `faq-template.tsx`
- `definition-template.tsx`
- `knowledge-hub-template.tsx`
- `resource-page-template.tsx`

## Contextual Navigation Infrastructure
Implemented in template shell:
- Breadcrumbs
- Table of contents anchors
- Related links block
- Previous/next links

These are infrastructure primitives and are data-source agnostic.

## Responsive Baseline
Template routes are validated on these widths:
- `320`
- `375`
- `768`
- `1024`

QA evidence test:
- `e2e/story-010-03-routes.responsive.pw.spec.ts`

Checklist validated:
- No horizontal overflow.
- Primary route links with touch target height `>= 44px`.

## Current Route Surface (Story 03)
- `/about`
- `/platform`
- `/software`
- `/regulatory`
- `/knowledge`
- `/knowledge/articles/[slug]`
- `/knowledge/faq`
- `/knowledge/definitions/[slug]`
- `/resources/[slug]`
