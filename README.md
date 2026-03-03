# Solana Fullstack App

This README includes an auto-generated snapshot of project documentation.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-03-03 17:04:23 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`architecture.md`](./docs/architecture.md) | blockchain | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |
| [`auth-flow.md`](./docs/auth-flow.md) | frontend/auth | 2026-03-03 17:04:22 UTC | 2026-03-03 319f015 |
| [`authority-model.md`](./docs/authority-model.md) | blockchain | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |
| [`devnet-proof.md`](./docs/devnet-proof.md) | blockchain | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |
| [`nft-spec.md`](./docs/nft-spec.md) | nft | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |
| [`rbac.md`](./docs/rbac.md) | general | 2026-03-03 UTC | not committed |
| [`session-model.md`](./docs/session-model.md) | frontend/auth | 2026-03-03 17:04:23 UTC | 2026-03-03 319f015 |
| [`state-machine.md`](./docs/state-machine.md) | blockchain | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |
| [`threat-model.md`](./docs/threat-model.md) | blockchain | 2026-03-03 08:55:00 UTC | 2026-03-03 319f015 |

### Required Docs by Change Type
- Blockchain (/programs): `architecture.md`, `authority-model.md`, `state-machine.md`, `threat-model.md`, `devnet-proof.md`
- Frontend/Auth (/app): `auth-flow.md`, `session-model.md`
- NFT features: `nft-spec.md`
<!-- DOCS-AUTO:END -->

## Auth Persistence Note

- Wallet auth uses SIWS with a server-side session cookie (`httpOnly`).
- Current session storage is in-memory (process-local), so sessions are lost on server restart.
- Before production or horizontal scaling, migrate session storage to a shared persistent backend (for example Redis).
