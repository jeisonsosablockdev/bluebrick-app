# Next.js + Solana Monorepo Starter

High-performance Next.js 16 and Solana monorepo starter with 4-Layer Functional Architecture, Autonomous Agent Governance Harness, and Solana Devnet integration.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-09-05 02:38:55 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`ai-augmented-ingestion-pipeline.md`](./knowledge/architecture/ai-augmented-ingestion-pipeline.md) | general | not set | 2026-08-25 45aea084 |
| [`architecture-overview.md`](./knowledge/architecture/architecture-overview.md) | general | not set | 2026-08-23 a69db56b |
| [`auth-flow.md`](./knowledge/architecture/auth-flow.md) | frontend/auth | not set | 2026-08-23 a69db56b |
| [`authority-model.md`](./knowledge/architecture/authority-model.md) | blockchain | not set | 2026-08-23 a69db56b |
| [`devnet-proof.md`](./knowledge/architecture/devnet-proof.md) | blockchain | not set | 2026-08-23 a69db56b |
| [`index.md`](./knowledge/architecture/index.md) | general | not set | 2026-08-23 a69db56b |
| [`nft-spec.md`](./knowledge/architecture/nft-spec.md) | nft | not set | 2026-08-23 a69db56b |
| [`session-model.md`](./knowledge/architecture/session-model.md) | frontend/auth | not set | 2026-08-23 a69db56b |
| [`solana-stack.md`](./knowledge/architecture/solana-stack.md) | general | not set | 2026-08-23 a69db56b |
| [`state-machine.md`](./knowledge/architecture/state-machine.md) | blockchain | not set | 2026-08-23 a69db56b |
| [`threat-model.md`](./knowledge/architecture/threat-model.md) | blockchain | not set | 2026-08-23 a69db56b |
| [`toolchain-policy.md`](./knowledge/architecture/toolchain-policy.md) | general | not set | 2026-08-23 a69db56b |

### Required Docs by Change Type
- Blockchain (/programs): `knowledge/architecture/architecture-overview.md`, `knowledge/architecture/authority-model.md`, `knowledge/architecture/state-machine.md`, `knowledge/architecture/threat-model.md`, `knowledge/architecture/devnet-proof.md`
- Frontend/Auth (/app): `knowledge/architecture/auth-flow.md`, `knowledge/architecture/session-model.md`
- NFT features: `knowledge/architecture/nft-spec.md`
<!-- DOCS-AUTO:END -->

## Operational Architecture

This repository is structured as a high-performance **pnpm monorepo** for **Next.js** and **Solana**:

- `apps/web/`: Next.js 16 (App Router) presentation application with Tailwind CSS, `@solana/wallet-adapter-react`, and 4-layer functional architecture.
- `programs/`: Solana on-chain programs written in Rust with Anchor framework.
- `packages/solana-client/`: Shared Solana SDK, types, and IDL client bindings.
- `knowledge/`: Canonical OKF documentation, governance policies (`knowledge/governance/`), and architecture specifications.
- `scripts/`: Task lifecycle automation (`task-init.sh`), 4-layer architecture linter, and CI governance scripts.
- `tests/`: Integration tests, unit tests, and autonomous agent governance harness (`tests/harness/`).
- `.agents/`: Autonomous agent definitions, policies, workflows, and task state tracking.

---

## 4-Layer Functional Web3 Architecture

All frontend and client code in `apps/web/src/` adheres strictly to 4 decoupled layers:

1. **Layer 1: Presentation** (`apps/web/src/app`, `apps/web/src/components`):
   - UI views, layout skeletons, wallet connection buttons, client interaction boundaries.
2. **Layer 2: Application / Consumption** (`apps/web/src/lib/hooks`, `apps/web/src/lib/state`):
   - React custom hooks, normalized wallet state, application store mutations.
3. **Layer 3: Domain / Pipelines** (`apps/web/src/lib/pipelines`):
   - Pure domain business logic, transaction construction pipelines, validation rules.
4. **Layer 4: Infrastructure** (`apps/web/src/lib/infrastructure`, `apps/web/src/lib/utils.ts`):
   - Solana Devnet RPC connectors, Solscan URL generators, class name and formatting helpers.

---

## Development Commands

```bash
# Start Next.js development server
pnpm dev

# Run unit and starter tests
pnpm test

# Run governance & harness verification suite
pnpm test:harness

# Execute complete CI validation (Lint, Typecheck, Licenses, 4-Layer Architecture, Harness)
pnpm validate

# Build Next.js for production
pnpm build
```

---

## Agent Governance & Task Lifecycle

This repository uses the Autonomous Agent Governance framework. All changes follow the 8-phase task lifecycle with double-gatekeeper enforcement:

1. **Task Initialization**:
   ```bash
   pnpm task:init
   ```
2. **Architecture Review (Gate 1)**: Pre-implementation Solution Spec review.
3. **TDD RED Phase**: Write tests before production implementation.
4. **Code Implementation**: Write clean production code with mandatory in-code commentary.
5. **Diff Audit (Gate 2)**: Architecture isolation audit & `pnpm validate`.
