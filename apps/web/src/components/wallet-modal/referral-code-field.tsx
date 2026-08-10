import type { ChangeEvent, ReactElement } from "react";

type ReferralCodeFieldProps = {
  helpText: string;
  inputId: string;
  inputPlaceholder: string;
  isVisible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  toggleLabel: string;
  value: string;
};

export function ReferralCodeField({
  helpText,
  inputId,
  inputPlaceholder,
  isVisible,
  onChange,
  onToggle,
  toggleLabel,
  value
}: ReferralCodeFieldProps): ReactElement {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white"
      >
        <span>{toggleLabel}</span>
      </button>
      {isVisible ? (
        <>
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={inputPlaceholder}
            className="min-h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/45 focus:bg-white/15"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="text-xs text-white/60">{helpText}</p>
        </>
      ) : null}
    </div>
  );
}
