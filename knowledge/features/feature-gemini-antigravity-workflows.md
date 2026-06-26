# Problem Artifact: Gemini & Antigravity Workflows

## What problem exists
The current `AGENTS.md` and `.codex/*` workflows were designed specifically for Codex. When using Gemini within the Google Antigravity SDK, these workflows do not natively leverage the advanced capabilities of the platform (such as subagents, background tasks, and MCP tool execution), leading to suboptimal agent orchestration.

## Why it matters
To get the absolute best performance out of Gemini and the Antigravity SDK, the agent needs instructions that explicitly tell it *how* to use its environment. Relying on generic Codex rules prevents the agent from running tasks concurrently, using structured artifacts properly, and isolating context using subagents.

## What outcome is expected
A dedicated set of policies and workflows specifically tailored for Gemini, placed in the native `.agents/*` directory. `GEMINI.md` will serve as the canonical entry point, pointing to these optimized files while leaving `.codex/*` intact for legacy use.

## What gaps exist today
- `GEMINI.md` is currently tuned for a purely "Solana Fullstack Developer" persona, without explicitly leveraging Antigravity SDK tools.
- There are no `.agents/*` workflows.
- The existing `.codex/*` files instruct the agent to "change personas" internally rather than invoking parallel subagents.

## What questions remain open
- Are there any additional custom Antigravity skills that should be mandated in the future? (To be evaluated as the project evolves).
