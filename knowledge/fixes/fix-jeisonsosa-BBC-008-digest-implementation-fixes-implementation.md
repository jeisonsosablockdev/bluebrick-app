# Solution Spec: digest-implementation-fixes Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `db` (for DB issues) and `api` / `ai-architect` (for digest pipeline issues)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (where applicable)

## 2. Solution Overview & 4-Layer Architecture
1. **Presentation Layer**: No UI changes expected unless surfacing new error states for file uploads.
2. **Application/Consumption Layer**: Ensure upload/digest actions map properly to the underlying API logic.
3. **Domain/Pipelines/Services Layer**: 
   - Refactor the digest logic for file processing to handle edge cases, empty states, and corrupted data gracefully.
   - Remove hardcoded database values (`neondb`) from connection configuration.
4. **Infrastructure Layer**: 
   - Update `UserRepository.findById` and Database connection instance to dynamically use the `DATABASE_URL` instead of static database name.
   - Patch file storage/retrieval implementations that participate in the digest pipeline.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Fix Database Name Resolution and WorkOS Middleware Session Handling in `UserRepository` & `DashboardPage` (Rama: `SPEC/jeisonsosa-BBC-008-s01-fix-login-db`)
- **SPEC-2**: Remove Solana Wallet Adapters and Clean Up Presentation / Hook Dependencies (Rama: `SPEC/jeisonsosa-BBC-008-s02-remove-solana-adapters`)

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `apps/web/src/lib/infrastructure/db/repositories/__tests__/user-repository.test.ts` and `apps/web/src/lib/pipelines/__tests__/digest.test.ts`
- **Command**: `pnpm test`
- **Assertion Goals**: Verify `UserRepository.findById` queries properly without throwing "database neondb does not exist". Verify that file digest algorithms correctly handle all file inputs without throwing unhandled exceptions.

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
