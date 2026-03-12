# Solana Fullstack App

This README includes an auto-generated snapshot of project documentation.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-03-12 07:31:36 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`architecture.md`](./docs/architecture.md) | blockchain | 2026-03-09 03:16:27 UTC | 2026-03-10 c654ffa |
| [`auth-flow.md`](./docs/auth-flow.md) | frontend/auth | 2026-03-12 07:31:36 UTC | 2026-03-10 c654ffa |
| [`authority-model.md`](./docs/authority-model.md) | blockchain | 2026-03-10 07:35:00 UTC | 2026-03-10 c654ffa |
| [`devnet-proof.md`](./docs/devnet-proof.md) | blockchain | 2026-03-10 12:14:00 UTC | 2026-03-10 c654ffa |
| [`nft-spec.md`](./docs/nft-spec.md) | nft | 2026-03-09 03:16:27 UTC | 2026-03-10 c654ffa |
| [`rbac.md`](./docs/rbac.md) | general | 2026-03-03 UTC | 2026-03-03 d7d8bf6 |
| [`session-model.md`](./docs/session-model.md) | frontend/auth | 2026-03-12 07:31:36 UTC | 2026-03-10 c654ffa |
| [`state-machine.md`](./docs/state-machine.md) | blockchain | 2026-03-08 05:40:58 UTC | 2026-03-10 c654ffa |
| [`threat-model.md`](./docs/threat-model.md) | blockchain | 2026-03-10 07:35:00 UTC | 2026-03-10 c654ffa |

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
