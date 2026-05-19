import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "glass-control w-full rounded-xl px-4 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-400",
        className
      )}
      suppressHydrationWarning
      {...props}
    />
  );
}
