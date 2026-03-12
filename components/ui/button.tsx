import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  const base = "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all";

  const variants = {
    primary: "bg-gradientPrimary text-white shadow-glow hover:opacity-95",
    ghost: "bg-white/5 text-white hover:bg-white/10",
    outline: "border border-white/25 text-white hover:bg-white/10"
  };

  return <button className={cn(base, variants[variant], className)} type={type} {...props} />;
}
