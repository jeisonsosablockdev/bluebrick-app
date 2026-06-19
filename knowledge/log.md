
# Knowledge Bundle Update Log

## 2026-06-16
* **Creation**: Established OKF v0.1 knowledge bundle structure at `knowledge/` with governance, features, architecture, api, database, operations, and security sections.
* **Migration**: Initial migration of existing `docs/` content to OKF format — governance policies, feature specs, ADRs, API docs, database migrations, operations runbooks, and security audits.
* **Indexing**: Created root `index.md` with OKF frontmatter and progressive-disclosure navigation. Added section `index.md` files for all top-level directories.

## 2026-06-11
* **Update**: Added stake distribution traceability draft to `docs/knowledge/inbox/`.
* **Structure**: Existing `docs/knowledge/` with inbox, proposals, reports, templates, archive — preserved as legacy inbox for migration.

## Historical (pre-OKF)
* Governance policies maintained in `docs/governance/`
* Feature specs in `docs/features/`
* Architecture docs at `docs/` root (authority-model.md, rotation-spec.md, state-machine.md)
* Database migrations in `db/migrations/`
* Security audits scattered across `docs/features/fix-*` and `fix/` branches