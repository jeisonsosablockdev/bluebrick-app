---
id: feature-solana-dev-skill-implementation
title: Implementation plan for solana-dev skill in-repo installation
status: approved
scope: tooling
source_branch: feature/shared-solana-dev-skill
source_feature: feature-solana-dev-skill
created_at: 2026-06-14
updated_at: 2026-06-14
---

# Implementation: Solana Dev Skill In-Repo

## Overview

Install the official `solana-dev` skill from Solana Foundation into `.agents/skills/solana-dev/` using the `skills` CLI tool.

## Steps

### 1. Install Skill
```bash
npx skills add https://github.com/solana-foundation/solana-dev-skill -y
```
- Clones upstream repo
- Runs security assessments (Gen, Socket, Snyk)
- Copies to `.agents/skills/solana-dev/` (project-local)
- Registers with all supported agents (OpenCode, Amp, Cline, etc.)

### 2. Verify Installation
```bash
ls -la .agents/skills/solana-dev/
# Should contain SKILL.md + references/ directory
```

### 3. Commit Changes
```bash
git add .agents/skills/solana-dev
git commit -m "feature(shared): add solana-dev skill from solana-foundation"
```

### 4. Create Governance Artifacts
- `docs/features/feature-solana-dev-skill.md` (problem statement)
- `docs/features/feature-solana-dev-skill-implementation.md` (this file)

## Validation

All standard validation gates must pass:
- `npm run lint` ✓
- `npm run typecheck` ✓
- `npm run validate:db` ✓
- `npm run validate:content` ✓
- `npm run validate:pipeline` ✓
- `npm run validate:routes` ✓
- `npm run validate:seo` ✓
- `npm run validate:schema` ✓
- `npm run validate:ai` ✓
- `npm run validate:feeds` ✓
- `npm run validate:operability` ✓
- `npm run validate:knowledge` ✓
- `npm run validate:workflow` ✓
- `npm run validate:docs-governance` ✓ (requires both artifacts)

## Security

Skill security assessment results (from skills.sh):
- **Gen**: Safe
- **Socket**: 0 alerts
- **Snyk**: Medium Risk (reviewed - no critical vulnerabilities affecting usage)

## Rollback

If issues arise:
```bash
git rm -r .agents/skills/solana-dev
git commit -m "revert: remove solana-dev skill"
```

## Traceability

- Upstream: `solana-foundation/solana-dev-skill`
- Branch: `feature/shared-solana-dev-skill`
- Commit: `feature(shared): add solana-dev skill from solana-foundation`
- Skill location: `.agents/skills/solana-dev/`
- References: 26 files covering Anchor, Pinocchio, @solana/kit, testing, RPC, security

## Status

Approved — implementation complete, pending final validation + Human Acceptance.