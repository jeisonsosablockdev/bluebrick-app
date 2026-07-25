---
type: Feature Spec
title: Feature EPIC- 010 STORY- 02 Content As Code Editorial Contracts
description: Feature EPIC- 010 STORY- 02 Content As Code Editorial Contracts - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-010/feature-epic-010-story-02-content-as-code-editorial-contracts.md
---

# Feature: EPIC-010 STORY-010-02 Content as Code and Editorial Contracts

## Summary
Implementa el contrato editorial base para contenido versionado en código (MD/MDX), incluyendo:
- frontmatter obligatorio
- validación tipada
- loader único de contenido
- estrategia de redirects (`aliases` + `superseded`)

## Scope Delivered
- Content contract types:
  - `lib/content/types.ts`
- Runtime schema validation:
  - `lib/content/schema.ts`
- Frontmatter parser:
  - `lib/content/frontmatter.ts`
- Content loader:
  - `lib/content/loader.ts`
- Redirect rules builder:
  - `lib/content/redirects.ts`
- JSON schema reference:
  - `schemas/content-frontmatter.schema.json`
- Unit tests:
  - `tests/lib/content-contracts.test.ts`
- Code-only authoring guide:
  - `knowledge/guides/content-authoring-code-only.md`

## CI/Validation Gate
- `package.json` now runs content contract checks inside `npm run validate` through:
  - `npm run validate:content`

This blocks invalid content contracts before merge.

## Editorial Model
- Document statuses:
  - `draft`
  - `published`
  - `superseded`
- Document types:
  - `institutional-page`
  - `article`
  - `knowledge-base`
  - `faq`
  - `glossary-term`
  - `changelog`

## Redirect Policy
- `aliases[]` create permanent redirects to `canonicalPath`.
- `superseded` documents create permanent redirects from old canonical URL to replacement slug target.

## RFC Traceability
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story: `STORY-010-02-content-as-code-and-editorial-contracts`
- Linear: `BRI-52`
