---
type: Guide
title: Linear Mcp BRI-dge
description: Linear Mcp BRI-dge - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/linear-mcp-bridge.md
---

# Linear MCP Bridge

This repository now includes a local MCP bridge for Linear so Codex and other MCP-capable tools can talk to Linear using the same BRIDS workflow rules that already govern branch naming, slice planning, and issue-state transitions.

## What it provides

- `linear_get_issue`
- `linear_list_my_issues`
- `linear_list_teams`
- `linear_create_issue`
- `linear_update_issue`
- `linear_update_issue_state`
- `linear_add_comment`
- `linear_issue_brief` prompt

## How it works

- The bridge runs as a local MCP stdio server.
- It talks to Linear's GraphQL API using a personal API key.
- It reuses the repo's existing Linear status helper so `In Progress`, `In Review`, and `Done` stay aligned with the same source of truth as the shell scripts.
- Issue creation accepts a team name, team key, or team UUID.
- Issue updates accept title and description changes, and can also move the workflow state.

## Environment

Set this before starting the server:

```bash
export LINEAR_API_KEY="your-linear-api-key"
```

Optional overrides:

- `LINEAR_GRAPHQL_ENDPOINT`

## Start the server

```bash
npm run mcp:linear
```

## Repo wiring

- `.mcp.json` registers the bridge for Codex project scope.
- `.cursor/mcp.json` registers the bridge for Cursor workspace scope.
- `README.md` documents the integration next to the other MCP servers already used in BRIDS.

## Notes

- If the API key is missing, the server will fail fast instead of pretending it is connected.
- The bridge is intentionally scoped to the BRIDS workflow needs first, rather than trying to mirror every Linear feature at once.
