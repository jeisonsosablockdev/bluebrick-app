import { cn } from "@/lib/utils";

export type TextProps = {
  className?: string;
  children: React.ReactNode;
};

export function H1({ className, children }: TextProps) {
  return <h1 className={cn("text-4xl font-extrabold leading-tight tracking-tight md:text-6xl", className)}>{children}</h1>;
}

export function H2({ className, children }: TextProps) {
  return <h2 className={cn("text-3xl font-bold tracking-tight md:text-4xl", className)}>{children}</h2>;
}

export function Lead({ className, children }: TextProps) {
  return <p className={cn("text-sm text-slate-300 md:text-base", className)}>{children}</p>;
}
