import { useEffect, useRef, useState } from 'react';
import { QUESTION_GROUP_LABELS } from '../data/allQuestions';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { CoupleTask } from '../types/game';
import { getCategoryLabel } from '../utils/adminCategories';
import { polishPrompt } from '../utils/polishPrompt';
import { CategoryIcon } from './CategoryIcon';
import { ContentArtwork } from './ContentArtwork';
import { getContentArtworkKey } from '../data/contentArtwork';

const EXTRA_GROUP_LABELS: Record<string, string> = {};

type TaskModalProps = {
  task: CoupleTask;
  currentPlayerName: string;
  isCoupleTask: boolean;
  isFunniest: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onReplaceTask: () => void | boolean;
  onTooEasy: () => void | boolean;
  onTooHard: () => void | boolean;
  onMarkFunniest: () => void;
  onHideForever?: () => void;
  onToggleFavorite?: () => void;
  readOnly?: boolean;
  taskFeedback?: 'up' | 'down' | null;
  onTaskFeedback?: (rating: 'up' | 'down') => void;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('button, a, input, select, textarea, [role="button"], [contenteditable="true"]'),
  );
}

export function TaskModal({
  task,
  currentPlayerName,
  isCoupleTask,
  isFunniest,
  onComplete,
  onSkip,
  onReplaceTask,
  onTooEasy,
  onTooHard,
  onMarkFunniest,
  onHideForever,
  onToggleFavorite,
  readOnly = false,
  taskFeedback = null,
  onTaskFeedback,
}: TaskModalProps) {
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const lockedRef = useRef(false);
  const trapRef = useFocusTrap(true);
  const isQuestion = task.kind === 'question';
  const groupLabel =
    task.questionGroup && task.questionGroup in QUESTION_GROUP_LABELS
      ? QUESTION_GROUP_LABELS[task.questionGroup as keyof typeof QUESTION_GROUP_LABELS]
      : task.questionGroup && task.questionGroup in EXTRA_GROUP_LABELS
        ? EXTRA_GROUP_LABELS[task.questionGroup]
        : task.title;
  const isMature = task.category === 'spicy';

  useEffect(() => {
    lockedRef.current = false;
    setConfirmSkip(false);
    setExtrasOpen(false);
    setActionNotice('');
  }, [task.id]);

  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirmSkip) {
          setConfirmSkip(false);
          return;
        }
        setConfirmSkip(true);
        return;
      }
      // Enter רק כשלא על אלמנט אינטראקטיבי — מונע כפל פעולות
      if (e.key === 'Enter' && !isInteractiveTarget(e.target)) {
        e.preventDefault();
        if (confirmSkip) return;
        if (!lockedRef.current) {
          lockedRef.current = true;
          onComplete();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete, confirmSkip, readOnly]);

  const doComplete = () => {
    if (readOnly || lockedRef.current) return;
    lockedRef.current = true;
    onComplete();
  };

  const doSkip = () => {
    if (readOnly || lockedRef.current) return;
    lockedRef.current = true;
    setConfirmSkip(false);
    onSkip();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={trapRef}
        className={`task-modal task-modal--clean task-modal--illustrated ${isQuestion ? 'task-modal--question' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        aria-describedby={!readOnly && confirmSkip ? 'task-skip-confirm-text' : undefined}
        tabIndex={-1}
      >
        <div className="task-modal__intro">
        <ContentArtwork artwork={getContentArtworkKey(task)} />
        <p className="task-modal__who">
          {isQuestion
            ? isMature
              ? '🔥 שאלה 18+ — דברו בפתיחות'
              : '💬 שאלה לשניכם'
            : isCoupleTask || task.isCoupleTask
              ? isMature
                ? '🔥 אתגר 18+ — שניכם'
                : '💑 משימה זוגית'
              : isMature
                ? `🔥 ${currentPlayerName}`
                : `🎯 ${currentPlayerName}`}
        </p>

        <div className="category-badge">
          {isQuestion ? (
            <span className="category-icon category-icon--sm">💬</span>
          ) : (
            <CategoryIcon category={task.category} size="sm" />
          )}
          {isQuestion ? groupLabel : getCategoryLabel(task.category)}
        </div>

        <h2 id="task-modal-title" className="task-modal__text">
          {polishPrompt(task.description)}
        </h2>

        {!isQuestion && task.durationSeconds && (
          <p className="task-duration">⏱ {task.durationSeconds} שניות</p>
        )}
        </div>

        {!readOnly && confirmSkip ? (
          <div className="task-modal__skip-confirm" role="alertdialog" aria-labelledby="task-skip-confirm-text">
            <p id="task-skip-confirm-text">{isQuestion ? 'לדלג על השאלה?' : 'לדלג על המשימה?'}</p>
            <div className="task-modal__main-actions">
              <button type="button" className="cta-button cta-button--modal pressable" onClick={doSkip}>
                כן, דלג
              </button>
              <button type="button" className="task-modal__skip pressable" onClick={() => setConfirmSkip(false)}>
                ביטול
              </button>
            </div>
          </div>
        ) : !readOnly ? (
          <div className="task-modal__main-actions">
            <button type="button" className="cta-button cta-button--modal pressable" onClick={doComplete}>
              {isQuestion ? '✓ דיברנו על זה' : '✓ בוצע'}
            </button>
            <button type="button" className="task-modal__skip pressable" onClick={doSkip}>
              דלג
            </button>
          </div>
        ) : (
          <p className="task-modal__spectator-note" role="status">
            צפייה בלבד — השותף/ה משחק/ת על המכשיר הראשי
          </p>
        )}

        {!readOnly && onTaskFeedback && (
          <div className="task-feedback-row" aria-label="משוב על המשימה">
            <button
              type="button"
              className={`task-feedback-btn pressable ${taskFeedback === 'up' ? 'task-feedback-btn--on' : ''}`}
              aria-pressed={taskFeedback === 'up'}
              onClick={() => onTaskFeedback('up')}
            >
              👍 אהבתי
            </button>
            <button
              type="button"
              className={`task-feedback-btn pressable ${taskFeedback === 'down' ? 'task-feedback-btn--on' : ''}`}
              aria-pressed={taskFeedback === 'down'}
              onClick={() => onTaskFeedback('down')}
            >
              👎 פחות
            </button>
          </div>
        )}

        {!readOnly && (
        <button
          type="button"
          className="task-modal__more-toggle"
          onClick={() => setExtrasOpen((v) => !v)}
          aria-expanded={extrasOpen}
        >
          {extrasOpen ? '▲ פחות אפשרויות' : '▼ עוד אפשרויות'}
        </button>
        )}

        {!readOnly && extrasOpen && (
          <div className="task-modal__extras">
            <button type="button" className="extra-btn pressable" onClick={() => {
              if (onReplaceTask() === false) setActionNotice(`אין כרגע ${isQuestion ? 'שאלה נוספת' : 'משימה נוספת'} שמתאימה לבחירות שלכם.`);
            }}>
              {isQuestion ? 'שאלה אחרת' : 'משימה אחרת'}
            </button>
            {!isQuestion && (
              <>
                <button type="button" className="extra-btn pressable" onClick={() => {
                  if (onTooEasy() === false) setActionNotice('אין כרגע משימה קשה יותר שמתאימה לבחירות שלכם.');
                }}>
                  קל מדי
                </button>
                <button type="button" className="extra-btn pressable" onClick={() => {
                  if (onTooHard() === false) setActionNotice('אין כרגע משימה קלה יותר שמתאימה לבחירות שלכם.');
                }}>
                  קשה מדי
                </button>
              </>
            )}
            <button
              type="button"
              className={`extra-btn ${isFunniest ? 'extra-btn--on' : ''} pressable`}
              onClick={onMarkFunniest}
              aria-pressed={isFunniest}
            >
              {isFunniest ? '⭐ נבחר!' : isQuestion ? '⭐ שאלה מועדפת' : '😂 הכי מצחיקה'}
            </button>
            {onToggleFavorite && (
              <button type="button" className="extra-btn pressable" onClick={onToggleFavorite}>
                💜 מועדפים
              </button>
            )}
            {onHideForever && (
              <button type="button" className="extra-btn pressable" onClick={onHideForever}>
                לא להציג שוב
              </button>
            )}
          </div>
        )}
        {actionNotice && <p role="status">{actionNotice}</p>}
      </div>
    </div>
  );
}
