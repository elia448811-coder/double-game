import type { KeyboardEvent } from 'react';

type SectionTabsProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SectionTabs<T extends string>({ id, label, value, options, onChange }: SectionTabsProps<T>) {
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || options.length === 0) return;
    event.preventDefault();
    const current = Math.max(0, options.findIndex((option) => option.value === value));
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (forward ? 1 : -1) + options.length) % options.length;
    onChange(options[index].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
  }

  return (
    <div className="section-tabs" role="tablist" aria-label={label} onKeyDown={handleKey}>
      {options.map((option) => (
        <button key={option.value} id={`${id}-tab-${option.value}`} type="button" role="tab"
          aria-controls={`${id}-panel-${option.value}`} aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
