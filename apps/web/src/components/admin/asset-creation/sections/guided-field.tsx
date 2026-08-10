import type { InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GuidanceBadgeProps = {
  hint: string;
  tooltip: string;
  ariaLabel?: string;
};

export function GuidanceBadge({ hint, tooltip, ariaLabel }: GuidanceBadgeProps): ReactElement {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{
    left: number;
    top: number;
    maxWidth: number;
  } | null>(null);

  const updateTooltipPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button || typeof window === "undefined") {
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredWidth = 288;
    const maxWidth = Math.max(220, Math.min(preferredWidth, window.innerWidth - viewportPadding * 2));
    const halfWidth = maxWidth / 2;
    const minLeft = viewportPadding + halfWidth;
    const maxLeft = window.innerWidth - viewportPadding - halfWidth;
    const centeredLeft = rect.left + rect.width / 2;
    const left = Math.min(Math.max(centeredLeft, minLeft), maxLeft);
    const top = rect.bottom + 10;

    setTooltipStyle({
      left,
      top,
      maxWidth
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updateTooltipPosition();
  }, [isOpen, updateTooltipPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePositionUpdate = () => {
      updateTooltipPosition();
    };

    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
    };
  }, [isOpen, updateTooltipPosition]);

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel ?? tooltip}
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[10px] text-white/70 transition-colors hover:border-cyan-300/60 hover:text-cyan-100 focus-visible:border-cyan-300/60 focus-visible:text-cyan-100 focus-visible:outline-none"
        onBlur={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        ?
      </button>
      {isOpen && tooltipStyle && typeof document !== "undefined" ? createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none z-[9999] rounded-xl border border-white/10 bg-slate-950/95 px-3 py-3 text-[11px] font-normal leading-5 text-white shadow-2xl"
          style={{
            position: "fixed",
            left: tooltipStyle.left,
            top: tooltipStyle.top,
            maxWidth: `${tooltipStyle.maxWidth}px`,
            transform: "translateX(-50%)"
          }}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
            Que es
          </span>
          <span className="mt-1 block text-white/90">{hint}</span>
          <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
            Como afecta
          </span>
          <span className="mt-1 block text-white/90">{tooltip}</span>
        </span>,
        document.body
      ) : null}
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
