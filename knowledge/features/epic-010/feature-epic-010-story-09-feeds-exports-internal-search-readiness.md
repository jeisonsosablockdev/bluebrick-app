---
type: Feature Spec
title: Feature EPIC- 010 STORY- 09 Feeds Exports Internal Search Readiness
description: Feature EPIC- 010 STORY- 09 Feeds Exports Internal Search Readiness - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-010-story-09-feeds-exports-internal-search-readiness.md
---

# Feature Note: EPIC-010 STORY-09 Feeds, Exports, and Internal Search Readiness

## Scope
- Added distribution endpoints under `app/feeds/*`:
  - `/feeds/rss`
  - `/feeds/json`
  - `/feeds/recent`
  - `/feeds/export`
  - `/feeds/search-index`
- Added search/feed service layer under `lib/search`.
- Added public feed manifest under `public/feeds/manifest.json`.

## What Changed
- Introduced a centralized published-only content loader for feed/export/search outputs.
- Added versioned contracts for:
  - recent feed payload,
  - structured knowledge export payload,
  - local search index artifact,
  - JSON Feed 1.1 output.
- Implemented RSS 2.0 and JSON Feed generation from the same normalized pipeline source.
- Exposed machine-discoverable feed/export endpoints and updated `llms.txt` references.

## Validation
- Added/updated tests:
  - `tests/lib/feed-search-contracts.test.ts`
  - `tests/api/feeds-endpoints.test.ts`
- Added validation gate:
  - `npm run validate:feeds`
- Full validation expected for PR:
  - `npm run validate`

## Risk and Mitigation
- Risk: leaking non-public content into feeds/index.
  - Mitigation: explicit `status === "published"` filter in shared loader path before serialization.
- Risk: divergent payload shapes per endpoint.
  - Mitigation: schema-backed contracts under `lib/search/contracts.ts`.
