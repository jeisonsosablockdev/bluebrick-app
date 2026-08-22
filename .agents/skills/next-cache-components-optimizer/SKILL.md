---
name: next-cache-components-optimizer
description: >
  Drive a Next.js route to instant navigation by setting up an agentic loop,
  under Cache Components / PPR, on initial load (hard navigation) and
  client-side navigation (soft navigation). Encode the goal as a failing
  @next/playwright instant() e2e and work it to green, one verified route at a
  time; the shipped test then guards against regression. Use when asked to make
  a route's navigation instant (its static shell commits immediately), fix a
  route whose static shell isn't prerendered/served/prefetched, grow a route's
  static shell or fix its slow first paint, diagnose which Suspense boundary
  keeps a route out of its static shell, or write the instant() e2e guard for
  one.
---

# next-cache-components-optimizer

Set up an agentic optimization loop that drives a Next.js route from "not instant" to "instant" and keeps it there. The loop is test-driven: encode the goal as a failing `@next/playwright` `instant()` test, work it to green, and ship the test as the regression guard.

## Core Principles

- **Invariant: The Verification Loop**: The static shell must commit immediately upon click/navigation. The proof is an automated check: under a lock that gates dynamic data, the static shell still commits without blocking.
- **The Mechanism: `instant()`**: Use `instant()` assertions as a ruler to verify that the App Shell and `<Suspense>` loading fallbacks commit deterministically.
- **Data & Suspense Placement**: Push dynamic data reads (e.g. Solana RPC balance queries, Candy Machine live mint status) down below `<Suspense>` boundaries while caching static page skeletons with `"use cache"`.

## Workflow Sequence

1. **Prerequisites**: Next.js 16+ App Router with `cacheComponents` or Suspense-first boundaries.
2. **Baseline**: Ensure the target route renders and its shell structure is identified.
3. **RED Test**: Write a failing `instant()` E2E test verifying that the shell commits immediately before dynamic RPC calls resolve.
4. **Fix & Refactor**:
   - Wrap uncached dynamic data fetchers in `<Suspense fallback={<Skeleton />}>`.
   - Use `"use cache"` where static or periodic caching is valid.
5. **GREEN Verification**: Run the test to confirm the shell is instant and data streams in smoothly.
6. **Clean Code & Review**: Commit the guard test to prevent future regressions.
