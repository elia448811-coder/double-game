import { SettingsPanel } from '../components/SettingsPanel';
import type { AppSettings } from '../types/game';

type SettingsScreenProps = {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onResetScores: () => void;
  onBack: () => void;
};

export function SettingsScreen({
  settings,
  onUpdate,
  onResetScores,
  onBack,
}: SettingsScreenProps) {
  return (
    <section className="page-screen settings-screen">
      <div className="game-card">
        <button type="button" className="back-btn" onClick={onBack} aria-label="חזרה">
          →
        </button>
        <SettingsPanel
          settings={settings}
          onUpdate={onUpdate}
          onResetScores={onResetScores}
          onBack={onBack}
        />
      </div>
    </section>
  );
}
