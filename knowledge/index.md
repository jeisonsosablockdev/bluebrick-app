---
okf_version: "0.1"
title: BRIDS Knowledge Catalog
description: Open Knowledge Format (OKF) bundle for the BRIDS project - architecture, features, APIs, database, operations, security, and knowledge management.
tags: [brids, solana, nft, marketplace, real-estate, blockchain, knowledge-management]
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
├── fixes/                      # Fix specifications and implementations
├── api/                        # API endpoints, schemas, RPC methods
├── database/                   # Database migrations and data models
├── operations/                 # Runbooks, playbooks, procedures
├── security/                   # Security audits, threat models, compliance
├── rfcs/                       # RFC documents by epic
├── guides/                     # Implementation guides
├── mapbox/                     # Mapbox configurations
├── templates/                  # Templates for RFCs, slice planning, imports
├── knowledge/                  # Knowledge management (inbox, archive, proposals, reports)
│   ├── index.md               # Knowledge management index
│   ├── inbox/                 # Raw knowledge captures
│   ├── archive/               # Historical knowledge items
│   ├── proposals/             # Improvement proposals
│   ├── reports/               # Governance drift and change reports
│   └── templates/             # Knowledge capture templates
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
* [Authority Model](architecture/authority-model.md)
* [Rotation Spec](architecture/rotation-spec.md)
* [State Machine](architecture/state-machine.md)
* [Auth Flow](architecture/auth-flow.md)
* [Devnet Proof](architecture/devnet-proof.md)
* [NFT Spec](architecture/nft-spec.md)
* [Purchase Tracing](architecture/purchase-tracing.md)
* [RBAC](architecture/rbac.md)
* [Threat Model](architecture/threat-model.md)
* [Toolchain Policy](architecture/toolchain-policy.md)

### Features
* [BRI-5: Discovery Brief](features/bri-5/)
* [BRI-10: Contextual Hints](features/bri-10/)
* [BRI-12: Wallet Connection](features/bri-12/)
* [BRI-16: Referral Marketing](features/bri-16/)
* [BRI-39: Home Copy](features/bri-39/)
* [BRI-61/62: GitFlow PR Structure](features/bri-61/)
* [BRI-63-68: Various Fixes](features/bri-63/)
* [BRI-79: Collections Health](features/bri-79/)
* [BRI-92-99: Collection UI](features/bri-92/)
* [BRI-100-114: Collections Details](features/bri-100/)
* [BRI-121: Splash Screen](features/bri-121/)
* [BRI-123: CleanCode](features/bri-123/)
* [BRI-124: Location Form](features/bri-124/)
* [BRI-143: Knowledge Promotion](features/bri-143/)
* [BRI-144: Next Proxy](features/bri-144/)
* [BRI-149: Slice Planning](features/bri-149/)
* [BRI-151: Profile Completion](features/bri-151/)
* [BRI-152: Hide Release Modules](features/bri-152/)
* [BRI-153: Various Fixes](features/bri-153/)
* [BRI-154: Hybrid Auth](features/bri-154/)
* [BRI-156: DB Migration](features/bri-156/)
* [BRI-157: PWA Push](features/bri-157/)
* [BRI-159: Hybrid Auth Clean Code](features/bri-159-feature-shared-hybrid-auth-clean-code/)
* [BRI-160: Wallet Modal CleanCode](features/bri-160/)
* [BRI-163: Motion 12 Polish](features/bri-163/)
* [BRI-164: Marketplace 3D Visual](features/bri-164-marketplace-3d-visual/)
* [BRI-164: Media Carousel](features/bri-164-media-carousel/)
* [BRI-165: AdminAssetsNew Fixes](features/bri-165/)
* [BRI-167: Phantom Autoconnect](features/bri-167/)
* [BRI-170: Stake Fixes](features/bri-170/)
* [BRI-171: Investor Dashboard](features/bri-171/)
* [BRI-173: Branching Policy](features/bri-173/)
* [BRI-174: Investor Portfolio](features/bri-174/)
* [BRI-177: Business Logic Reasoner](features/bri-177/)
* [Epic 010: AI Discovery](features/epic-010/)
* [Epic 011: Admin Collections](features/epic-011/)
* [Epic 003: NFT Purchase](features/epic-003/)
* [Solana Dev Skill](features/feature-solana-dev-skill.md)
* [App Checkout Dual Crypto](features/feature-app-checkout-dual-crypto-airwallex.md)
* [App Image Storage](features/feature-app-image-storage-blob-pinata.md)
* [App Mobile Pill](features/feature-app-mobile-pill-phantom.md)
* [App Quick Tour](features/feature-app-quick-tour.md)
* [App Transparency](features/feature-app-transparency.md)
* [App Wallet Connection](features/feature-app-wallet-connection-solanakit-bri-12.md)
* [App Wide Motion 12](features/feature-app-wide-motion-12-ux-polish-bri-163.md)
* [Business Logic Reasoner](features/feature-business-logic-reasoner-bri-177.md)
* [NFT Authority Lifecycle](features/feature-nft-authority-lifecycle-rotation-revocation.md)
* [NFT Economic AppData](features/feature-nft-economic-appdata-plugin.md)
* [NFT Permanent Transfer](features/feature-nft-permanent-transfer-delegate.md)
* [Redirect First Connection](features/feature-redirect-first-connection.md)
* [Shared Agents Orchestration](features/feature-shared-agents-orchestration-enforcement-bri-157.md)
* [Shared Human Acceptance](features/feature-shared-human-acceptance-gated-merge.md)
* [Shared Nix Toolchain](features/feature-shared-nix-toolchain-policy.md)
* [Shared PR Governance](features/feature-shared-pr-governance-flow-flexibility.md)
* [Shared PR Metadata Race Fix](features/feature-shared-pr-governance-metadata-race-fix.md)
* [Shared PWA Push](features/feature-shared-pwa-web-push-bri-157.md)
* [Shared Referral Marketing](features/feature-shared-referral-marketing-system-bri-16.md)
* [Shared Slice Planning](features/feature-shared-single-issue-slice-planning-bri-149.md)
* [Shared Wallet Modal CleanCode](features/feature-shared-wallet-modal-clean-code-bri-160.md)
* [Stake Reconciliation](features/bri-6-stake-reconciliation/)

### Fixes
* [BRI-6: Admin Distributions](fixes/bri-6/)
* [BRI-158: SEO/Web Vitals](fixes/bri-158/)
* [BRI-162: Vercel Alias](fixes/bri-162/)
* [BRI-164: Marketplace Fixes](fixes/bri-164/)
* [BRI-165: AdminAssetsNew](fixes/bri-165/)
* [BRI-167: Phantom Autoconnect](fixes/bri-167/)
* [BRI-169: Collections UI](fixes/bri-169/)
* [BRI-170: Stake Fixes](fixes/bri-170/)
* [BRI-171: Investor Overview](fixes/bri-171/)
* [Other Fixes](fixes/other/)

### API
* [REST Endpoints](api/endpoints/)
* [Solana RPC Methods](api/rpc/solana-methods.md)
* [Metaplex Core RPC](api/rpc/metaplex-core.md)
* [Schemas](api/schemas/)

### Database
* [Migrations](database/migrations/)
* [Data Models](database/models/)

### Operations
* [Runbooks](operations/runbooks/)
* [Playbooks](operations/playbooks/)
* [Procedures](operations/procedures/)

### Security
* [Threat Models](security/threat-models/)
* [Audits](security/audits/)
* [Vulnerabilities](security/vulnerabilities/)
* [Compliance](security/compliance/)

### RFCs
* [Epics 001-013](rfcs/)
* [Templates](rfcs/templates/)

### Guides
* [12 Implementation Guides](guides/)

### Mapbox
* [Configurations](mapbox/)

### Templates
* [RFC Templates](templates/rfcs/)
* [Slice Planning](templates/linear-single-issue-slices.template.md)
* [Admin Import CSV](templates/admin-asset-import-all-fields-template.csv)

### Knowledge Management
* [Knowledge Index](knowledge/index.md) — Inbox, archive, proposals, reports, templates
* [Inbox](knowledge/inbox/) — Raw captures from development
* [Archive](knowledge/archive/) — Historical items
* [Proposals](knowledge/proposals/) — Improvement proposals
* [Reports](knowledge/reports/) — Governance drift & change reports
* [Templates](knowledge/templates/) — Capture templates

## Conventions

- **Concept IDs**: Path without `.md` suffix (e.g., `governance/documentation-policy`)
- **Cross-links**: Use bundle-relative links starting with `/` (e.g., `/governance/documentation-policy.md`)
- **Frontmatter**: Every concept file has YAML frontmatter with `type`, `title`, `description`, `tags`, `timestamp`
- **Types**: `Policy`, `ADR`, `Feature Spec`, `Implementation Guide`, `API Endpoint`, `Data Model`, `Runbook`, `Playbook`, `Audit`, `Threat Model`, `Reference`, `Template`, `Knowledge Item`, `Report`, `Fix Spec`, `Fix Index`, `Feature Index`, `Compliance`, `Spec`

## Maintenance

- Update `log.md` with significant changes
- Regenerate `index.md` files in subdirectories when adding concepts
- Keep frontmatter `timestamp` current on meaningful edits
- Run `npm run validate:okf` to check conformance

## Tooling Compatibility

This bundle is designed to be:
- **Human-readable**: Plain Markdown + YAML frontmatter
- **Agent-parseable**: Structured frontmatter, standard Markdown links
- **Git-diffable**: Line-oriented text files
- **OpenCode-compatible**: Follows project conventions in `AGENTS.md` and `.codex/`
- **Portable**: No external dependencies, works with any Markdown viewer