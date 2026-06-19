---
type: Procedure
title: Backup and Restore
description: Backup and restore procedures for database and application state
tags: [operations, procedure, backup, restore, postgresql, disaster-recovery, vercel]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/deploy
---

# Backup and Restore Procedure

## Backup Strategy

### Database (PostgreSQL)

#### Automated (Managed PG - Vercel/Neon/Supabase)
- **Continuous**: Point-in-time recovery (PITR) enabled
- **Retention**: 7 days (configurable)
- **Frequency**: Continuous WAL archiving

#### Manual Backups
```bash
# Schema + data (full)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Schema only (for migrations)
pg_dump --schema-only $DATABASE_URL > schema-backup-$(date +%Y%m%d).sql

# Data only (specific tables)
pg_dump --data-only --table=purchase_attempts --table=marketplace_entries $DATABASE_URL > data-backup.sql
```

#### Backup Schedule
| Type | Frequency | Retention |
|------|-----------|-----------|
| Full (schema+data) | Daily 02:00 UTC | 30 days |
| Schema only | On each migration | 90 days |
| Critical tables | Hourly | 7 days |

### Application State

#### Vercel
- **Deployments**: Immutable, auto-retained (last 100)
- **Environment Variables**: Versioned in Vercel Dashboard
- **Edge Config**: Synced from repo

#### Uploaded Files (Vercel Blob / Pinata)
- **Vercel Blob**: Automatic replication, 30-day retention for unused
- **Pinata/IPFS**: Permanent (content-addressed)
- **Metadata**: Stored in DB, backed up with schema

#### Secrets
- **Vercel Env**: Encrypted at rest, access-controlled
- **Rotation**: Documented in [Secret Rotation](../architecture/rotation-spec.md)

## Restore Procedures

### Database Restore

#### Option 1: PITR (Preferred for recent issues)
```bash
# Via managed provider dashboard (Vercel/Neon/Supabase)
# 1. Go to Database → Backups → Point-in-time recovery
# 2. Select timestamp before incident
# 3. Initiate restore to new database
# 4. Update DATABASE_URL to new endpoint
```

#### Option 2: Full Restore from Dump
```bash
# 1. Create new database
createdb brids_restore

# 2. Restore
psql $NEW_DATABASE_URL < backup-20260115-020000.sql

# 3. Verify
psql $NEW_DATABASE_URL -c "SELECT count(*) FROM purchase_attempts;"
psql $NEW_DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# 4. Switch traffic (update DNS/ENV)
```

#### Option 3: Schema + Selective Data
```bash
# 1. Restore schema
psql $NEW_DATABASE_URL < schema-backup-20260115.sql

# 2. Restore critical data only
psql $NEW_DATABASE_URL < data-backup.sql

# 4. Run pending migrations
npm run db:migrate
```

### Application Restore

#### Vercel Rollback
```bash
# Quick: Promote previous deployment
vercel promote <previous-deployment-url> --token=$VERCEL_TOKEN

# Or: Revert git commit
git revert <bad-commit>
git push origin develop
```

#### Environment Variables
```bash
# Export current
vercel env pull .env.production --token=$VERCEL_TOKEN

# Restore to new project
vercel env add <KEY> production <VALUE> --token=$VERCEL_TOKEN
```

### Secrets Restore
1. Rotate compromised secrets immediately
2. Update in Vercel Dashboard
3. Redeploy affected services
4. Verify all integrations (Stripe, Helius, Pinata, etc.)

## Disaster Recovery Scenarios

### Scenario 1: Database Corruption (Last 1 hour)
**Action**: PITR to 5 min before corruption
**RTO**: < 15 min
**RPO**: < 5 min

### Scenario 2: Bad Migration Deployed
**Action**: 
1. Rollback migration (`npm run db:migrate:down`)
2. Vercel rollback to previous deployment
3. Verify data integrity
**RTO**: < 30 min
**RPO**: 0 (migration is reversible)

### Scenario 3: Vercel Account/Project Loss
**Action**:
1. Create new Vercel project
2. Connect GitHub repo
3
3. Restore env vars from backup
4. Update DNS
**RTO**: < 1 hour
**RPO**: 0 (git is source of truth)

### Scenario 4: Regional Outage (Vercel/AWS)
**Action**:
1. Verify multi-region (Vercel is multi-region by default)
2. Check status.vercel.com
3. Failover automatic for edge functions
**RTO**: Automatic (< 5 min)
**RPO**: 0

## Verification Checklist

### Post-Restore Validation
- [ ] Database accessible, migrations current
- [ ] `/api/health` returns `ok`
- [ ] `/api/health/db` returns `ok`
- [ ] Sample queries work (purchase, marketplace, users)
- [ ] Vercel deployment active, no build errors
- [ ] Auth flow works (SIWS + WorkOS)
- [ ] Purchase flow works end-to-end
- [ ] Stake/unstake works
- [ ] Admin panel accessible
- [ ] Webhooks receiving (Helius, Stripe)

### Data Integrity Checks
```sql
-- Referential integrity
SELECT * FROM purchase_attempts pa
LEFT JOIN purchase_challenges pc ON pa.challenge_id = pc.id
WHERE pc.id IS NULL AND pa.challenge_id IS NOT NULL;

-- Orphaned uploads
SELECT * FROM asset_uploaded_files
WHERE promoted_at IS NULL AND created_at < NOW() - INTERVAL '24 hours';

-- Stake profile consistency
SELECT * FROM user_profile_stake_events
WHERE wallet_public_key NOT IN (SELECT wallet_public_key FROM user_profiles);
```

## Backup Testing
- **Monthly**: Test restore to staging environment
- **Quarterly**: Full DR drill with team
- **Annual**: Cross-region restore test

## Related
- [DB Migration Rollback](../runbooks/db-migration-rollback.md)
- [Vercel Deployment Rollback](../runbooks/vercel-deployment-rollback.md)
- [Toolchain Policy](../architecture/toolchain-policy.md)