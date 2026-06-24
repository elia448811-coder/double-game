import type { GameState } from '../types/game';

/** Score-based win target (excludes rounds/fun formats). */
export function getScoreTarget(
  state: Pick<GameState, 'targetScore' | 'customTargetScore' | 'gameFormat'>,
): number | null {
  if (state.gameFormat === 'fun' || state.gameFormat === 'rounds') return null;
  if (state.targetScore === 'free') return null;
  if (state.targetScore === 'custom') return state.customTargetScore;
  return state.targetScore;
}

export function checkEndConditions(
  state: GameState,
  scores: [number, number],
  cooperativeScore: number,
  stats: GameState['stats'],
): { end: boolean; winner: GameState['winner'] } {
  const isRounds = state.gameFormat === 'rounds';
  const roundLimit = isRounds ? state.roundTarget : null;
  const scoreTarget = getScoreTarget(state);

  if (roundLimit !== null && stats.roundNumber >= roundLimit) {
    if (state.scoringMode === 'none' || state.scoringMode === 'cooperative') {
      return { end: true, winner: 'tie' };
    }
    const winner: GameState['winner'] =
      scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : 'tie';
    return { end: true, winner };
  }

  if (state.scoringMode === 'none') {
    if (scoreTarget !== null && stats.totalCompleted >= scoreTarget) {
      return { end: true, winner: null };
    }
    return { end: false, winner: null };
  }

  if (state.scoringMode === 'cooperative' && scoreTarget !== null && cooperativeScore >= scoreTarget) {
    return { end: true, winner: 'tie' };
  }

  if (state.scoringMode === 'competitive' && scoreTarget !== null) {
    const p1Win = scores[0] >= scoreTarget;
    const p2Win = scores[1] >= scoreTarget;
    if (p1Win && p2Win) return { end: true, winner: 'tie' };
    if (p1Win) return { end: true, winner: 0 };
    if (p2Win) return { end: true, winner: 1 };
  }

  return { end: false, winner: null };
}
