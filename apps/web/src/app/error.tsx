/**
 * @file apps/web/src/app/error.tsx
 * @description Layer 1: Presentation - Starter error boundary component.
 */

"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Step 1: Log error details to console
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center">
      <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
      <p className="max-w-md text-sm text-neutral-400">
        An unexpected application error occurred. You can retry the previous action below.
      </p>
      <Button variant="primary" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
