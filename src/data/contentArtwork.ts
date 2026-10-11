import type { CoupleTask, GameMode } from '../types/game';
import { hostedImageUrl, type HostedImageKey } from './hostedImageUrl';

const artwork = (key: HostedImageKey, label: string) => ({
  src: hostedImageUrl(key, 960), small: hostedImageUrl(key, 480), label,
});

export const CONTENT_ARTWORK = {
  conversation: artwork('conversation', 'לב אל לב'),
  date: artwork('date', 'זמן לשניכם'),
  adventure: artwork('adventure', 'יוצאים לדרך'),
  home: artwork('home', 'הבית שלכם'),
  playful: artwork('playful', 'קצת צחוק'),
  calm: artwork('calm', 'רגע של שקט'),
  creative: artwork('creative', 'דמיון משותף'),
  growth: artwork('growth', 'בונים יחד'),
  music: artwork('music', 'בקצב שלכם'),
} as const;

export type ArtworkKey = keyof typeof CONTENT_ARTWORK;

const GROUP_ARTWORK: Record<string, ArtworkKey> = {
  deep: 'conversation', communication: 'conversation', meet100: 'conversation',
  funny: 'playful', romantic: 'date', future: 'adventure', routine: 'home',
  family: 'home', money: 'growth', creative: 'creative', icebreaker: 'playful',
  summary: 'calm', intimacy: 'date', spicy: 'date',
};
const CATEGORY_ARTWORK: Record<string, ArtworkKey> = {
  funny: 'playful', romantic: 'date', challenge: 'adventure', calm: 'calm',
  creative: 'creative', movement: 'music', spicy: 'date',
};
const TOPICS: readonly [ArtworkKey, RegExp][] = [
  ['music', /מוזיק|מוסיק|(?:^|[^א-ת])(?:ה?שיר(?:ים)?|לשיר)(?=$|[^א-ת])|ריקוד|לרקוד|רקד|תנוע|קצב|פלייליסט/],
  ['growth', /כסף|כספ|כלכל|תקציב|חיסכון|לחסוך|קרייר|עבודה|מקצוע|עסק|הכנסה/],
  ['adventure', /טיול|לטייל|טיסה|חו.?ל|חופשה|לנסוע|מסע(?:ות|(?=$|[^א-ת]))|הרפתק|יעד|מדינה|עיר בעולם/],
  ['home', /משפח|ילדות|הורים|ילדים|בית|בבית|לבשל|בישול|אוכל|ארוח|מטבח|שגרה|שגרתי|מסעדה/],
  ['creative', /להמציא|המצאה|לצייר|ציור|דמיון|לדמיין|יציר|סיפור|סרט|דמות|צבע|לבנות/],
  ['playful', /צחוק|לצחוק|מצחיק|בדיחה|שטות|משעשע|מגוחך|מביך|משחק|חיקוי/],
  ['calm', /לחץ|לחוץ|להירגע|רגוע|מרגיע|שקט|מנוחה|לנוח|נשימה|לנשום|לישון|שינה|עומס/],
  ['date', /דייט|רומנט|נשיק|לחבק|חיבוק|אהבה|מאוהב|מחמאה|מחמא|משיכה|מגע|אינטימי/],
];

/** Read the current wording, so edited and custom cards get the same topic matching. */
export function getContentArtworkKey(task: CoupleTask): ArtworkKey {
  if (task.category === 'spicy' || task.questionGroup === 'intimacy') return 'date';
  for (const [key, pattern] of TOPICS) {
    if (pattern.test(task.description)) return key;
  }
  return (task.questionGroup && GROUP_ARTWORK[task.questionGroup])
    || CATEGORY_ARTWORK[task.category] || 'conversation';
}

export function getModeArtworkKey(mode: GameMode): ArtworkKey {
  return CATEGORY_ARTWORK[mode] || 'creative';
}
