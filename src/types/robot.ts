import type { AppSettings, ContentMode, GameState } from './game';

export type RobotMood = 'happy' | 'thinking' | 'judge' | 'excited' | 'neutral' | 'wink';

export type RobotMessage = {
  id: string;
  role: 'user' | 'robot';
  text: string;
  mood?: RobotMood;
};

export type RobotReply = {
  text: string;
  mood: RobotMood;
  suggestions?: string[];
};

export type RobotContext = {
  screen: GameState['screen'];
  mode: GameState['mode'];
  level: GameState['level'];
  gameFormat: GameState['gameFormat'];
  scoringMode: GameState['scoringMode'];
  coupleTaskMode: boolean;
  playerOneName: string;
  playerTwoName: string;
  currentPlayerIndex: 0 | 1;
  scores: [number, number];
  cooperativeScore: number;
  stats: GameState['stats'];
  winner: GameState['winner'];
  currentTask: GameState['currentTask'];
  spinCategory: string | null;
  effectiveTarget: number | null;
  contentMode: ContentMode;
  settings: Pick<AppSettings, 'advancedTasksEnabled' | 'spinnerStyle'>;
};
