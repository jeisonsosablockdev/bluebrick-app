import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ id, className, children, ...props }: CardProps) {
  return (
    <article
      id={id}
      className={cn("glass-interactive-card rounded-2xl border border-white/10 bg-panel p-5", className)}
      {...props}
    >
      {children}
    </article>
  );
}
