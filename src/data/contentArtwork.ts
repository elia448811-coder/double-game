import type { CoupleTask, GameMode } from '../types/game';
import conversation from '../assets/question-art/conversation.webp';
import date from '../assets/question-art/date.webp';
import adventure from '../assets/question-art/adventure.webp';
import home from '../assets/question-art/home.webp';
import playful from '../assets/question-art/playful.webp';
import calm from '../assets/question-art/calm.webp';
import creative from '../assets/question-art/creative.webp';
import growth from '../assets/question-art/growth.webp';
import music from '../assets/question-art/music.webp';
import conversationSmall from '../assets/question-art/conversation-small.webp';
import dateSmall from '../assets/question-art/date-small.webp';
import adventureSmall from '../assets/question-art/adventure-small.webp';
import homeSmall from '../assets/question-art/home-small.webp';
import playfulSmall from '../assets/question-art/playful-small.webp';
import calmSmall from '../assets/question-art/calm-small.webp';
import creativeSmall from '../assets/question-art/creative-small.webp';
import growthSmall from '../assets/question-art/growth-small.webp';
import musicSmall from '../assets/question-art/music-small.webp';

export const CONTENT_ARTWORK = {
  conversation: { src: conversation, small: conversationSmall, label: 'לב אל לב' },
  date: { src: date, small: dateSmall, label: 'זמן לשניכם' },
  adventure: { src: adventure, small: adventureSmall, label: 'יוצאים לדרך' },
  home: { src: home, small: homeSmall, label: 'הבית שלכם' },
  playful: { src: playful, small: playfulSmall, label: 'קצת צחוק' },
  calm: { src: calm, small: calmSmall, label: 'רגע של שקט' },
  creative: { src: creative, small: creativeSmall, label: 'דמיון משותף' },
  growth: { src: growth, small: growthSmall, label: 'בונים יחד' },
  music: { src: music, small: musicSmall, label: 'בקצב שלכם' },
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
