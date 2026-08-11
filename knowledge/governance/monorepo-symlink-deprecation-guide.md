# Monorepo Symlink Deprecation & Root Hygiene Policy

## Canonical SSOT Overview
This document defines the official, non-destructive migration strategy for deprecating root symlinks (`/components`, `/content`, `/lib`, `/public`, `/schemas`) in favor of direct subproject paths (`apps/web/src/...`) and standard TypeScript aliases (`@/*`).

---

## Target Monorepo Structure

The canonical, physical home for all web application code and assets is strictly scoped under `apps/web/src/` and `apps/web/public/`:

| Module Scope | Physical Target Path | Alias Mapping (`tsconfig.json`) |
| :--- | :--- | :--- |
| **Components** | `apps/web/src/components` | `@/components/*` |
| **Content & MDX** | `apps/web/src/content` | `@/content/*` |
| **Library & Utilities** | `apps/web/src/lib` | `@/lib/*` |
| **Zod Schemas** | `apps/web/src/schemas` | `@/schemas/*` |
| **Public Assets** | `apps/web/public` | N/A (Server static asset root) |
| **App Router** | `app/` (Root physical router) | `@/app/*` |

---

## 4-Phase Non-Destructive Migration Plan

### Phase 1: Alias Normalization & Resolver Alignment
- **`tsconfig.json`**: Ensure `"@/*": ["./apps/web/src/*", "./*"]` resolves `@/lib/...`, `@/components/...`, and `@/schemas/...` to `apps/web/src/`.
- **`vitest.config.ts`**: Register explicit aliases for `@/scripts`, `@/tests`, and `@`.

### Phase 2: Programmatic Import Migration (`scripts/ci/migrate-symlink-imports.ts`)
Programmatically scan and update legacy relative imports in `scripts/`, `tests/`, and `next.config.ts`:
- **Legacy**: `import { ... } from "../lib/..."`
- **Canonical**: `import { ... } from "../apps/web/src/lib/..."` or `import { ... } from "@/lib/..."`

### Phase 3: Diagnostic Verification & Health Check
Run the automated migration checker:
```bash
npx tsx ./scripts/ci/check-root-symlink-migration.ts
```
The script verifies:
1. Active symlink usage in root.
2. Lingering relative import paths in `scripts/` and `tests/`.
3. Complete `pnpm validate` green status before deprecation.

### Phase 4: Sequential Symlink Removal
Deprecate symlinks one by one in isolated quality passes:
1. `rm schemas` ➔ `pnpm validate`
2. `rm content` ➔ `pnpm validate`
3. `rm lib` ➔ `pnpm validate`
4. `rm components` ➔ `pnpm validate`
5. `rm public` (after configuring static asset root in `next.config.ts`) ➔ `pnpm validate`

---

## Verification & Guardrails
- **CI Automated Check**: `scripts/ci/check-root-symlink-migration.ts` MUST return exit code 0.
- **Zero Runtime Downtime**: `curl -I http://localhost:3001` MUST return `HTTP 200 OK`.
- **Zero Broken Tests**: `pnpm validate` MUST pass 100% GREEN (0 errors across all 18 quality suites).
