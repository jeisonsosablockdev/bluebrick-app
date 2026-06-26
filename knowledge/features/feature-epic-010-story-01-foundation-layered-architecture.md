# Feature: EPIC-010 STORY-010-01 Foundation and Layered Architecture

## Summary
Establece la base de arquitectura por capas para BRIDS en Next.js, separando explícitamente:
- `software`
- `knowledge`
- `regulatory`

con shared kernel mínimo en `lib/core`.

## Scope Delivered
- Base routes:
  - `/software`
  - `/knowledge`
  - `/regulatory`
- Layer modules:
  - `lib/software`
  - `lib/knowledge`
  - `lib/regulatory`
- Core modules:
  - `lib/core/config`
  - `lib/core/content`
  - `lib/core/seo`
  - `lib/core/ai`
  - `lib/core/observability`
- Content layer folders:
  - `content/software`
  - `content/knowledge`
  - `content/regulatory`

## Ownership Model
- `software`: `platform-core`
- `knowledge`: `content-platform`
- `regulatory`: `compliance-platform`
- shared kernel (`lib/core`): `platform-core`

## Boundary Rules (enforced)
- `lib/software` cannot import from `@knowledge/*` or `@regulatory/*`.
- `lib/knowledge` cannot import from `@software/*` or `@regulatory/*`.
- `lib/regulatory` cannot import from `@software/*` or `@knowledge/*`.
- Cross-layer shared primitives must live in `@core/*`.

## RFC Traceability
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story: `STORY-010-01-foundation-and-layered-architecture`
- Linear: `BRI-51`
