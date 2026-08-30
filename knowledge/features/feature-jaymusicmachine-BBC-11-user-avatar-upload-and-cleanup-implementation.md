# Solution Spec: user-avatar-upload-and-cleanup Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `api`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The solution implements a complete end-to-end user avatar upload pipeline with automatic old blob cleanup, structured across the 4 canonical functional layers:

1. **Layer 1: Presentation**
   - `apps/web/src/components/profile/avatar-upload-modal.tsx`: Interactive dialog with file picker, instant client-side preview (`URL.createObjectURL`), drag-and-drop support, upload progress state, localized error alerts, and submission to `uploadAvatarAction`.
   - `apps/web/src/components/dashboard/investment-dashboard.tsx`: Connects the avatar trigger button in the dashboard header to `AvatarUploadModal`, and dynamically updates local user state upon successful avatar replacement.
2. **Layer 2: Application / Consumption**
   - `apps/web/src/lib/auth/avatar-actions.ts`: Server action `uploadAvatarAction(formData: FormData)` extracting the uploaded `File`, authenticating the active session via WorkOS session helper, executing `uploadInvestorAvatarPipeline`, and revalidating dashboard routes.
   - `apps/web/src/app/api/avatar/upload/route.ts`: Optional API route endpoint supporting multipart avatar uploads with authentication and error handling.
3. **Layer 3: Domain & Pipelines**
   - `apps/web/src/lib/pipelines/blob-storage-pipeline.ts`: Core domain pipeline `uploadInvestorAvatarPipeline(userId, file, options, uploader, userRepo)`:
     - Step 1: Validates MIME type (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and file size (<= 5 MB).
     - Step 2: Generates clean unique pathname `avatars/${userId}-${Date.now()}.${extension}`.
     - Step 3: Uploads the new blob via `uploader.put(pathname, buffer, { access: 'public' })`.
     - Step 4: If `oldAvatarUrl` is provided and originates from Vercel Blob (`isVercelBlobUrl`), calls `uploader.del(oldAvatarUrl)` safely with try/catch to avoid breaking the upload if the old file is missing.
     - Step 5: Updates the user record in the database via `userRepo.updateAvatarUrl(userId, newUrl)`.
     - Step 6: Returns domain `UploadResult` with the new URL and metadata.
   - `apps/web/src/features/i18n/domain/dictionaries/{es,en,pt}.ts`: Dictionary localization entries for avatar modal texts, button labels, file constraints, and error messages.
4. **Layer 4: Infrastructure**
   - `apps/web/src/lib/infrastructure/blob/vercel-blob-client.ts`: Vercel Blob adapter implementing `VercelBlobUploader` interface with `put` and `del` methods wrapping `@vercel/blob` SDK functions (`put`, `del`).
   - `apps/web/src/lib/infrastructure/db/repositories/user-repository.ts`: Enhances `UserRepository` with `updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<DbUser | null>`.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Avatar Upload Pipeline, Old Blob Cleanup & Infrastructure Integration (Branch: `SPEC/jaymusicmachine-BBC-11-s01-avatar-upload-and-cleanup`)
  - **Fase RED (TDD)**: Test suite covering `VercelBlobClient` (`put` and `del`), `uploadInvestorAvatarPipeline` (validations, upload, old blob deletion with safety checks, database update), `UserRepository.updateAvatarUrl`, and `AvatarUploadModal` UI component rendering and upload actions.
  - **Fase GREEN**: Implementation of infrastructure `del()` support, domain pipeline with old blob detection and deletion, user repository update query, server action `uploadAvatarAction`, and UI integration in `AvatarUploadModal` and `InvestmentDashboard` with mandatory in-code commentary.
  - **Fase REFACTOR**: Clean code refactoring pass (`code-refactoring-refactor-clean`), eliminating duplicate checks, verifying 4-layer boundary isolation, typecheck, linting, and full harness validation (`pnpm validate`).

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/avatar-upload-and-cleanup.test.ts` & `tests/unit/avatar-upload-modal.test.tsx`
- **Command**: `pnpm test tests/unit/avatar-upload-and-cleanup.test.ts`
- **Assertion Goals**:
  - Test `VercelBlobClient.del()` invokes `@vercel/blob` `del()` correctly with single and multiple URLs.
  - Test `uploadInvestorAvatarPipeline` rejects invalid MIME types (e.g. `text/plain`, `application/pdf`) and files exceeding 5 MB.
  - Test `uploadInvestorAvatarPipeline` successfully uploads new blob, triggers `uploader.del()` for previous Vercel Blob URL, and ignores external non-blob URLs (e.g., Google OAuth photos).
  - Test `uploadInvestorAvatarPipeline` updates PostgreSQL `users` table via `UserRepository.updateAvatarUrl`.
  - Test `AvatarUploadModal` renders file selector, preview, upload trigger, error handling, and invokes the upload action seamlessly.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-11-user-avatar-upload-and-cleanup.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-11-user-avatar-upload-and-cleanup.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-11-user-avatar-upload-and-cleanup-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-11-user-avatar-upload-and-cleanup-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-11](https://linear.app/brids-app/issue/BBC-11)
