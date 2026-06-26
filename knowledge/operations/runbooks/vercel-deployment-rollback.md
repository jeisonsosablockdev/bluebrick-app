---
type: Runbook
title: Vercel Deployment Rollback
description: Runbook for rolling back a problematic Vercel deployment
tags: [operations, runbook, vercel, deployment, rollback, nextjs]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/deploy
---

# Vercel Deployment Rollback

## Trigger
- New deployment causes errors (500s, build failures, runtime errors)
- Performance regression detected
- Feature flag not working as expected

## Quick Rollback (Vercel Dashboard)

### 1. Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Project → Deployments
2. Find last working deployment (green checkmark)
3. Click `...` → **Promote to Production**
4. Confirm promotion

### 2. Via Vercel CLI
```bash
# List recent deployments
vercel list --token=$VERCEL_TOKEN

# Promote specific deployment
vercel promote <deployment-url> --token=$VERCEL_TOKEN --scope=<team>
```

## Git-Based Rollback (If Needed)

### 1. Revert Commit
```bash
# Find bad commit
git log --oneline -10

# Revert (creates new commit)
git revert <bad-commit-hash>

# Push to trigger new deployment
git push origin develop
```

### 2. Force Push (Emergency Only)
```bash
# DANGEROUS: Rewrites history
git push origin develop --force-with-lease
```

## Verification Checklist
- [ ] Production URL loads without 500s
- [ ] Key user flows work (auth, purchase, admin)
- [ ] No console errors in browser
- [ ] API endpoints respond correctly
- [ ] Database migrations applied (if any)

## Rollback Decision Matrix

| Scenario | Action |
|----------|--------|
| Build fails | Fix build, redeploy (no rollback needed) |
| Runtime errors in new code | Promote previous deployment |
| Performance regression | Promote previous deployment |
| Database migration issue | Rollback migration + promote previous |
| Security vulnerability | Immediate rollback + hotfix |

## Post-Rollback
1. Create incident ticket with root cause
2. Add failing test case
3. Schedule fix deployment
4. Update feature flags if used

## Related
- [Vercel Documentation](https://vercel.com/docs)
- [Git Monorepo Policy](../governance/git-monorepo-policy.md)
- [Release Tagging](../governance/git-monorepo-policy.md#release-tagging-rule)