type QuickMuteProps = {
  enabled: boolean;
  onToggle: () => void;
};

export function QuickMute({ enabled, onToggle }: QuickMuteProps) {
  return (
    <button
      type="button"
      className="quick-mute"
      onClick={onToggle}
      aria-label={enabled ? 'השתק סאונד' : 'הפעל סאונד'}
      aria-pressed={enabled}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
