# BRIDS

This README includes an auto-generated snapshot of project documentation.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-08-21 03:44:10 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`app-technical-roadmap-investor-brief.md`](./knowledge/architecture/app-technical-roadmap-investor-brief.md) | general | not set | 2026-07-06 4afd5bbb |
| [`architecture-overview.md`](./knowledge/architecture/architecture-overview.md) | general | 2026-04-01 08:20:33 UTC | 2026-06-16 ea2ee147 |
| [`auth-flow.md`](./knowledge/architecture/auth-flow.md) | frontend/auth | 2026-07-22 | 2026-08-06 a27bae02 |
| [`authority-model.md`](./knowledge/architecture/authority-model.md) | blockchain | 2026-04-01 10:45:00 UTC | 2026-06-16 67163847 |
| [`devnet-proof.md`](./knowledge/architecture/devnet-proof.md) | blockchain | 2026-04-01 16:05:30 UTC | 2026-06-16 ea2ee147 |
| [`index.md`](./knowledge/architecture/index.md) | general | not set | 2026-07-25 d65efc37 |
| [`linear-context.md`](./knowledge/architecture/linear-context.md) | general | not set | 2026-06-18 1f8b29ff |
| [`nft-spec.md`](./knowledge/architecture/nft-spec.md) | nft | 2026-06-07 | 2026-08-06 a27bae02 |
| [`purchase-tracing.md`](./knowledge/architecture/purchase-tracing.md) | general | 2026-03-20 19:25:00 UTC | 2026-06-16 ea2ee147 |
| [`rbac.md`](./knowledge/architecture/rbac.md) | general | 2026-03-03 UTC | 2026-06-16 ea2ee147 |
| [`rotation-spec.md`](./knowledge/architecture/rotation-spec.md) | general | not set | 2026-06-21 86b90d23 |
| [`session-model.md`](./knowledge/architecture/session-model.md) | frontend/auth | 2026-07-22 | 2026-08-06 a27bae02 |
| [`solana-stack.md`](./knowledge/architecture/solana-stack.md) | general | not set | 2026-07-19 35801116 |
| [`squads-treasury-security-design.md`](./knowledge/architecture/squads-treasury-security-design.md) | general | not set | 2026-08-19 b6d1d5d3 |
| [`stake-audit.md`](./knowledge/architecture/stake-audit.md) | general | not set | 2026-06-18 1f8b29ff |
| [`state-machine.md`](./knowledge/architecture/state-machine.md) | blockchain | 2026-04-01 08:20:33 UTC | 2026-06-21 86b90d23 |
| [`third-party-integrations.md`](./knowledge/architecture/third-party-integrations.md) | general | not set | 2026-08-15 24389ce9 |
| [`threat-model.md`](./knowledge/architecture/threat-model.md) | blockchain | 2026-04-01 08:20:33 UTC | 2026-06-16 ea2ee147 |
| [`toolchain-policy.md`](./knowledge/architecture/toolchain-policy.md) | general | not set | 2026-06-16 ea2ee147 |

### Required Docs by Change Type
- Blockchain (/programs): `knowledge/architecture/architecture-overview.md`, `knowledge/architecture/authority-model.md`, `knowledge/architecture/state-machine.md`, `knowledge/architecture/threat-model.md`, `knowledge/architecture/devnet-proof.md`
- Frontend/Auth (/app): `knowledge/architecture/auth-flow.md`, `knowledge/architecture/session-model.md`
- NFT features: `knowledge/architecture/nft-spec.md`
<!-- DOCS-AUTO:END -->

## Operational Map

This repository is currently a Next.js application with Solana integrations and governance automation around it. The governance documents still define `/programs` and `/packages`, but the active implementation today lives mainly in `app/`, `components/`, `lib/`, `tests/`, `e2e/`, and `scripts/`.

### Main Modules

- `app/`: App Router pages and route handlers. Use this first when the change affects URLs, API contracts, server-rendered pages, auth endpoints, admin endpoints, checkout, marketplace, feeds, or webhooks.
- `components/`: UI composition layer. Use this for visual changes, client interactions, dashboards, admin panels, modals, filters, and page-specific presentation logic.
- `lib/`: Core domain and server logic. This is the main backend layer of the repo: auth, SIWS, RBAC, Solana RPC helpers, Metaplex/Core Candy Machine flows, purchases, checkout, compliance, referrals, observability, content, SEO, and admin services.
- `db/`: SQL migrations and database evolution. Start here when a feature needs new persistence, audit tables, queue state, idempotency storage, or read-model support.
- `tests/`: Unit and route-level verification with Vitest. This is the first place to update for TDD and regression coverage on application logic.
- `e2e/`: Playwright and Synpress coverage for browser, auth, admin, wallet, and responsive flows. Use this when the change affects critical UI journeys or wallet-connected behavior.
- `knowledge/`: Canonical architecture, security, auth, NFT, feature-note, RFC, and workflow documentation. Update this alongside code according to `knowledge/governance/documentation-policy.md`.
- `scripts/`: Repo automation for docs sync, PR governance, RFC scaffolding, devnet proof helpers, migrations, and workflow bootstrap. Check here before inventing a new one-off command.
- `.mcp.json`: Solana MCP and Helius MCP project wiring. Review this when the task depends on MCP-backed Solana guidance or Helius asset/transaction inspection.

### Where To Start By Change Type

- Landing, marketplace, checkout, protected pages, admin screens, or page routing: start in `app/`, then follow imports into `components/` and `lib/`.
- Auth, session, wallet sign-in, admin gating, referral binding, or role logic: start in `app/api/auth/*`, `lib/auth.ts`, `lib/auth-store.ts`, `lib/auth-session.ts`, `lib/siws.ts`, `lib/rbac.ts`, and `proxy.ts`.
- Solana RPC policy, explorer links, wallet client behavior, or network restrictions: start in `lib/solana.ts` and then the feature service using it.
- Marketplace read paths, property listing/detail data, or collection-backed listing synchronization: start in `lib/property-marketplace-server.ts`, `lib/property-service.ts`, and the relevant `app/marketplace*` routes/pages.
- Purchase flow, anti-bot challenge, idempotency, or webhook reconciliation: start in `lib/purchase-service.ts`, `lib/purchase-anti-bot.ts`, `lib/purchase-flow-trace.ts`, `lib/purchase-attempts-repository.ts`, and `app/api/purchase/*`.
- Checkout cart, order lifecycle, Airwallex handoff, or onboarding reward discount usage: start in `lib/checkout-service.ts`, `lib/checkout-domain.ts`, `lib/checkout-repository.ts`, `lib/airwallex-client.ts`, and `app/api/checkout/*`.
- Admin collection editing, uploads, collection health, or marketplace entry creation: start in `lib/admin/*`, `components/admin/*`, and `app/api/admin/collections/*` or `app/api/admin/assets/*`.
- Core Candy Machine, Metaplex Core minting, authority rotation, snapshots, or devnet mint/admin tooling: start in `lib/core-candy-machine-admin.ts`, `lib/metaplex-core-admin.ts`, `lib/core-authority-lifecycle.ts`, and the matching `app/api/admin/core-candy-machine/*` or `app/api/admin/metaplex-core/*` handlers.
- Compliance, KYC, AML, suspension, or operational review queues: start in `lib/compliance/*`, `lib/kyc/*`, `app/api/internal/compliance/*`, and `app/api/admin/compliance/*`.
- Content, AI-readable endpoints, knowledge pages, feeds, or SEO/schema output: start in `lib/content/*`, `lib/knowledge*`, `lib/schema/*`, `lib/seo/*`, and the related route handlers under `app/api`, `app/feeds`, `app/knowledge`, `app/ai.txt`, and `app/llms.txt`.
- Governance, docs sync, PR policy, RFC enforcement, or branch/PR automation: start in `scripts/ci/*`, `scripts/docs-sync.sh`, `scripts/rfc-new*.js`, `scripts/linear-plan*.js`, and `knowledge/governance/*`.

### Current Architectural Notes

- The repo is governed as a Solana-first fullstack project, but there is no active `/programs` directory in the current tree. The blockchain behavior in this repository is implemented primarily through TypeScript services and admin routes.
- Sessions are currently process-local in-memory tokens in `lib/auth-store.ts`. This is acceptable for local/dev workflows but not enough for multi-instance production.
- `npm run validate` is the top-level quality gate. It already includes docs governance checks, route/content/schema contracts, observability contracts, and type/lint validation.
- Critical browser coverage lives in `e2e/` and should be the default verification path for frontend, auth, wallet, and responsive changes.

### Dependency Graph Snapshot

The following screenshots were exported with VS Code's `Dependency Graph Viewer` extension using `lib/purchase-service.ts` as a representative service map.

Graph view:

![Dependency Graph Viewer graph export for purchase-service.ts](./knowledge/images/purchase-service-ts-graph.png)

Sequential view:

![Dependency Graph Viewer sequential export for purchase-service.ts](./knowledge/images/purchase-service-ts-sequential.png)

## Auth Persistence Note

- Wallet auth uses SIWS with a server-side session cookie (`httpOnly`).
- Current session storage is in-memory (process-local), so sessions are lost on server restart.
- Before production or horizontal scaling, migrate session storage to a shared persistent backend (for example Redis).

## Solana + Helius MCP Integration

This repo includes MCP configuration for Solana + Helius workflows:

- Claude Code project scope: [`/.mcp.json`](./.mcp.json)
- Cursor workspace scope: [`/.cursor/mcp.json`](./.cursor/mcp.json)

Endpoints and transport:

- Solana MCP URL: `https://mcp.solana.com/mcp` (HTTP/mcp-remote)
- Helius MCP package: `helius-mcp@latest` (via `npx`)

Quick verify (Claude Code):

- `claude mcp list`
- `claude mcp get solana-mcp-server`
- `claude mcp get helius`

Expected behavior:

- Ask: `How are events implemented in Anchor 0.31?`
- You should see an MCP tool call such as `Ask_Solana_Anchor_Framework_Expert`.
- Ask: `Parse this transaction signature with Helius`
- You should see a Helius MCP tool call for transaction parsing/query.

Important for this project (Devnet-only policy):

- Helius MCP defaults to `mainnet-beta`.
- Project MCP config loads `.env.local` before starting `helius-mcp@latest`, so local usage should inherit:
  - `HELIUS_NETWORK=devnet`
  - `HELIUS_API_KEY=YOUR_API_KEY`
- If you launch Helius MCP outside this repo config, export those variables manually first.

## Linear MCP Bridge

This repo also ships a local Linear MCP bridge tailored to BRIDS workflow automation:

- Project scope: [`/.mcp.json`](./.mcp.json)
- Cursor workspace scope: [`/.cursor/mcp.json`](./.cursor/mcp.json)
- Local server: [`scripts/linear-mcp-server.ts`](./scripts/linear-mcp-server.ts)
- Usage guide: [`knowledge/guides/linear-mcp-bridge.md`](./knowledge/guides/linear-mcp-bridge.md)

Environment:

- `LINEAR_API_KEY` is required.
- Optional override: `LINEAR_GRAPHQL_ENDPOINT`

Start it with:

- `npm run mcp:linear`

## Nix Dev Environment

This repository includes a reproducible Nix development shell:

- Enter shell: `nix develop`
- If flakes are not enabled globally yet: `nix --extra-experimental-features 'nix-command flakes' develop`
- Install dependencies: `pnpm install`
- Run baseline validation: `pnpm validate`

Toolchain governance for maintenance/update cadence is defined in:

- [`knowledge/toolchain-policy.md`](./knowledge/toolchain-policy.md)

## Testing

- `pnpm test`: run all unit tests with Vitest.
- `pnpm test:watch`: run tests in watch mode.
- `pnpm test:coverage`: run tests with coverage report.
- `pnpm preflight:start`: run an initial workspace preflight that reviews branches, suggests next actions, checks package/lock drift, and summarizes `AGENTS.md` guidance without cleaning branches automatically.
- `pnpm pr:ready`: run local PR governance preflight (`validate` + required docs + commit convention + PR-size + branch-age checks).
  - Includes feature-note enforcement: qualifying feature/fix/refactor/nft product changes must update `knowledge/features/*.md`.
- `pnpm e2e:install`: install Playwright Chromium (one-time setup).
- `pnpm e2e:playwright`: run Playwright smoke gate.
- `pnpm e2e:synpress`: build Synpress Phantom cache and run wallet E2E gate.
- `pnpm e2e:synpress:user`: run Synpress gate with non-admin wallet profile.
- `pnpm e2e:synpress:admin`: run Synpress gate with admin wallet profile.
- `pnpm e2e:roles`: validate `/admin` access control with SIWS signatures from local admin/non-admin keypairs.
- `pnpm e2e:evidence`: capture responsive critical-path evidence (320/375/768/1024) and build `test-results/evidence-index.json`.
- `pnpm e2e`: run Playwright + Synpress gates in sequence.

E2E env vars:

- `E2E_BASE_URL` (default: `http://127.0.0.1:3000`)
- `E2E_PHANTOM_PASSWORD` (optional; defaults to a local test password in setup file)
- `E2E_PHANTOM_SEED_PHRASE` (optional; defaults to test mnemonic only for local/devnet use)
- `E2E_ADMIN_KEYPAIR_PATH` (optional; default: `$HOME/my-solana-wallet.json`)
- `E2E_USER_KEYPAIR_PATH` (optional; default: `.keys/purchase-third-party-signer.json`)
- `E2E_SYNPRESS_WALLET_ROLE` (`admin` or `user`, default: `user`)
- `SYNPRESS_PHANTOM_CRX_URL` (optional override to download Phantom extension if default mirror is unavailable)

Evidence workflow:

- Run `npm run e2e:evidence`.
- Collect artifacts from `test-results/` (PNG/JSON/trace/video).
- Use `test-results/evidence-index.json` as the deterministic manifest to attach in PR review/MCP evidence checkpoints.

## Git Workflow

- Day-to-day work is `develop`-first.
- Create feature/fix branches from latest `develop`.
- Open regular PRs into `develop`.
- `develop` is the continuous integration branch and publishes to `qa.brids.io`.
- Release candidates must be cut from `develop` as `release/rc-*` branches.
- The active `release/rc-*` candidate is promoted to `rc.brids.io`.
- Use `main` only for release PRs from `develop`.
- `main` remains the only production source and publishes to `brids.io` and `www.brids.io`.
- CI enforces this rule with `.github/workflows/enforce-main-source-branch.yml` (PRs to `main` must come from `develop`).

Promotion order:

1. `feature/*` or `fix/*` -> PR -> `develop`
2. `develop` -> `qa.brids.io`
3. cut `release/rc-*` from `develop`
4. promote the selected `release/rc-*` deployment to `rc.brids.io`
5. open the release PR `develop -> main`
6. `main` -> `brids.io` / `www.brids.io`

## Task Bootstrap

Use `pnpm task:init` to start a new task the canonical way.

- If the brief is vague or you want the Socratic clarification pass with `explain-like-socrates`, run:
  - `pnpm task:init -- --ask`
- If you already know the branch shape, pass the `git-start.sh` arguments through:
  - `pnpm task:init -- feature shared single-issue-slice-planning --mode integration --issue BRI-149`

`task:init` runs the preflight first, then either asks for the missing task shape or delegates straight to `git-start.sh`.

Quick start:

- `git checkout develop && git pull origin develop`
- `pnpm task:init -- --ask`

## RFC Workflow (Epics)

Start every epic with the RFC scaffold command:

- `pnpm rfc:new -- --epic 12 --slug staking`

This creates:

- `knowledge/rfcs/EPIC-012-staking/README.md`
- `knowledge/rfcs/EPIC-012-staking/STORY-012-01-kickoff.md`

Common options:

- `npm run rfc:new -- --epic 12 --slug staking --story-id 02 --story-slug asset-validation`
- `npm run rfc:new -- --epic 12 --slug staking --owner jay`
- `npm run rfc:new -- --epic 12 --slug staking --force`

Notes:

- Use `--` before script flags so npm forwards arguments correctly.
- Naming follows the governance policy in `knowledge/governance/documentation-policy.md`.
