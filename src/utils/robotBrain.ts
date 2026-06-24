import {
  CONTENT_MODE_LABELS,
  GAME_FORMAT_LABELS,
  LEVEL_LABELS,
  MODE_LABELS,
  SCORING_MODE_LABELS,
} from '../types/game';
import type { RobotContext, RobotReply } from '../types/robot';
import { getFullBankStats } from './taskSelection';

const DEFAULT_SUGGESTIONS = [
  'איך משחקים?',
  'האם אפשר לדלג?',
  'מי מנצח עכשיו?',
  'שפוט אותנו!',
  'מה זה משימה זוגית?',
];

type Intent = {
  id: string;
  patterns: string[];
  weight?: number;
  reply: (ctx: RobotContext, input: string) => RobotReply;
};

function normalize(text: string): string {
  return text
    .trim()
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s?!.,]/g, '')
    .replace(/\s+/g, ' ');
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

function playerName(ctx: RobotContext, index: 0 | 1): string {
  return index === 0 ? ctx.playerOneName : ctx.playerTwoName;
}

function currentPlayer(ctx: RobotContext): string {
  return playerName(ctx, ctx.currentPlayerIndex);
}

function scoreLeader(ctx: RobotContext): { leader: 0 | 1 | 'tie'; diff: number } {
  const [a, b] = ctx.scores;
  if (a > b) return { leader: 0, diff: a - b };
  if (b > a) return { leader: 1, diff: b - a };
  return { leader: 'tie', diff: 0 };
}

function judgeWinner(ctx: RobotContext): RobotReply {
  if (ctx.screen === 'end' && ctx.winner !== null) {
    if (ctx.winner === 'tie') {
      return {
        mood: 'judge',
        text: '⚖️ פסק דין סופי: תיקו מושלם! שניכם ניצחתם את הערב — וזה הכי חשוב.',
        suggestions: ['משחק חדש?', 'איך משחקים שוב?'],
      };
    }
    const name = playerName(ctx, ctx.winner);
    const other = playerName(ctx, ctx.winner === 0 ? 1 : 0);
    return {
      mood: 'judge',
      text: `⚖️ פסק דין רשמי: ${name} מנצח/ת הערב!\n\n${other} — לא נורא, הסיבוב הבא שלך. ${ctx.stats.totalCompleted} משימות בוצעו — ערב מוצלח לשניכם.`,
      suggestions: ['שחקו שוב', 'מי היה מצחיק יותר?'],
    };
  }

  if (ctx.scoringMode === 'cooperative') {
  return {
      mood: 'judge',
      text: `⚖️ במצב שיתופי אין מנצח אחד — אתם צוות!\n\nניקוד משותף: ${ctx.cooperativeScore}${ctx.effectiveTarget ? ` / ${ctx.effectiveTarget}` : ''}.\n${ctx.cooperativeScore >= (ctx.effectiveTarget ?? 999) ? 'כמעט שם! המשיכו יחד 💪' : 'עוד קצת ותשברו שיא זוגי!'}`,
      suggestions: ['איך עובד ניקוד שיתופי?', 'האם אפשר לדלג?'],
    };
  }

  if (ctx.scoringMode === 'none') {
    return {
      mood: 'judge',
      text: `⚖️ במצב בלי ניקוד אין מנצח — רק כיף!\n\nעד כה: ${ctx.stats.totalCompleted} משימות בוצעו, ${ctx.stats.totalSkipped} דילוגים.\nהמנצח האמיתי? הערב שלכם 😄`,
      suggestions: ['איך מפעילים ניקוד?', 'מה זה מצב כיף?'],
    };
  }

  const { leader, diff } = scoreLeader(ctx);
  if (leader === 'tie') {
    return {
      mood: 'judge',
      text: `⚖️ כרגע תיקו מושלם — ${ctx.scores[0]}:${ctx.scores[1]}!\n\nאף אחד לא מוביל, והמתח רק עולה. הסיבוב הבא יכריע.`,
      suggestions: ['מי בתור עכשיו?', 'שפוט מי מצחיק יותר'],
    };
  }

  const winner = playerName(ctx, leader);
  const loser = playerName(ctx, leader === 0 ? 1 : 0);
  const targetNote = ctx.effectiveTarget ? ` (יעד: ${ctx.effectiveTarget})` : '';

  return {
    mood: 'judge',
    text: `⚖️ פסק דין זמני: ${winner} מוביל/ה ${ctx.scores[leader]}:${ctx.scores[leader === 0 ? 1 : 0]}${targetNote}!\n\n${diff === 1 ? 'הפרש של נקודה אחת בלבד — הכל פתוח!' : `פער של ${diff} נקודות — ${loser}, זמן להתעורר 😉`}\n\n*החלטה זו ניתנת לערעור רק בצחוק.*`,
    suggestions: ['מי בתור?', 'האם אפשר לדלג?', 'שפוט מי צודק'],
  };
}

function judgeFairness(ctx: RobotContext, input: string): RobotReply {
  const wantsApology = includesAny(input, ['צודק', 'צודקת', 'אשמה', 'אשם', 'בצדק']);
  const aboutSkip = includesAny(input, ['דילג', 'דילגת', 'דילגו', 'לדלג', 'דילוג']);

  if (aboutSkip) {
    return {
      mood: 'judge',
      text: `⚖️ בנושא דילוגים:\n\n1. דילוג תמיד מותר — זה חלק מהמשחק.\n2. אם משימה לא נעימה — דלגו בלי רגשות אשם.\n3. ${ctx.stats.totalSkipped} דילוגים עד כה — ${ctx.stats.totalSkipped > 5 ? 'קצת הרבה, אבל זה בסדר גמור' : 'כמות סבירה לגמרי'}.\n\nפסק דין: שניכם צודקים שרוצים להרגיש בנוח. המשיכו בכיף!`,
      suggestions: ['מי בתור?', 'משימה קשה מדי'],
    };
  }

  if (wantsApology) {
    const favored = Math.random() > 0.5 ? 0 : 1;
    const name = playerName(ctx, favored as 0 | 1);
    const other = playerName(ctx, favored === 0 ? 1 : 0);
    return {
      mood: 'judge',
      text: `⚖️ שמעתי את שני הצדדים (בדמיון)...\n\n${name} צודק/ת ב-60% מהמקרה.\n${other} — גם את/ה לא כל כך רחוק/ה מהאמת.\n\nהמלצת ביניים: חיבוק, משימה קלה, והלאה.`,
      suggestions: ['מי מנצח?', 'איך משחקים?'],
    };
  }

  return {
    mood: 'judge',
    text: `⚖️ אני שופט, לא פסיכולוג — אבל בכיף!\n\nכלל הזהב של ספין זוגי:\n• נעים לשניכם = ממשיכים\n• לא נעים = דילוג בלי בעיה\n• ויכוח = שניכם צודקים חלקית\n\nתנו לי פרטים ואשפוט יותר לעומק.`,
    suggestions: ['מי צודק?', 'מי דילג בלי סיבה?', 'שפוט מי מנצח'],
  };
}

function judgeFunny(ctx: RobotContext): RobotReply {
  if (ctx.stats.funniestTaskTitle) {
    return {
      mood: 'excited',
      text: `😂 לפי הרשומות: המשימה הכי מצחיקה הערב היא:\n"${ctx.stats.funniestTaskTitle}"\n\nמי שבחר אותה — טעם מעולה!`,
      suggestions: ['מי מנצח?', 'שפוט אותנו'],
    };
  }
  return {
    mood: 'judge',
    text: '⚖️ עדיין לא סומנה משימה כ"הכי מצחיקה". לחצו על 😂 במשימה — ואז אוכל לשפוט בצורה מדעית (לא ממש).',
    suggestions: ['איך מסמנים מצחיקה?', 'מי מנצח?'],
  };
}

const INTENTS: Intent[] = [
  {
    id: 'greet',
    patterns: ['שלום', 'היי', 'הי', 'בוקר', 'ערב', 'מה נשמע', 'מה קורה', 'הלו'],
    reply: () => ({
      mood: 'happy',
      text: 'היי! אני ספינבי 🤖 — העוזר החכם של ספין זוגי.\n\nאני יודע לענות על שאלות, להסביר את המשחק, ולשפוט (בהומור) כשיש מחלוקת.\n\nמה תרצו לדעת?',
      suggestions: DEFAULT_SUGGESTIONS,
    }),
  },
  {
    id: 'how-to-play',
    patterns: ['איך משחקים', 'איך לשחק', 'מה עושים', 'הסבר', 'כללים', 'איך זה עובד', 'מה המשחק'],
    weight: 2,
    reply: () => ({
      mood: 'happy',
      text: `📖 איך משחקים:\n\n1️⃣ בוחרים מצב (מצחיק, רומנטי, מעורב...)\n2️⃣ מגדירים פורמט ורמת קושי\n3️⃣ מסובבים את הגלגל 🎡\n4️⃣ מקבלים משימה — מבצעים, מחליפים, או מדלגים\n5️⃣ צוברים נקודות (או פשוט נהנים)\n\nאין שאלות — רק משימות! ותמיד אפשר לדלג.`,
      suggestions: ['האם אפשר לדלג?', 'איך מנצחים?', 'מה זה הפתעה?'],
    }),
  },
  {
    id: 'skip',
    patterns: ['לדלג', 'דילוג', 'דלג', 'אפשר לדלג', 'חייב', 'חייבים', 'לעשות את זה'],
    weight: 2,
    reply: () => ({
      mood: 'wink',
      text: '✅ כן! דילוג תמיד מותר.\n\nהמשחק בנוי על כיף ובטיחות. משימה לא מתאימה? דלגו בלי רגשות אשם.\n\nאפשר גם "משימה אחרת" או "קל מדי / קשה מדי" לקבל משהו אחר.',
      suggestions: ['מי בתור?', 'שפוט אותנו', 'כמה משימות יש?'],
    }),
  },
  {
    id: 'couple-task',
    patterns: ['משימה זוגית', 'זוגית', 'שנינו', 'ביחד', 'מצב זוגי'],
    reply: (ctx) => ({
      mood: 'happy',
      text: ctx.coupleTaskMode
        ? '💑 מצב משימה זוגית פעיל! כל המשימות (או רובן) מיועדות לביצוע יחד — בלי תורות.\n\nמושלם לערב רומנטי או רגוע.'
        : '💑 משימה זוגית = שניכם מבצעים יחד.\n\nאפשר להפעיל "מצב משימה זוגית" בהגדרות המשחק. גם בלי המצב — חלק מהמשימות מסומנות כזוגיות באופן טבעי.',
      suggestions: ['איך משחקים?', 'מה ההבדל בין מצבים?'],
    }),
  },
  {
    id: 'surprise',
    patterns: ['הפתעה', 'סגמנט', 'קטגוריה', 'מה יוצא', 'גלגל'],
    reply: () => ({
      mood: 'excited',
      text: '🎁 "הפתעה" בספינר = קטגוריה אקראית מכל הסוגים!\n\nיש לה סיכוי מעט נמוך יותר — כדי שזה באמת ירגיש כמו הפתעה.\n\nשאר הסגמנטים: מצחיק, זוגי, אתגר, רגוע, תנועה, יצירה, מחמאה.',
      suggestions: ['כמה משימות יש?', 'איך משחקים?'],
    }),
  },
  {
    id: 'modes',
    patterns: ['מצב', 'מצחיק', 'רומנטי', 'אתגר', 'רגוע', 'מעורב', 'הבדל'],
    reply: (ctx) => ({
      mood: 'neutral',
      text: `🎭 מצבי משחק:\n\n• ${MODE_LABELS.funny} — קליל ומצחיק\n• ${MODE_LABELS.romantic}\n• ${MODE_LABELS.challenge}\n• ${MODE_LABELS.calm}\n• ${MODE_LABELS.mixed} — הכי מגוון\n\nכרגע נבחר: ${MODE_LABELS[ctx.mode]} | רמה: ${LEVEL_LABELS[ctx.level]}`,
      suggestions: ['איך משחקים?', 'מה זה רמה מתקדמת?'],
    }),
  },
  {
    id: 'format',
    patterns: ['פורמט', 'מהיר', '30 דק', '5 דק', 'סיבובים', 'בלי ניקוד', 'כיף'],
    reply: (ctx) => ({
      mood: 'neutral',
      text: `⏱️ פורמטים:\n\n• ${GAME_FORMAT_LABELS.quick}\n• ${GAME_FORMAT_LABELS.normal}\n• ${GAME_FORMAT_LABELS.full}\n• ${GAME_FORMAT_LABELS.rounds}\n• ${GAME_FORMAT_LABELS.fun}\n\nכרגע: ${GAME_FORMAT_LABELS[ctx.gameFormat]} | ניקוד: ${SCORING_MODE_LABELS[ctx.scoringMode]}`,
      suggestions: ['איך מנצחים?', 'מה זה ניקוד שיתופי?'],
    }),
  },
  {
    id: 'scoring',
    patterns: ['ניקוד', 'נקודות', 'נקודה', 'מנצח', 'לנצח', 'יעד', 'תחרות'],
    weight: 1,
    reply: (ctx, input) => {
      if (includesAny(input, ['מנצח', 'מנצחת', 'מוביל', 'זוכה'])) {
        return judgeWinner(ctx);
      }
      return {
        mood: 'neutral',
        text: `🏆 סוגי ניקוד:\n\n• תחרותי — כל משימה = נקודה לשחקן\n• שיתופי — נקודות משותפות\n• ללא ניקוד — רק הנאה\n\nכרגע: ${SCORING_MODE_LABELS[ctx.scoringMode]}\n${ctx.effectiveTarget ? `יעד: ${ctx.effectiveTarget}` : 'בלי יעד נקודות'}`,
        suggestions: ['מי מנצח עכשיו?', 'איך משחקים?'],
      };
    },
  },
  {
    id: 'cooperative',
    patterns: ['שיתופי', 'ביחד נקודות', 'צוות', 'שיתוף'],
    reply: (ctx) => ({
      mood: 'happy',
      text: `🤝 במצב שיתופי אתם צוות אחד!\n\nכל משימה שבוצעה מוסיפה לניקוד המשותף (${ctx.cooperativeScore}${ctx.effectiveTarget ? ` / ${ctx.effectiveTarget}` : ''}).\n\nאין מנצח אחד — ניצחון משותף!`,
      suggestions: ['מי מנצח?', 'איך משחקים?'],
    }),
  },
  {
    id: 'turn',
    patterns: ['תור', 'מי משחק', 'מי עכשיו', 'למי התור', 'תור של מי'],
    weight: 2,
    reply: (ctx) => {
      if (ctx.screen !== 'game') {
        return {
          mood: 'neutral',
          text: 'עדיין לא במשחק פעיל — התחילו משחק ואז אוכל לומר מי בתור 😄',
          suggestions: ['איך משחקים?'],
        };
      }
      if (ctx.coupleTaskMode || ctx.currentTask?.isCoupleTask) {
        return {
          mood: 'happy',
          text: `💑 משימה זוגית פעילה — שניכם ${ctx.playerOneName} ו-${ctx.playerTwoName} ביחד! אין תור בודד.`,
          suggestions: ['האם אפשר לדלג?', 'שפוט אותנו'],
        };
      }
      return {
        mood: 'wink',
        text: `🎯 כרגע התור של: **${currentPlayer(ctx)}**!\n\n${ctx.currentTask ? 'יש משימה פתוחה — בצעו או דלגו.' : 'לחצו "סובב" לקבלת משימה חדשה.'}`,
        suggestions: ['מי מנצח?', 'האם אפשר לדלג?'],
      };
    },
  },
  {
    id: 'task-count',
    patterns: ['כמה משימות', 'מאגר', 'כמה יש', 'מספר משימות', 'כמה שאלות', 'כמה תוכן'],
    reply: (ctx) => {
      const bank = getFullBankStats(ctx.contentMode ?? 'mixed');
      return {
        mood: 'happy',
        text: `📚 במאגר:\n\n• ${bank.tasks} משימות כיפיות\n• ${bank.questions} שאלות היכרות ושיחה\n• **סה"כ ${bank.total}** פריטים נקיים!\n\nכרגע במשחק: ${CONTENT_MODE_LABELS[ctx.contentMode ?? 'mixed']}`,
        suggestions: ['מה זה שאלות עומק?', 'איך משחקים?'],
      };
    },
  },
  {
    id: 'questions-mode',
    patterns: ['שאלות', 'שאלה', 'היכרות', 'עומק', 'סוג תוכן', 'משימות או שאלות'],
    reply: (ctx) => ({
      mood: 'happy',
      text: `💬 מצבי תוכן:\n\n• משימות בלבד — 150 משימות לביצוע\n• שאלות בלבד — 300 שאלות שיחה\n• מעורב — שילוב אקראי\n\nכרגע: **${CONTENT_MODE_LABELS[ctx.contentMode ?? 'mixed']}**\n\n100 שאלות היכרות עמוקה + 200 שאלות בקטגוריות (מצחיק, רומנטי, עתיד, תקשורת ועוד).`,
      suggestions: ['כמה שאלות יש?', 'האם אפשר לדלג?'],
    }),
  },
  {
    id: 'advanced-level',
    patterns: ['מתקדם', 'קשה', 'רמה', 'קליל', 'קל מדי', 'קשה מדי'],
    reply: (ctx, input) => {
      if (includesAny(input, ['קל מדי', 'קשה מדי', 'קליל מדי'])) {
        return {
          mood: 'thinking',
          text: '💡 במשימה פתוחה לחצו "קל מדי" או "קשה מדי" — תקבלו משימה מותאמת.\n\nאו דלגו! אין חובה.',
          suggestions: ['האם אפשר לדלג?', 'מי בתור?'],
        };
      }
      return {
        mood: 'neutral',
        text: `📊 רמות קושי:\n\n• קליל — משימות קלות\n• רגיל — שילוב\n• מתקדם — מאתגר יותר (אפשר לכבות בהגדרות)\n\nכרגע: ${LEVEL_LABELS[ctx.level]}\nמשימות מתקדמות: ${ctx.settings.advancedTasksEnabled ? 'פעיל' : 'כבוי'}`,
        suggestions: ['איך משחקים?', 'כמה משימות יש?'],
      };
    },
  },
  {
    id: 'achievements',
    patterns: ['הישג', 'הישגים', 'תג', 'גביע'],
    reply: () => ({
      mood: 'excited',
      text: '🏅 הישגים נפתחים בסיום משחק:\n\n• משחק ראשון\n• בלי דילוגים\n• רצף של 5\n• 10+ משימות\n• ניצחון שיתופי\n• משחק מהיר\n\nבדקו במסך הסיום ובהגדרות!',
      suggestions: ['איך משחקים?', 'מי מנצח?'],
    }),
  },
  {
    id: 'settings',
    patterns: ['הגדרות', 'סאונד', 'מוזיקה', 'עיצוב', 'פונט', 'רקע', 'pwa', 'התקנה', 'אפליקציה'],
    reply: (ctx) => ({
      mood: 'neutral',
      text: `⚙️ הגדרות (מסך ההגדרות):\n\n• סאונד, מוזיקת רקע, רטט\n• עיצוב ספינר: ${ctx.settings.spinnerStyle}\n• מצב כהה/בהיר, פונט, רקע\n• שמות, צבעים, אווטארים\n• שיאים והישגים\n\n💡 אפשר גם להתקין כ-PWA מהבאנר בתחתית!`,
      suggestions: ['איך משחקים?', 'כמה משימות יש?'],
    }),
  },
  {
    id: 'streak',
    patterns: ['רצף', 'סטריק', 'streak'],
    reply: (ctx) => ({
      mood: ctx.stats.streak >= 3 ? 'excited' : 'happy',
      text:
        ctx.stats.streak >= 2
          ? `🔥 רצף נוכחי: ${ctx.stats.streak}! שיא: ${ctx.stats.maxStreak}.\n\n${ctx.stats.streak >= 5 ? 'מדהים — אתם בטופ! 🏆' : 'המשיכו — רצף מגניב בונה אווירה!'}`
          : `אין רצף פעיל כרגע (דילוג מאפס). שיא הרצף שלכם הערב: ${ctx.stats.maxStreak}.`,
      suggestions: ['מי מנצח?', 'שפוט אותנו'],
    }),
  },
  {
    id: 'current-task',
    patterns: ['משימה נוכחית', 'מה המשימה', 'מה לעשות', 'מה עכשיו'],
    reply: (ctx) => {
      if (!ctx.currentTask) {
        return {
          mood: 'neutral',
          text: ctx.screen === 'game'
            ? 'אין משימה פתוחה — סובבו את הגלגל! 🎡'
            : 'לא במשחק כרגע. התחילו משחק קודם!',
          suggestions: ['איך משחקים?'],
        };
      }
      return {
        mood: 'happy',
        text: `📋 המשימה הנוכחית (${ctx.spinCategory ?? 'כללי'}):\n\n"${ctx.currentTask.description}"\n\n${ctx.currentTask.durationSeconds ? `⏱️ ${ctx.currentTask.durationSeconds} שניות` : ''}\n\nבהצלחה! או דלגו — גם זה בסדר.`,
        suggestions: ['האם אפשר לדלג?', 'מי בתור?'],
      };
    },
  },
  {
    id: 'judge-win',
    patterns: ['מי מנצח', 'מי מנצחת', 'מי מוביל', 'מי באוויר', 'מי זוכה', 'תשפוט מי מנצח'],
    weight: 3,
    reply: (ctx) => judgeWinner(ctx),
  },
  {
    id: 'judge-funny',
    patterns: ['מי מצחיק', 'מצחיק יותר', 'הכי מצחיק'],
    weight: 2,
    reply: (ctx) => judgeFunny(ctx),
  },
  {
    id: 'judge',
    patterns: ['שפוט', 'שופט', 'פסק דין', 'תשפוט', 'תחליט', 'מחלוקת', 'ויכוח', 'צודק', 'צודקת', 'לא הוגן', 'רמאי', 'רמאות'],
    weight: 3,
    reply: (ctx, input) => {
      if (includesAny(input, ['מנצח', 'מוביל', 'זוכה'])) return judgeWinner(ctx);
      if (includesAny(input, ['מצחיק'])) return judgeFunny(ctx);
      return judgeFairness(ctx, input);
    },
  },
  {
    id: 'thanks',
    patterns: ['תודה', 'תודה רבה', 'מעולה', 'אחלה', 'כיף'],
    reply: () => ({
      mood: 'happy',
      text: 'בכיף! אני כאן תמיד — לחצו עליי בכל מסך 🤖💜',
      suggestions: DEFAULT_SUGGESTIONS,
    }),
  },
  {
    id: 'who-are-you',
    patterns: ['מי אתה', 'מי את', 'מה אתה', 'ספינבי', 'רובוט'],
    reply: () => ({
      mood: 'wink',
      text: 'אני **ספינבי** 🤖 — הרובוט הרשמי של ספין זוגי!\n\nתפקידים:\n• מענה על שאלות\n• הסבר כללים\n• שיפוט הוגן (ובעיקר מצחיק)\n• תמיכה רגשית דיגיטלית בדילוגים 😄',
      suggestions: DEFAULT_SUGGESTIONS,
    }),
  },
];

function scoreIntent(intent: Intent, input: string): number {
  let score = 0;
  for (const pattern of intent.patterns) {
    if (input.includes(pattern)) {
      score += (intent.weight ?? 1) * pattern.length;
    }
  }
  return score;
}

export function getWelcomeReply(): RobotReply {
  return {
    mood: 'happy',
    text: 'היי! אני **ספינבי** 🤖\n\nשאלו אותי על המשחק, הבקשו שאשפוט מחלוקת, או לחצו על הצעות למטה.',
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export function askRobot(input: string, ctx: RobotContext): RobotReply {
  const normalized = normalize(input);
  if (!normalized) {
    return {
      mood: 'neutral',
      text: 'לא שמעתי שאלה — כתבו משהו ואענה!',
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  let best: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    const score = scoreIntent(intent, normalized);
    if (score > 0 && (!best || score > best.score)) {
      best = { intent, score };
    }
  }

  if (best) {
    return best.intent.reply(ctx, normalized);
  }

  return {
    mood: 'thinking',
    text: `הממ... לא בטוח שהבנתי "${input}".\n\nאני מומחה ב:\n• כללי המשחק\n• דילוגים ומשימות זוגיות\n• ניקוד וסיבובים\n• שיפוט מחלוקות 😄\n\nנסו לנסח אחרת, או בחרו מהרשימה:`,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}
