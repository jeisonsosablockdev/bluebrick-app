---
okf_version: "0.1"
title: BRIDS Knowledge Catalog
description: Open Knowledge Format (OKF) bundle for the BRIDS project - architecture, features, APIs, database, operations, and security knowledge.
tags: [brids, solana, nft, marketplace, real-estate, blockchain]
timestamp: 2026-06-16T12:00:00Z
---

# BRIDS Knowledge Catalog

This is an **Open Knowledge Format (OKF v0.1)** bundle containing the institutional knowledge for the BRIDS project — a Solana-based real estate NFT marketplace with fractional ownership, stake distribution, and investor dashboards.

## Bundle Structure

```
knowledge/
├── index.md                    # This file - bundle root index
├── log.md                      # Change history
├── governance/                 # Governance policies and rules
├── architecture/               # System architecture and ADRs
├── features/                   # Feature specifications and implementations
├── api/                        # API endpoints, schemas, RPC methods
├── database/                   # Database migrations and data models
├── operations/                 # Runbooks, playbooks, procedures
└── security/                   # Security audits, threat models, compliance
```

## Quick Navigation

### Governance
* [Documentation Policy](governance/documentation-policy.md)
* [Git Monorepo Policy](governance/git-monorepo-policy.md)
* [Frontend UI Policy](governance/frontend-ui-policy.md)
* [NFT Policy](governance/nft-policy.md)
* [Security Quality Policy](governance/security-quality-policy.md)
* [PR Policy Source of Truth](governance/pr-policy-source-of-truth.json)

### Architecture
* [Architecture Decision Records](architecture/index.md)
* [Solana Stack Overview](architecture/solana-stack-overview.md)

### Features
* [Epic 010: AI Discovery Infrastructure](features/epic-010/)
* [Epic 011: Marketplace Collections](features/epic-011/)
* [Epic 003: NFT Purchase Flow](features/epic-003/)
* [Solana Dev Skill](features/feature-solana-dev-skill.md)
* [Investor Dashboard (BRI-171)](features/feature-app-investor-dashboard-overview-real-data-bri-171.md)
* [Investor Portfolio (BRI-174)](features/feature-app-investor-portfolio-real-holdings-bri-174.md)
* [Marketplace 3D Visual (BRI-164)](features/feature-app-create-a-marketplace-3d-visual-bri-164.md)

### API
* [REST Endpoints](api/endpoints/)
* [Solana RPC Methods](api/rpc/solana-methods.md)
* [Schemas](api/schemas/)

### Database
* [Migrations](database/migrations/)
* [Data Models](database/models/)

### Operations
* [Runbooks](operations/runbooks/)
* [Playbooks](operations/playbooks/)
* [Procedures](operations/procedures/)

### Security
* [Audits](security/audits/)
* [Threat Models](security/threat-models/)
* [Compliance](security/compliance/)
* [Vulnerabilities](security/vulnerabilities/)

## Conventions

- **Concept IDs**: Path without `.md` suffix (e.g., `governance/documentation-policy`)
- **Cross-links**: Use bundle-relative links starting with `/` (e.g., `/governance/documentation-policy.md`)
- **Frontmatter**: Every concept file has YAML frontmatter with `type`, `title`, `description`, `tags`, `timestamp`
- **Types**: `Policy`, `ADR`, `Feature Spec`, `Implementation Guide`, `API Endpoint`, `Data Model`, `Runbook`, `Playbook`, `Audit`, `Threat Model`

## Maintenance

- Update `log.md` with significant changes
- Regenerate `index.md` files in subdirectories when adding concepts
- Keep frontmatter `timestamp` current on meaningful edits
- Run `npm run validate:okf` (when available) to check conformance

## Tooling Compatibility

This bundle is designed to be:
- **Human-readable**: Plain Markdown + YAML frontmatter
- **Agent-parseable**: Structured frontmatter, standard Markdown links
- **Git-diffable**: Line-oriented text files
- **OpenCode-compatible**: Follows project conventions in `AGENTS.md` and `.codex/`
- **Portable**: No external dependencies, works with any Markdown viewer