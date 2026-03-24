# Solana Fullstack App

This README includes an auto-generated snapshot of project documentation.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-03-20 19:27:57 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`STAKE_AUDIT.md`](./docs/STAKE_AUDIT.md) | general | not set | 2026-03-13 b6182dd |
| [`architecture.md`](./docs/architecture.md) | blockchain | 2026-03-18 16:24:39 UTC | 2026-03-19 039cfcb |
| [`auth-flow.md`](./docs/auth-flow.md) | frontend/auth | 2026-03-20 19:27:57 UTC | 2026-03-20 39dfc00 |
| [`authority-model.md`](./docs/authority-model.md) | blockchain | 2026-03-18 01:14:38 UTC | 2026-03-19 039cfcb |
| [`devnet-proof.md`](./docs/devnet-proof.md) | blockchain | 2026-03-20 16:49:21 UTC | 2026-03-20 0ae1fa7 |
| [`nft-spec.md`](./docs/nft-spec.md) | nft | 2026-03-20 19:27:57 UTC | 2026-03-20 39dfc00 |
| [`purchase-tracing.md`](./docs/purchase-tracing.md) | general | 2026-03-20 19:25:00 UTC | 2026-03-20 39dfc00 |
| [`rbac.md`](./docs/rbac.md) | general | 2026-03-03 UTC | 2026-03-03 d7d8bf6 |
| [`session-model.md`](./docs/session-model.md) | frontend/auth | 2026-03-20 19:27:57 UTC | 2026-03-20 39dfc00 |
| [`state-machine.md`](./docs/state-machine.md) | blockchain | 2026-03-18 01:14:38 UTC | 2026-03-19 039cfcb |
| [`threat-model.md`](./docs/threat-model.md) | blockchain | 2026-03-18 01:14:38 UTC | 2026-03-20 0ae1fa7 |

### Required Docs by Change Type
- Blockchain (/programs): `architecture.md`, `authority-model.md`, `state-machine.md`, `threat-model.md`, `devnet-proof.md`
- Frontend/Auth (/app): `auth-flow.md`, `session-model.md`
- NFT features: `nft-spec.md`
<!-- DOCS-AUTO:END -->

## Auth Persistence Note

- Wallet auth uses SIWS with a server-side session cookie (`httpOnly`).
- Current session storage is in-memory (process-local), so sessions are lost on server restart.
- Before production or horizontal scaling, migrate session storage to a shared persistent backend (for example Redis).

## Testing

- `npm test`: run all unit tests with Vitest.
- `npm run test:watch`: run tests in watch mode.
- `npm run test:coverage`: run tests with coverage report.

## Git Workflow

- Day-to-day work is `develop`-first.
- Create feature/fix branches from latest `develop`.
- Open regular PRs into `develop`.
- Use `main` only for release PRs from `develop`.
- CI enforces this rule with `.github/workflows/enforce-main-source-branch.yml` (PRs to `main` must come from `develop`).

Quick start:

- `git checkout develop && git pull origin develop`
- `./scripts/git-start.sh app admin-asset-form-v3`

## RFC Workflow (Epics)

Start every epic with the RFC scaffold command:

- `npm run rfc:new -- --epic 12 --slug staking`

This creates:

- `docs/rfcs/EPIC-012-staking/README.md`
- `docs/rfcs/EPIC-012-staking/STORY-012-01-kickoff.md`

Common options:

- `npm run rfc:new -- --epic 12 --slug staking --story-id 02 --story-slug asset-validation`
- `npm run rfc:new -- --epic 12 --slug staking --owner jay`
- `npm run rfc:new -- --epic 12 --slug staking --force`

Notes:

- Use `--` before script flags so npm forwards arguments correctly.
- Naming follows the governance policy in `docs/governance/documentation-policy.md`.
