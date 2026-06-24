import { useEffect } from 'react';
import { QUESTION_GROUP_LABELS } from '../data/allQuestions';
import type { CoupleTask } from '../types/game';
import { CATEGORY_LABELS } from '../types/game';
import { CategoryIcon } from './CategoryIcon';

type TaskModalProps = {
  task: CoupleTask;
  currentPlayerName: string;
  isCoupleTask: boolean;
  isFunniest: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onReplaceTask: () => void;
  onTooEasy: () => void;
  onTooHard: () => void;
  onMarkFunniest: () => void;
};

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
}: TaskModalProps) {
  const isQuestion = task.kind === 'question';
  const groupLabel =
    task.questionGroup && task.questionGroup in QUESTION_GROUP_LABELS
      ? QUESTION_GROUP_LABELS[task.questionGroup as keyof typeof QUESTION_GROUP_LABELS]
      : task.title;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'Enter') onComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete, onSkip]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className={`task-modal ${isQuestion ? 'task-modal--question' : ''}`}>
        <p className="modal-label">
          {isQuestion
            ? '💬 שאלה זוגית — דברו יחד בפתיחות'
            : isCoupleTask || task.isCoupleTask
              ? '💑 משימה זוגית — שניכם מבצעים יחד'
              : `המשימה של ${currentPlayerName}`}
        </p>

        <div className="category-badge">
          {isQuestion ? (
            <span className="category-icon category-icon--sm">💬</span>
          ) : (
            <CategoryIcon category={task.category} size="sm" />
          )}
          {isQuestion ? groupLabel : CATEGORY_LABELS[task.category]}
        </div>

        <h2 id="task-modal-title">{task.description}</h2>

        {!isQuestion && task.durationSeconds && (
          <p className="task-duration">⏱ {task.durationSeconds} שניות</p>
        )}

        {isQuestion ? (
          <p className="question-hint">קחו רגע, שתפו בכנות — אין תשובה נכונה או שגויה.</p>
        ) : (
          <div className="task-difficulty-row">
            <button type="button" className="difficulty-btn" onClick={onTooEasy} aria-label="קל מדי">
              קל מדי
            </button>
            <button type="button" className="difficulty-btn" onClick={onTooHard} aria-label="קשה מדי">
              קשה מדי
            </button>
            <button
              type="button"
              className={`difficulty-btn ${isFunniest ? 'difficulty-btn--active' : ''}`}
              onClick={onMarkFunniest}
              aria-label="סמן כמצחיקה ביותר"
            >
              {isFunniest ? '😂 נבחרה!' : '😂 הכי מצחיקה'}
            </button>
          </div>
        )}

        {isQuestion && (
          <div className="task-difficulty-row">
            <button
              type="button"
              className={`difficulty-btn ${isFunniest ? 'difficulty-btn--active' : ''}`}
              onClick={onMarkFunniest}
              aria-label="סמן כשאלה מועדפת"
            >
              {isFunniest ? '⭐ נבחרה!' : '⭐ שאלה מועדפת'}
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="primary-action pressable" onClick={onComplete}>
            {isQuestion ? 'דיברנו על זה' : 'בוצע'}
          </button>
          <button type="button" className="secondary-action pressable" onClick={onReplaceTask}>
            {isQuestion ? 'שאלה אחרת' : 'משימה אחרת'}
          </button>
          <button type="button" className="ghost-action pressable" onClick={onSkip}>
            דלג
          </button>
        </div>
      </div>
    </div>
  );
}
