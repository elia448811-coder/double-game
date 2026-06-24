import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, GameState } from '../types/game';
import type { RobotMessage, RobotMood } from '../types/robot';
import { askRobot, getWelcomeReply } from '../utils/robotBrain';
import { sounds } from '../utils/sound';

type MiniRobotProps = {
  game: GameState;
  settings: AppSettings;
  effectiveTarget: number | null;
  soundEnabled: boolean;
};

function RobotFace({ mood, thinking }: { mood: RobotMood; thinking: boolean }) {
  const blink = mood === 'wink';
  const eyes = thinking ? '··' : blink ? '◕ ◔' : '◕ ◕';

  return (
    <div className={`robot-face robot-face--${mood} ${thinking ? 'robot-face--thinking' : ''}`}>
      <div className="robot-face__antenna" />
      <div className="robot-face__head">
        <div className="robot-face__eyes">{eyes}</div>
        <div className="robot-face__mouth">
          {thinking ? '…' : mood === 'judge' ? '⚖' : mood === 'excited' ? '◡' : '‿'}
        </div>
      </div>
      <div className="robot-face__glow" />
    </div>
  );
}

function formatBotText(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

let msgId = 0;
function nextId() {
  msgId += 1;
  return `msg-${msgId}`;
}

export function MiniRobot({ game, settings, effectiveTarget, soundEnabled }: MiniRobotProps) {
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<RobotMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(getWelcomeReply().suggestions ?? []);
  const [mood, setMood] = useState<RobotMood>('happy');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buildContext = useCallback(
    () => ({
      screen: game.screen,
      mode: game.mode,
      level: game.level,
      gameFormat: game.gameFormat,
      scoringMode: game.scoringMode,
      coupleTaskMode: game.coupleTaskMode,
      playerOneName: game.playerOneName,
      playerTwoName: game.playerTwoName,
      currentPlayerIndex: game.currentPlayerIndex,
      scores: game.scores,
      cooperativeScore: game.cooperativeScore,
      stats: game.stats,
      winner: game.winner,
      currentTask: game.currentTask,
      spinCategory: game.spinCategory,
      effectiveTarget,
      contentMode: game.contentMode,
      settings: {
        advancedTasksEnabled: settings.advancedTasksEnabled,
        spinnerStyle: settings.spinnerStyle,
      },
    }),
    [game, effectiveTarget, settings.advancedTasksEnabled, settings.spinnerStyle],
  );

  const pushRobotReply = useCallback((text: string, replyMood: RobotMood, nextSuggestions?: string[]) => {
    setMood(replyMood);
    setMessages((prev) => [...prev, { id: nextId(), role: 'robot', text, mood: replyMood }]);
    if (nextSuggestions?.length) setSuggestions(nextSuggestions);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: trimmed }]);
      setInput('');
      setThinking(true);
      setMood('thinking');

      window.setTimeout(() => {
        const reply = askRobot(trimmed, buildContext());
        pushRobotReply(reply.text, reply.mood, reply.suggestions);
        setThinking(false);
      }, 450 + Math.random() * 350);
    },
    [thinking, buildContext, pushRobotReply],
  );

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next && messages.length === 0) {
        const welcome = getWelcomeReply();
        setMessages([{ id: nextId(), role: 'robot', text: welcome.text, mood: welcome.mood }]);
        setMood(welcome.mood);
        setSuggestions(welcome.suggestions ?? []);
      }
      if (soundEnabled) sounds.click(settings.soundPack);
      return next;
    });
  };

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, thinking]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className={`mini-robot ${open ? 'mini-robot--open' : ''}`}>
      {open && (
        <div className="mini-robot__panel" role="dialog" aria-label="ספינבי — עוזר חכם">
          <header className="mini-robot__header">
            <RobotFace mood={mood} thinking={thinking} />
            <div>
              <strong>ספינבי</strong>
              <span>עוזר + שופט זוגי</span>
            </div>
            <button
              type="button"
              className="mini-robot__close"
              onClick={() => setOpen(false)}
              aria-label="סגור"
            >
              ✕
            </button>
          </header>

          <div className="mini-robot__chat">
            {messages.map((m) => (
              <div key={m.id} className={`mini-robot__bubble mini-robot__bubble--${m.role}`}>
                {m.role === 'robot' ? formatBotText(m.text) : m.text}
              </div>
            ))}
            {thinking && (
              <div className="mini-robot__bubble mini-robot__bubble--robot mini-robot__typing">
                ספינבי חושב
                <span className="mini-robot__dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="mini-robot__chips">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="mini-robot__chip"
                  onClick={() => sendMessage(s)}
                  disabled={thinking}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="mini-robot__form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאלו אותי משהו..."
              disabled={thinking}
              aria-label="שאלה לספינבי"
            />
            <button type="submit" className="mini-robot__send" disabled={thinking || !input.trim()}>
              שלח
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="mini-robot__fab"
        onClick={toggleOpen}
        aria-label={open ? 'סגור את ספינבי' : 'פתח את ספינבי'}
        aria-expanded={open}
      >
        <span className="mini-robot__fab-icon">{open ? '✕' : '🤖'}</span>
        {!open && <span className="mini-robot__fab-pulse" />}
      </button>
    </div>
  );
}
