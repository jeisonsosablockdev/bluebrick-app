# Solution Spec: digest-implementation-fixes Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `db` (for DB issues) and `api` / `ai-architect` (for digest pipeline issues)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (where applicable)

## 2. Solution Overview & 4-Layer Architecture
1. **Presentation Layer**: No direct UI changes.
2. **Application/Consumption Layer**: 
   - Migrate Edge middleware entrypoint from `apps/web/src/middleware.ts` to `apps/web/src/proxy.ts` conforming to Next.js 16 conventions.
   - Maintain AuthKit session cookie inspection and transparent token refreshing.
3. **Domain/Pipelines/Services Layer**: 
   - Maintain user synchronization pipeline intact.
4. **Infrastructure Layer**: 
   - Prune legacy wallet adapter dependencies.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Fix Database Name Resolution and WorkOS Middleware Session Handling in `UserRepository` & `DashboardPage` (Rama: `SPEC/jeisonsosa-BBC-008-s01-fix-login-db`)
- **SPEC-2**: Remove Solana Wallet Adapters and Clean Up Presentation / Hook Dependencies (Rama: `SPEC/jeisonsosa-BBC-008-s02-remove-solana-adapters`)
- **SPEC-3**: Migrate `middleware.ts` to `proxy.ts` conforming to Next.js 16 conventions (Rama: `SPEC/jeisonsosa-BBC-008-s03-migrate-middleware-to-proxy`)

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/workos-auth-structural.test.ts`
- **Command**: `pnpm test`
- **Assertion Goals**: Verify `apps/web/src/proxy.ts` physically exists on disk and `apps/web/src/middleware.ts` is deleted (avoiding Next.js 16 E900 conflict). Ensure `withAuth` and routes continue to function seamlessly.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jeisonsosa-BBC-008-digest-implementation-fixes.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes.md)
- **Solution Spec**: [fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md)
- **Linear Issue**: Omitido por solicitud (BBC-008)
