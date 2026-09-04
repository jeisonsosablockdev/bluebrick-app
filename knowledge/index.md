---
okf_version: "0.1"
title: Knowledge Catalog
description: Open Knowledge Format (OKF) bundle for Next.js + Solana starter — architecture, governance, APIs, database, and features.
tags: [knowledge, solana, nextjs, architecture, governance]
timestamp: 2026-08-23T00:00:00Z
---

# Knowledge Catalog

Open Knowledge Format (**OKF v0.1**) repository for architecture specifications, governance policies, and task lifecycles.

## Directory Map

```
knowledge/
├── index.md                    # Root catalog index
├── governance/                 # Canonical policies and quality rules
├── architecture/               # System architecture and ADRs
├── features/                   # Feature specifications (dual problem/solution artifacts)
├── fixes/                      # Bugfix specifications (dual problem/solution artifacts)
├── api/                        # API schemas, endpoints, and contracts
├── database/                   # Database schemas and data models
├── security/                   # Security audits, threat models, compliance
├── templates/                  # Scaffolding templates for features, fixes, and RFCs
├── assets/                     # Brand graphics, icons, and media assets
└── guides/                     # Implementation guides
```

## Quick Navigation

### Brand & Design Assets
* [Brand Assets & Visual Identity Specification](assets/brand/README.md)

### Governance
* [Documentation Policy](governance/documentation-policy.md)
* [Git Monorepo Policy](governance/git-monorepo-policy.md)
* [Frontend UI Policy](governance/frontend-ui-policy.md)
* [NFT Policy](governance/nft-policy.md)
* [Security Quality Policy](governance/security-quality-policy.md)
* [PR Policy Source of Truth](governance/pr-policy-source-of-truth.json)

### Architecture
* [Architecture Index](architecture/index.md)
* [Architecture Overview](architecture/architecture-overview.md)
* [State Machine](architecture/state-machine.md)
* [Auth Flow](architecture/auth-flow.md)
* [Session Model](architecture/session-model.md)
* [Authority Model](architecture/authority-model.md)
* [Devnet Proof](architecture/devnet-proof.md)
* [NFT Spec](architecture/nft-spec.md)
* [Solana Stack](architecture/solana-stack.md)
* [Threat Model](architecture/threat-model.md)
* [Toolchain Policy](architecture/toolchain-policy.md)
