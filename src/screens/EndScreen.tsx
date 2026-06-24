import { useMemo, useState } from 'react';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { StatsSummary } from '../components/GameHeader';
import { ACHIEVEMENTS, END_PHRASES } from '../types/game';
import type { AppSettings, GameState } from '../types/game';
import { buildEndShareData, generateShareImage, shareGameResult } from '../utils/share';

type EndScreenProps = {
  game: GameState;
  settings: AppSettings;
  onNewGame: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function EndScreen({ game, settings, onNewGame, onPlayAgain, onHome }: EndScreenProps) {
  const [sharing, setSharing] = useState(false);

  const winnerName =
    game.winner === 0
      ? game.playerOneName
      : game.winner === 1
        ? game.playerTwoName
        : null;

  const phrase = useMemo(
    () => END_PHRASES[Math.floor(Math.random() * END_PHRASES.length)],
    [],
  );

  const durationMinutes = Math.max(
    1,
    Math.round((Date.now() - game.stats.startTime) / 60000),
  );

  const newAchievements = ACHIEVEMENTS.filter((a) =>
    game.sessionNewAchievements.includes(a.id),
  );

  const handleShare = async () => {
    setSharing(true);
    try {
      const data = buildEndShareData(game, settings, winnerName, phrase);
      await shareGameResult(data, settings);
    } finally {
      setSharing(false);
    }
  };

  const handleSaveImage = async () => {
    const data = buildEndShareData(game, settings, winnerName, phrase);
    const blob = await generateShareImage(data, settings);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'couple-spin-summary.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-screen end-screen">
      <ConfettiEffect
        active
        colors={[settings.playerOneColor, settings.playerTwoColor, '#FACC15', '#FF4FA3']}
      />
      <div className="game-card end-card">
        <p className="eyebrow">כל הכבוד</p>
        <h1 className="end-card__title">{phrase}</h1>
        <p className="subtitle end-card__subtitle">
          {game.eveningName && <span>{game.eveningName} · </span>}
          סיימתם עם {game.stats.totalCompleted}{' '}
          {game.contentMode === 'questions' ? 'שאלות שנענו' : 'משימות שבוצעו'}
          {game.stats.totalSkipped > 0 && ` · ${game.stats.totalSkipped} דילוגים`}
        </p>

        {winnerName ? (
          <p className="end-card__winner">🏆 המנצח/ת: {winnerName}</p>
        ) : game.winner === 'tie' ? (
          <p className="end-card__winner">🤝 נגמר בתיקו מושלם</p>
        ) : null}

        {game.stats.funniestTaskTitle && (
          <p className="funniest-task">
            {game.contentMode === 'questions' ? '⭐ השאלה המועדפת:' : '😂 המשימה הכי מצחיקה:'}{' '}
            {game.stats.funniestTaskTitle}
          </p>
        )}

        <div className="end-stats-grid">
          <div className="stat-box">
            <strong>{game.stats.totalCompleted}</strong>
            <span>בוצעו</span>
          </div>
          <div className="stat-box">
            <strong>{game.stats.totalSkipped}</strong>
            <span>דילוגים</span>
          </div>
          <div className="stat-box">
            <strong>{game.stats.maxStreak}</strong>
            <span>רצף מקסימלי</span>
          </div>
          <div className="stat-box">
            <strong>{durationMinutes}</strong>
            <span>דקות</span>
          </div>
        </div>

        {newAchievements.length > 0 && (
          <div className="achievements-unlocked">
            <span className="settings-label">הישגים חדשים בהישג יד</span>
            <div className="achievements-row">
              {newAchievements.map((a) => (
                <span key={a.id} className="achievement-badge">
                  {a.emoji} {a.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <StatsSummary achievementIds={game.unlockedAchievements} />

        <div className="modal-actions end-card__actions">
          <button type="button" className="primary-action pressable" onClick={onPlayAgain}>
            שחקו שוב באותו מצב
          </button>
          <button type="button" className="secondary-action pressable" onClick={handleShare} disabled={sharing}>
            {sharing ? 'משתף...' : '📤 שתפו את הערב'}
          </button>
          <button type="button" className="secondary-action pressable" onClick={handleSaveImage}>
            💾 שמרו תמונת סיכום
          </button>
          <button type="button" className="ghost-action pressable" onClick={onNewGame}>
            משחק חדש
          </button>
          <button type="button" className="ghost-action pressable" onClick={onHome}>
            חזרה למסך הראשי
          </button>
        </div>
      </div>
    </section>
  );
}
