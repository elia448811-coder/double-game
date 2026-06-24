import { ACHIEVEMENTS } from '../types/game';
import type { ContentMode } from '../types/game';
import { CONTENT_MODE_LABELS } from '../types/game';
import { loadHistory, loadRecords } from '../utils/storage';

type GameHeaderProps = {
  mode: string;
  eveningName: string;
  currentPlayerName: string;
  currentPlayerIndex: 0 | 1;
  playerOneName: string;
  playerTwoName: string;
  playerOneAvatar: string;
  playerTwoAvatar: string;
  playerOneColor: string;
  playerTwoColor: string;
  scores: [number, number];
  cooperativeScore: number;
  scoringMode: string;
  timeRemainingSeconds: number | null;
  stats: { totalCompleted: number; totalSkipped: number; streak: number };
  soundEnabled: boolean;
  contentMode: ContentMode;
  onToggleSound: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameHeader({
  mode,
  eveningName,
  currentPlayerName,
  currentPlayerIndex,
  playerOneName,
  playerTwoName,
  playerOneAvatar,
  playerTwoAvatar,
  playerOneColor,
  playerTwoColor,
  scores,
  cooperativeScore,
  scoringMode,
  timeRemainingSeconds,
  stats,
  soundEnabled,
  contentMode,
  onToggleSound,
}: GameHeaderProps) {
  const scoreDisplay =
    scoringMode === 'cooperative'
      ? `יחד: ${cooperativeScore}`
      : scoringMode === 'none'
        ? `${stats.totalCompleted} משימות`
        : `${playerOneName} ${scores[0]} : ${scores[1]} ${playerTwoName}`;

  return (
    <>
      <header className="top-bar">
        <div>
          <p className="eyebrow">Couple Spin</p>
          <h1>ספין זוגי</h1>
          <p className="subtitle">
            {eveningName || mode} · {stats.totalCompleted} בוצעו · {stats.totalSkipped} דילוגים
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="quick-mute"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'השתק' : 'הפעל סאונד'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <div className="score-card" aria-label="לוח ניקוד">
            <span>ניקוד</span>
            <strong>{scoreDisplay}</strong>
            {timeRemainingSeconds !== null && (
              <span className="timer-badge">⏱ {formatTime(timeRemainingSeconds)}</span>
            )}
          </div>
        </div>
      </header>

      <div className="status-row">
        <div className="pill active-pill turn-pill">
          <span
            className="turn-dot"
            style={{ background: currentPlayerIndex === 0 ? playerOneColor : playerTwoColor }}
          />
          תור: {currentPlayerName}
        </div>
        <div className="pill">{CONTENT_MODE_LABELS[contentMode]}</div>
        {stats.streak >= 2 && <div className="pill streak-pill">🔥 רצף {stats.streak}</div>}
        <div className="pill">אפשר לדלג תמיד</div>
      </div>

      <div className="player-row">
        <div className={`player-chip ${currentPlayerIndex === 0 ? 'active' : ''}`} style={{ borderColor: playerOneColor }}>
          <span>{playerOneAvatar}</span> {playerOneName}
        </div>
        <div className={`player-chip ${currentPlayerIndex === 1 ? 'active' : ''}`} style={{ borderColor: playerTwoColor }}>
          <span>{playerTwoAvatar}</span> {playerTwoName}
        </div>
      </div>
    </>
  );
}

export function StatsSummary({ achievementIds }: { achievementIds: string[] }) {
  const history = loadHistory();
  const records = loadRecords();
  const unlocked = ACHIEVEMENTS.filter((a) => achievementIds.includes(a.id));

  return (
    <div className="stats-summary">
      <div className="stats-grid">
        <div className="stat-box">
          <strong>{records.totalGames}</strong>
          <span>משחקים</span>
        </div>
        <div className="stat-box">
          <strong>{records.mostCompleted}</strong>
          <span>שיא משימות</span>
        </div>
        <div className="stat-box">
          <strong>{records.longestStreak}</strong>
          <span>שיא רצף</span>
        </div>
      </div>
      {unlocked.length > 0 && (
        <div className="achievements-row">
          {unlocked.map((a) => (
            <span key={a.id} className="achievement-badge" title={a.description}>
              {a.emoji} {a.title}
            </span>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <p className="history-hint">משחק אחרון: {history[0].completed} משימות · {history[0].durationMinutes} דק׳</p>
      )}
    </div>
  );
}
