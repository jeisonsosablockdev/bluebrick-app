---
type: Runbook
title: Database Migration Rollback
description: Runbook for rolling back failed or problematic database migrations
tags: [operations, runbook, database, migration, rollback, postgresql]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/db/migrations
---

# Database Migration Rollback

## Trigger
- Migration fails in CI/CD
- Migration succeeds but causes application errors
- Schema change breaks existing functionality

## Pre-Rollback Checks

### 1. Identify Failed Migration
```bash
# Check migration status
npm run db:migrate:status

# Or query directly
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### 2. Assess Impact
- Is data loss possible? (DROP COLUMN, DROP TABLE)
- Are there dependent objects? (views, functions, foreign keys)
- Can application tolerate rollback downtime?

### 3. Backup (if possible)
```bash
# Quick schema-only backup
pg_dump --schema-only $DATABASE_URL > rollback-backup-$(date +%s).sql
```

## Rollback Procedure

### Option A: Down Migration (Preferred)
If migration has `DOWN` script:
```bash
# Rollback specific migration
npm run db:migrate:down -- --to <previous_version>

# Or using raw SQL
psql $DATABASE_URL -f db/migrations/<version>_<name>.down.sql
```

### Option B: Manual Revert
If no `DOWN` script:
1. Create reversal migration:
   ```bash
   # Create new migration file
   db/migrations/$(date +%s)_rollback_<name>.sql
   ```
2. Write inverse operations (ADD COLUMN, CREATE INDEX, etc.)
3. Apply: `npm run db:migrate`

### Option C: Point-in-Time Recovery (Emergency)
If data corruption:
```bash
# Restore from PITR (if using managed PG)
# Or restore from latest backup
pg_restore -d $DATABASE_URL backup.dump
```

## Post-Rollback
1. Verify schema: `npm run db:migrate:status`
2. Run application tests: `npm test`
3. Check application logs for errors
4. Update migration tracking table if manual

## Prevention
- Always write `DOWN` migrations
- Test migrations on staging first
- Use `npm run validate:db` in CI
- Keep migrations small and reversible

## Related
- [Database Migrations](../database/index.md)
- [Migration Tooling](../scripts/db-migrate.js)
- [Validate DB](../scripts/db-validate.js)