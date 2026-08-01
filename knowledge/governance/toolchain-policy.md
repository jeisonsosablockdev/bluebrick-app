---
type: Policy
title: Toolchain & Headless Browser Policy
description: Standards and decision playbook for headless browser usage (Lightpanda vs Headless Chromium) in BRIDS.
tags: [governance, toolchain, lightpanda, playwright]
timestamp: 2026-08-01T10:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/governance/toolchain-policy.md
---

# Toolchain & Headless Browser Policy (Lightpanda Decision Playbook)

## 1. Overview
To optimize developer experience, CI/CD pipeline performance, and LLM prompt token consumption, BRIDS employs a **Dual-Engine Browser Architecture** managed through `lib/infrastructure/browser-factory.ts`.

## 2. Decision Playbook: Lightpanda vs. Headless Chromium

| Category | Recommended Engine | Rationale & Capabilities |
| :--- | :--- | :--- |
| **AI Agent Web Ingestion** | **Lightpanda Engine** (`agent-data`) | 85%-90% prompt token reduction via native Markdown extraction; 10x faster execution; ~24MB RAM usage. |
| **Off-Chain Web Scraping** | **Lightpanda Engine** (`agent-data`) | High concurrency (80+ sessions/GB RAM); zero graphic rendering tax. |
| **SEO & DOM Metadata Verification** | **Lightpanda Engine** (`agent-data`) | Verifies SSR elements, JSON-LD schemas, Meta tags without graphic pipeline overhead. |
| **E2E Visual Regression & Screenshots** | **Headless Chromium** (`visual-e2e`) | Lightpanda lacks pixel rendering, CSS painting, and canvas/GPU pipeline. |
| **Solana Wallet E2E Tests (Synpress)** | **Headless Chromium** (`visual-e2e`) | Chrome Extension APIs (`chrome.*`) and Phantom wallet extension require standard V8/Chromium. |

## 3. Mandatory Governance Rules
1. **Never use Chromium for raw text/DOM extraction in AI agents**: Always route agent browsing through `lib/infrastructure/browser-factory.ts` with mode `'agent-data'` to prevent prompt token bloat.
2. **Never use Lightpanda for Visual QA or Wallet Extension tests**: Lightpanda will fail pixel capture and extension injection. Use mode `'visual-e2e'` via native Playwright.
3. **Configuration Endpoint**: Lightpanda connects via Chrome DevTools Protocol (CDP) WebSocket endpoint (`ws://127.0.0.1:9222` or `process.env.LIGHTPANDA_WS_URL`).
