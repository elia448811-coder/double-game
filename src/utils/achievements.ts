import type { GameState, GameStats } from '../types/game';

export function checkAchievements(
  stats: GameStats,
  game: Pick<GameState, 'gameFormat' | 'scoringMode' | 'stats'>,
  alreadyUnlocked: string[],
): string[] {
  const newOnes: string[] = [];
  const unlock = (id: string) => {
    if (!alreadyUnlocked.includes(id) && !newOnes.includes(id)) newOnes.push(id);
  };

  unlock('first_game');
  if (stats.totalSkipped === 0 && stats.totalCompleted >= 3) unlock('no_skips');
  if (stats.maxStreak >= 5) unlock('streak_5');
  if (stats.totalCompleted >= 10) unlock('funny_night');
  if (game.scoringMode === 'cooperative' && stats.totalCompleted >= 5) unlock('cooperative');
  if (game.gameFormat === 'quick' && stats.totalCompleted >= 5) unlock('speed_run');

  return newOnes;
}
