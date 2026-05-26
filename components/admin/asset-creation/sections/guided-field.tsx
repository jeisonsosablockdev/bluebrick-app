import type { InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GuidanceBadgeProps = {
  hint: string;
  tooltip: string;
  ariaLabel?: string;
};

export function GuidanceBadge({ hint, tooltip, ariaLabel }: GuidanceBadgeProps): ReactElement {
  const tooltipId = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={ariaLabel ?? tooltip}
        aria-describedby={tooltipId}
        className="peer inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[10px] text-white/70 transition-colors hover:border-cyan-300/60 hover:text-cyan-100 focus-visible:border-cyan-300/60 focus-visible:text-cyan-100 focus-visible:outline-none"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-3 text-[11px] font-normal leading-5 text-white opacity-0 shadow-2xl transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
          Que es
        </span>
        <span className="mt-1 block text-white/90">{hint}</span>
        <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
          Como afecta
        </span>
        <span className="mt-1 block text-white/90">{tooltip}</span>
      </span>
    </span>
  );
}

type GuidedFieldHeaderProps = {
  label: string;
  hint: string;
  tooltip: string;
  ariaLabel?: string;
};

export function GuidedFieldHeader({
  label,
  hint,
  tooltip,
  ariaLabel
}: GuidedFieldHeaderProps): ReactElement {
  return (
    <>
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <GuidanceBadge hint={hint} tooltip={tooltip} ariaLabel={ariaLabel} />
      </span>
    </>
  );
}

type GuidedInputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint: string;
  tooltip: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
};

export function GuidedInputField({
  label,
  hint,
  tooltip,
  prefix,
  suffix,
  className,
  ariaLabel,
  ...inputProps
}: GuidedInputFieldProps): ReactElement {
  return (
    <label className="space-y-1 text-xs text-white/70">
      <GuidedFieldHeader label={label} hint={hint} tooltip={tooltip} ariaLabel={ariaLabel} />
      <div className="relative">
        {prefix ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/60">{prefix}</span> : null}
        <Input className={cn(prefix ? "pl-7" : "", suffix ? "pr-12" : "", className)} {...inputProps} />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60">{suffix}</span> : null}
      </div>
    </label>
  );
}

type GuidedTextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint: string;
  tooltip: string;
  ariaLabel?: string;
};

export function GuidedTextareaField({
  label,
  hint,
  tooltip,
  ariaLabel,
  className,
  ...textareaProps
}: GuidedTextareaFieldProps): ReactElement {
  return (
    <label className="space-y-1 text-xs text-white/70">
      <GuidedFieldHeader label={label} hint={hint} tooltip={tooltip} ariaLabel={ariaLabel} />
      <textarea
        className={cn("min-h-20 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white", className)}
        {...textareaProps}
      />
    </label>
  );
}

type GuidedSelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> & {
  label: string;
  hint: string;
  tooltip: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function GuidedSelectField({
  label,
  hint,
  tooltip,
  children,
  className,
  ariaLabel,
  ...selectProps
}: GuidedSelectFieldProps): ReactElement {
  return (
    <label className="space-y-1 text-xs text-white/70">
      <GuidedFieldHeader label={label} hint={hint} tooltip={tooltip} ariaLabel={ariaLabel} />
      <select
        className={cn(
          "w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-cyan-300/60",
          className
        )}
        {...selectProps}
      >
        {children}
      </select>
    </label>
  );
}
