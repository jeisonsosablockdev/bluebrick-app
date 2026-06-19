#!/usr/bin/env node
/**
 * Sync docs/auth-flow.md to knowledge/architecture/auth-flow.md with OKF frontmatter
 */

import { readFileSync, writeFileSync } from 'fs';

const source = 'docs/auth-flow.md';
const target = 'knowledge/architecture/auth-flow.md';

const content = readFileSync(source, 'utf-8');

const frontmatter = `---
type: ADR
title: Auth Flow — Hybrid WorkOS + SIWS
description: Complete authentication architecture for BRIDS — WorkOS AuthKit account entry, Phantom SIWS wallet auth, hybrid composition, trust boundaries, replay protection, endpoint map, and all feature-specific boundary confirmations (BRI-151 through BRI-174)
tags: [architecture, auth, workos, siws, phantom, hybrid, rbac, security, trust-boundaries, session, cookies]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/auth-flow.md
---

`;

writeFileSync(target, frontmatter + content);
console.log(`Synced ${source} -> ${target}`);