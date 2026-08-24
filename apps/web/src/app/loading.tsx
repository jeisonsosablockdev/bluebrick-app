/**
 * @file apps/web/src/app/loading.tsx
 * @description Layer 1: Presentation - Starter loading boundary skeleton.
 */

export default function Loading() {
  // Step 1: Render loading spinner centered in page
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}
