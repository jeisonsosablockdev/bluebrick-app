# Problem Spec: user-avatar-upload-and-cleanup

## What problem exists
Currently, the avatar upload dialog (`AvatarUploadModal` in `apps/web/src/components/profile/avatar-upload-modal.tsx`) relies on simulated client-side delays (`setTimeout`) and hardcoded fallback URLs rather than executing real storage operations. Furthermore, when investors upload updated profile photos, previous image blobs are never deleted from Vercel Blob storage, resulting in orphaned storage assets, uncontrolled blob count growth, and database/storage desynchronization.

## Why it matters
1. **Blob Storage Health & Cost Efficiency**: Without an automatic cleanup mechanism for previous avatars, every avatar change leaves orphan files indefinitely in Vercel Blob storage, causing unnecessary storage bloat and billing overhead.
2. **User Experience & Profile Integrity**: Investors expect real-time avatar upload with validation (MIME types, maximum size of 5 MB), instant image preview, reliable upload progress feedback, and immediate reflection of their updated avatar in the dashboard navigation header.
3. **Data Consistency**: The avatar URL must be atomically updated in the PostgreSQL `users` table upon successful upload, while handling old blob deletion gracefully without interrupting the user experience if the previous URL was external (e.g., OAuth default) or already pruned.

## What outcome is expected
1. **Real Vercel Blob Upload & Old Blob Pruning**:
   - `uploadInvestorAvatarPipeline` validates the file (MIME types `image/jpeg`, `image/png`, `image/webp`, `image/gif` and max 5 MB).
   - Generates a unique, structured blob pathname (`avatars/{userId}-{timestamp}.{ext}`).
   - Safely detects if the previous avatar URL belongs to Vercel Blob storage (`public.blob.vercel-storage.com` / configured blob store host) and invokes `del(oldAvatarUrl)` to delete the obsolete image blob.
   - Updates the investor record in PostgreSQL via `UserRepository.updateAvatarUrl(userId, newUrl)`.
2. **Robust Infrastructure Client**:
   - `VercelBlobClient` implements both `put` (upload) and `del` (delete) operations matching `@vercel/blob` SDK contracts with full testability via dependency injection.
3. **Interactive & Accessible UI Modal**:
   - `AvatarUploadModal` connects to real server action / endpoint `uploadAvatarAction(formData)`, providing clear upload progress indicators, error boundaries, file validation alerts, and instant local preview update.
4. **Multilingual Dictionary Coverage**:
   - Full dictionary localization in Spanish (`es`), English (`en`), and Portuguese (`pt`) for all modal labels, error messages, and confirmation toasts.
5. **Zero-Regression & 100% Test Coverage**:
   - Complete TDD coverage validating pipeline validation, blob deletion logic, user repository updates, and component interactions.

## What gaps exist today
- `AvatarUploadModal` contained a simulated `setTimeout` mock instead of invoking real upload pipelines.
- `VercelBlobClient` lacked a `del` method implementation for pruning obsolete blobs.
- `UserRepository` lacked a dedicated, atomic `updateAvatarUrl(userId, avatarUrl)` method.
- No end-to-end server action existed to connect the multipart form upload from the browser to the backend blob pipeline and database persistence.

## What questions remain open
- None. Vercel Blob provides native `put()` and `del()` SDK methods compatible with Next.js 16 server actions and server components. External non-blob URLs (such as Google/AuthKit default avatars) are safely skipped during the deletion phase.
