import { describe, expect, it } from 'vitest';
import type { RobotContext } from '../types/robot';
import { askRobot, getWelcomeReply } from './robotBrain';

function baseContext(overrides: Partial<RobotContext> = {}): RobotContext {
  return {
    screen: 'game',
    mode: 'mixed',
    level: 'normal',
    gameFormat: 'normal',
    scoringMode: 'competitive',
    coupleTaskMode: false,
    playerOneName: 'דני',
    playerTwoName: 'מיה',
    currentPlayerIndex: 0,
    scores: [3, 2],
    cooperativeScore: 0,
    stats: {
      totalCompleted: 5,
      totalSkipped: 1,
      streak: 2,
      maxStreak: 3,
      funniestTaskId: null,
      funniestTaskTitle: null,
      startTime: Date.now(),
      roundNumber: 6,
    },
    winner: null,
    currentTask: null,
    spinCategory: null,
    effectiveTarget: 10,
    contentMode: 'mixed',
    settings: { advancedTasksEnabled: true, spinnerStyle: 'glass' },
    ...overrides,
  };
}

describe('getWelcomeReply', () => {
  it('returns greeting with suggestions', () => {
    const reply = getWelcomeReply();
    expect(reply.text).toContain('ספינבי');
    expect(reply.suggestions?.length).toBeGreaterThan(0);
  });
});

describe('askRobot', () => {
  it('answers how to play', () => {
    const reply = askRobot('איך משחקים?', baseContext());
    expect(reply.text).toContain('סובבים');
    expect(reply.mood).toBe('happy');
  });

  it('confirms skip is allowed', () => {
    const reply = askRobot('האם אפשר לדלג?', baseContext());
    expect(reply.text).toContain('דילוג');
  });

  it('judges winner from scores', () => {
    const reply = askRobot('מי מנצח?', baseContext());
    expect(reply.text).toContain('דני');
    expect(reply.mood).toBe('judge');
  });

  it('reports current turn', () => {
    const reply = askRobot('מי בתור?', baseContext());
    expect(reply.text).toContain('דני');
  });

  it('handles cooperative mode', () => {
    const reply = askRobot('מי מנצח?', baseContext({ scoringMode: 'cooperative', cooperativeScore: 4 }));
    expect(reply.text).toContain('שיתופי');
  });

  it('falls back for unknown input', () => {
    const reply = askRobot('xyzabc123', baseContext());
    expect(reply.mood).toBe('thinking');
    expect(reply.suggestions?.length).toBeGreaterThan(0);
  });

  it('judges disputes', () => {
    const reply = askRobot('תשפוט מי צודק', baseContext());
    expect(reply.mood).toBe('judge');
    expect(reply.text.length).toBeGreaterThan(20);
  });
});
