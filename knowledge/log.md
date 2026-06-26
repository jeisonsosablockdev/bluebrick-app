
# Knowledge Bundle Update Log

## 2026-06-16
* **Creation**: Established OKF v0.1 knowledge bundle structure at `knowledge/` with governance, features, architecture, api, database, operations, and security sections.
* **Migration**: Initial migration of existing `knowledge/` content to OKF format — governance policies, feature specs, ADRs, API docs, database migrations, operations runbooks, and security audits.
* **Indexing**: Created root `index.md` with OKF frontmatter and progressive-disclosure navigation. Added section `index.md` files for all top-level directories.

## 2026-06-11
* **Update**: Added stake distribution traceability draft to `knowledge/inbox/`.
* **Structure**: Existing `knowledge/` with inbox, proposals, reports, templates, archive — preserved as legacy inbox for migration.

## Historical (pre-OKF)
* Governance policies maintained in `knowledge/governance/`
* Feature specs in `knowledge/features/`
* Architecture docs at `knowledge/` root (authority-model.md, rotation-spec.md, state-machine.md)
* Database migrations in `db/migrations/`
* Security audits scattered across `knowledge/features/fix-*` and `fix/` branches