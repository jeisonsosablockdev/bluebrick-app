import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-300/60",
        className
      )}
      {...props}
    />
  );
}
