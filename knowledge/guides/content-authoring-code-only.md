---
type: Guide
title: Content Authoring Code Only
description: Content Authoring Code Only - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/content-authoring-code-only.md
---

# Content Authoring (Code-Only)

## Objective
Define the editorial workflow for EPIC-010 using only Git + PR + CI, without CMS UI.

## Scope
- Applies to content files in:
  - `content/software`
  - `content/knowledge`
  - `content/regulatory`
- Applies to document statuses:
  - `draft`
  - `published`
  - `superseded`

## Frontmatter Contract (mandatory)
Every `.md`/`.mdx` document must include frontmatter with these fields:

- `id`
- `slug`
- `title`
- `summary`
- `status`
- `type`
- `version`
- `updatedAt`
- `tags`
- `canonicalPath`

Optional fields:
- `aliases`
- `supersededBySlug` (mandatory only when `status: superseded`)

Validation is enforced by runtime schema + CI (`npm run validate`).

## Workflow
1. Create a short-lived branch from `develop`.
2. Add or edit content files under `content/*`.
3. Run local checks:
   - `npm run validate`
4. Open PR to `develop`.
5. Use PR preview/staging URL for technical reviewers.
6. Merge only after checks pass.

## Preview Strategy (No CMS UI)
- Preview happens through PR preview/staging deployments.
- Maintainers validate rendering, metadata, and links on preview URL before merge.
- No separate WYSIWYG or non-code editor interface is in scope for EPIC-010.

## Redirect Strategy for Renamed/Superseded Content
Use `lib/content/redirects.ts` rules:

- Alias redirect:
  - Each `aliases[]` entry redirects permanently to `canonicalPath`.
- Superseded redirect:
  - If `status: superseded`, `canonicalPath` redirects permanently to the target document resolved by `supersededBySlug`.

Rules are deterministic and generated from the validated content contracts.

## Quality Gates
A change is rejected if any of these fail:
- Invalid frontmatter schema.
- Duplicate slug in the loaded content corpus.
- Missing superseded target slug resolution.

These checks are covered by `tests/lib/content-contracts.test.ts` and executed via `npm run validate`.
