import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <article className={cn("rounded-2xl border border-white/10 bg-panel p-5", className)}>{children}</article>;
}
