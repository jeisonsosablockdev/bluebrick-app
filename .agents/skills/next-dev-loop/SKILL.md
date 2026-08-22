---
name: next-dev-loop
description: >
  Verify Next.js runtime behavior after editing app code. Use this
  skill to confirm a change actually works in a running app — not
  just that it compiles or type-checks. Combines /_next/mcp
  (Next.js's view) with agent-browser (the browser's view).
  Requires a running `next dev` (or `pnpm dev:turbo`).
---

# next-dev-loop

The edit/verify rhythm during `next dev` — make a change, then confirm it actually works at runtime, not only that the types or the build are happy.

You verify through two views of the same running app:

- **`/_next/mcp`** — an HTTP endpoint Next.js exposes about itself via `next-devtools-mcp`. Knows framework-specific things: routes, segments, RSC, server actions, server logs, and errors as Next.js saw them (`get_errors`, `compile_route`, `get_compilation_issues`, `get_routes`, `get_server_action_by_id`).
- **`agent-browser`** — a CLI that drives a real browser / Chrome. Knows framework-agnostic browser things: DOM, console, network, React fiber, Web Vitals.

The two views cross-check each other.

## Requirements

- Next.js **16+** with **Turbopack** (`pnpm dev:turbo`) — `/_next/mcp` plus the proactive compile check via `get_compilation_issues` and `compile_route`.
- `next-devtools-mcp` configured in `.mcp.json` or Antigravity MCP settings.
- Optional: `agent-browser` >= 0.31.1 or Playwright MCP for browser-level inspection.

## Runtime Loop Sequence

1. **Start Dev Server**: Ensure `pnpm dev:turbo` (or `pnpm dev`) is running.
2. **Proactive Route Compilation**: Call `compile_route` with the target route (e.g. `/marketplace`, `/dashboard`) to trigger Turbopack compilation without manual browser navigation.
3. **Compile & Runtime Error Inspection**: Call `get_compilation_issues` and `get_errors` to catch any Server Action mismatches, hydration errors, or missing imports immediately.
4. **Browser Runtime Verification**: Validate the rendered UI, console errors, and network calls.
5. **Report Result**: Confirm the edit is green at runtime before handing off to QA or PR.
