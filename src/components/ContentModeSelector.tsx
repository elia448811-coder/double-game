import type { ContentMode } from '../types/game';
import { CONTENT_MODE_DESCRIPTIONS, CONTENT_MODE_LABELS } from '../types/game';

type ContentModeSelectorProps = {
  contentMode: ContentMode;
  onChange: (mode: ContentMode) => void;
};

const MODES: ContentMode[] = ['tasks', 'questions', 'mixed'];

export function ContentModeSelector({ contentMode, onChange }: ContentModeSelectorProps) {
  return (
    <div className="content-mode-selector">
      <span className="settings-label">סוג תוכן</span>
      <div className="format-grid content-mode-grid">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`format-card ${contentMode === m ? 'selected' : ''}`}
            onClick={() => onChange(m)}
          >
            <strong>{CONTENT_MODE_LABELS[m]}</strong>
            <p>{CONTENT_MODE_DESCRIPTIONS[m]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
