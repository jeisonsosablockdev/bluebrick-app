---
type: Reference
title: API Reference
description: API endpoints, RPC methods, and schemas for BRIDS platform
tags: [api, endpoints, rpc, schemas, rest, solana, metaplex]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api
---

# API Reference

## REST Endpoints

### Admin
* [Admin Assets API](endpoints/admin-assets.md) — Asset creation, upload, deploy, marketplace handoff
* [Collections API](endpoints/collections.md) — Admin collection detail with ownership verification
* [Mint Orchestrator API](endpoints/mint-orchestrator.md) — Batch mint job orchestration

### Public / User
* [Marketplace API](endpoints/marketplace.md) — Public property/collection discovery
* [Purchase Flow API](endpoints/purchase-flow.md) — User mint flow: quote → challenge → prepare → submit
* [Stake Distribution API](endpoints/stake-distribution.md) — Stake/unstake + admin distribution prep
* [Auth API](endpoints/auth.md) — WorkOS, SIWS, session, wallet linking

### Internal / Webhooks
* [Webhooks](endpoints/webhooks.md) — Helius, Stripe, Airwallex event ingestion

## GraphQL / RPC

* [Solana RPC Methods](rpc/solana-methods.md) — Core devnet RPC patterns
* [Metaplex Core RPC](rpc/metaplex-core.md) — Core program instructions & plugins

## Schemas

* [Content Frontmatter Schema](schemas/content-frontmatter.schema.json) — OKF frontmatter validation
* [Purchase Webhook Events](schemas/purchase-webhook-events.md) — Helius/Stripe/Airwallex schemas
* [Marketplace Entry Schema](schemas/marketplace-entry.md) — marketplace_entries DB model