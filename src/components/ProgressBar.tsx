type ProgressBarProps = {
  current: number;
  target: number | null;
  label?: string;
};

export function ProgressBar({ current, target, label }: ProgressBarProps) {
  const pct = target ? Math.min(100, (current / target) * 100) : Math.min(100, current * 5);

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={target ?? 100}>
      <div className="progress-bar__header">
        <span>{label ?? 'התקדמות'}</span>
        <span>
          {current}
          {target ? ` / ${target}` : ''}
        </span>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
