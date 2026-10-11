import type { KeyboardEvent } from 'react';

export type Option<T extends string> = { value: T; label: string; swatch?: string };

type RadioGroupProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
  hideLabel?: boolean;
};

export function RadioGroup<T extends string>({ label, value, options, onChange, className, hideLabel = false }: RadioGroupProps<T>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || options.length === 0) return;
    event.preventDefault();
    const current = Math.max(0, options.findIndex((option) => option.value === value));
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (forward ? 1 : -1) + options.length) % options.length;
    const next = options[index];
    onChange(next.value);
    event.currentTarget.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  };

  return (
    <div className={className} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {!hideLabel && <span className="settings-label">{label}</span>}
      <div className="target-score-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-value={option.value}
            aria-checked={option.value === value}
            tabIndex={option.value === value ? 0 : -1}
            className={`target-score-btn ${option.value === value ? 'target-score-btn--selected' : ''} pressable`}
            onClick={() => onChange(option.value)}
          >
            {option.swatch && <span className="option-swatch" style={{ backgroundColor: option.swatch }} aria-hidden="true" />}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
