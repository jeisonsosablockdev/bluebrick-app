/**
 * @file apps/web/src/app/not-found.tsx
 * @description Layer 1: Presentation - Starter 404 Not Found page.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  // Step 1: Render 404 response UI with return link
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center">
      <h2 className="text-4xl font-extrabold text-white">404</h2>
      <p className="text-sm text-neutral-400">The requested page could not be found.</p>
      <Link href="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}
