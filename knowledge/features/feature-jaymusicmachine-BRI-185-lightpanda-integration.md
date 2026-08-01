# Problem Spec: Lightpanda Headless Browser Integration & Decision Playbook

## What problem exists
Currently, web interactions in `brids` (such as AI agent web search, off-chain property data extraction, metadata verification, and SEO/route checks) rely either on standard Headless Chromium via Playwright or full Chrome DevTools protocol snapshots. Chromium carries a heavy rendering tax (~200MB-350MB RAM per instance, 3.5s-5.0s load latency) and dumps full raw HTML/DOM snapshots into LLM prompts (50,000 to 100,000 tokens per page). This creates high LLM token costs, high memory consumption, and slower background agent execution.

## Why it matters
1. **Token Cost & Latency:** Ingesting 80k HTML tokens per page load inflates LLM API costs and degrades agent response times.
2. **Server Resource Overhead:** Running multiple concurrent Chromium instances in worker/CI environments consumes gigabytes of RAM.
3. **Lack of Clear Playbook:** Without a clear decision policy in our repo governance (`toolchain-policy.md` and agent rules), developers and agents might incorrectly try to use Lightpanda for visual QA or wallet tests (which fail due to lack of a graphical rendering engine) or overuse heavy Chromium for simple text extraction.

## What outcome is expected
1. **Dual-Engine Abstraction (`BrowserFactory`):** Clean separation in `lib/infrastructure/browser-factory.ts` allowing `agent-data` mode (connecting to Lightpanda CDP on `ws://127.0.0.1:9222`) and `visual-e2e` mode (launching native Chromium).
2. **Token Efficiency:** Achieving 80%-90% prompt token reduction for web page ingestion by extracting clean structured Markdown directly.
3. **Governance & Decision Playbook:** Clear decision rules in `knowledge/governance/toolchain-policy.md` and `.agents/policies/` defining when to use Lightpanda vs Chromium.
4. **Zero Regression:** All existing E2E visual tests (`e2e/*.pw.spec.ts`) and Synpress wallet tests remain 100% functional on Chromium.

## What gaps exist today
- No centralized `BrowserFactory` in `lib/infrastructure/` for dual-engine CDP routing.
- No explicit policy or playbook in `knowledge/governance/toolchain-policy.md` or `.agents/policies/` covering Lightpanda vs Chromium usage.
- No unit tests validating engine selection and fallback logic.

## What questions remain open
- None. The scope and trade-offs between graphic rendering (Chromium) and fast Zig-based text extraction (Lightpanda) are fully established.
