---
type: ADR
title: Database Architecture & Models Index
description: Database architecture, persistence layer specifications, relational data models, and migration policies.
tags: [database, schema, persistence, models]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Database Architecture

Open Knowledge Format catalog for database schemas, models, and migrations.

## Persistence Invariants
1. **Layer Isolation**: Presentation components and hooks must NEVER import database drivers directly.
2. **Migrations**: All schema mutations must be tracked via timestamped migrations and validated through CI.
3. **Idempotency**: All mutation handlers must enforce idempotency keys to prevent double execution.

## Subdirectories
- [Models](./models/index.md): Entity relationship specifications and table schemas.
