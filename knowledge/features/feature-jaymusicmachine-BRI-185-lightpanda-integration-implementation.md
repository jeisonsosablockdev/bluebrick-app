# Solution Spec: Lightpanda Headless Browser Integration & Decision Playbook Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `api` / `architect`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The implementation establishes a clean 4-layer functional web3 architecture for browser engine dispatching and decision governance:

1. **Presentation Layer:** N/A (Internal infrastructure & toolchain configuration).
2. **Application/Consumption Layer:** High-level factory hooks and helper utilities (`getBrowserInstance`, `extractPageMarkdown`) consumed by AI agents and tests.
3. **Domain/Pipelines/Services Layer:** Engine decision playbook and routing rules in `lib/infrastructure/browser-factory.ts` evaluating options (`agent-data` vs `visual-e2e`).
4. **Infrastructure Layer:** Dual CDP client integration (Lightpanda WebSocket `ws://127.0.0.1:9222` vs native Playwright `chromium.launch()`), plus policy governance records in `knowledge/governance/toolchain-policy.md`.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1 (TDD)**: Create unit test suite `tests/lib/browser-factory.test.ts` verifying browser mode selection, configuration defaults, fallback mechanisms, and Markdown extraction interface (Fase RED). (Branch: `feature/jaymusicmachine-BRI-185-lightpanda-integration`)
- **SPEC-2 (Implementation)**: Implement `lib/infrastructure/browser-factory.ts` and update `knowledge/governance/toolchain-policy.md` with the Lightpanda decision playbook. (Fase GREEN).
- **SPEC-3 (Clean Code & Governance Audit)**: Run `pnpm validate` and audit layered isolation and clean code principles.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/lib/browser-factory.test.ts`
- **Command**: `pnpm test tests/lib/browser-factory.test.ts`
- **Assertion Goals**:
  - `getBrowserConfig('agent-data')` returns CDP endpoint configuration with `ws://127.0.0.1:9222` (or process.env.LIGHTPANDA_WS_URL).
  - `getBrowserConfig('visual-e2e')` returns standard native launch config.
  - `shouldUseLightpanda(taskType)` accurately returns `true` for `agent-scraping`, `seo-check`, `dom-validation`, `metadata-verify` and `false` for `visual-qa`, `screenshot`, `synpress-wallet`.

## 5. Local Definition of Done (DoD)
- [x] Phase tracker in `.agents/active_task_state.json` reflects progress.
- [x] Unit test suite passes cleanly in Vitest (`pnpm test tests/lib/browser-factory.test.ts`).
- [x] `pnpm validate` runs with 0 errors.
- [x] `knowledge/governance/toolchain-policy.md` includes the official Lightpanda Decision Playbook.
- [x] Human acceptance recorded.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BRI-185-lightpanda-integration.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-185-lightpanda-integration.md)
- **Solution Spec**: [feature-jaymusicmachine-BRI-185-lightpanda-integration-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-185-lightpanda-integration-implementation.md)
- **Linear Issue**: [Linear Ticket BRI-185](https://linear.app/brids-app/issue/BRI-185/lightpanda-headless-browser-integration-and-decision-playbook)
