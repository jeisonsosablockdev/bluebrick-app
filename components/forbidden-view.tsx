import Link from "next/link";

import { Card } from "@/components/ui/card";

type ForbiddenViewProps = {
  heading?: string;
  description?: string;
};

export function ForbiddenView({
  heading = "403 Forbidden",
  description = "You do not have permission to access this resource."
}: ForbiddenViewProps) {
  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-4 py-8 md:px-6">
      <Card className="w-full space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-red-300">Access denied</p>
        <h1 className="text-3xl font-semibold text-white">{heading}</h1>
        <p className="text-sm text-white/80">{description}</p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95"
        >
          Back to home
        </Link>
      </Card>
    </main>
  );
}
