import { useEffect, useState } from 'react';
import { RadioGroup } from './RadioGroup';
import { CLOUD_DATA_APPLIED_EVENT } from '../utils/cloudRevision';
import { LEVEL_LABELS, type ContentKind, type TaskCategory, type TaskLevel } from '../types/game';
import {
  getCachedCategories,
  getCategoryIcon,
  getCategoryLabel,
} from '../utils/adminCategories';
import {
  addCustomContent,
  loadCustomContent,
  removeCustomContent,
  type CustomContentItem,
} from '../utils/customContent';

const CONTENT_KINDS: { value: ContentKind; label: string }[] = [
  { value: 'question', label: 'שאלה' },
  { value: 'task', label: 'משימה' },
];

const LEVELS: TaskLevel[] = ['easy', 'normal', 'advanced'];

type CustomContentPanelProps = {
  matureAgeConfirmed: boolean;
  dataRevision?: number;
};

export function CustomContentPanel({ matureAgeConfirmed, dataRevision = 0 }: CustomContentPanelProps) {
  const [items, setItems] = useState<CustomContentItem[]>(() => loadCustomContent());
  const [kind, setKind] = useState<ContentKind>('question');
  const [category, setCategory] = useState<TaskCategory>('romantic');
  const [level, setLevel] = useState<TaskLevel>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionGroup, setQuestionGroup] = useState('');
  const [formError, setFormError] = useState('');

  const visibleCategories = getCachedCategories()
    .map((c) => c.id)
    .filter((c) => c !== 'spicy' || matureAgeConfirmed);

  const refresh = () => setItems(loadCustomContent());

  useEffect(() => {
    setItems(loadCustomContent());
  }, [dataRevision]);
  useEffect(() => {
    const refreshCloudContent = () => setItems(loadCustomContent());
    window.addEventListener(CLOUD_DATA_APPLIED_EVENT, refreshCloudContent);
    return () => window.removeEventListener(CLOUD_DATA_APPLIED_EVENT, refreshCloudContent);
  }, []);

  const handleAdd = () => {
    setFormError('');
    const added = addCustomContent({
      kind,
      title,
      description,
      category,
      level,
      questionGroup: kind === 'question' && questionGroup.trim() ? questionGroup.trim() : undefined,
    });

    if (!added) {
      setFormError('מלאו כותרת ותיאור');
      return;
    }

    setTitle('');
    setDescription('');
    setQuestionGroup('');
    refresh();
  };

  const handleRemove = (id: string) => {
    removeCustomContent(id);
    refresh();
  };

  return (
    <div className="settings-group custom-content-panel">
      <span className="settings-label">תוכן מותאם אישית</span>
      <p className="custom-content-panel__hint">
        הוסיפו שאלות או משימות משלכם — נשמרות במכשיר ומשולבות במשחק לפי קטגוריה.
      </p>

      <div className="custom-content-form">
        <RadioGroup label="סוג" value={kind} options={CONTENT_KINDS} onChange={setKind} />
        <RadioGroup label="קטגוריה" value={category}
          options={visibleCategories.map((item) => ({ value: item, label: `${getCategoryIcon(item)} ${getCategoryLabel(item)}` }))}
          onChange={setCategory} className="custom-content-categories" />
        <RadioGroup label="רמה" value={level}
          options={LEVELS.map((item) => ({ value: item, label: LEVEL_LABELS[item] }))} onChange={setLevel} />

        {kind === 'question' && (
          <label className="settings-field">
            <span>קבוצת שאלות (אופציונלי)</span>
            <input
              type="text"
              value={questionGroup}
              onChange={(e) => setQuestionGroup(e.target.value)}
              placeholder="למשל: טיולים, חלומות, זיכרונות..."
            />
          </label>
        )}

        <label className="settings-field">
          <span>כותרת קצרה</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'question' ? 'שאלה לדוגמה...' : 'משימה לדוגמה...'}
            maxLength={120}
          />
        </label>

        <label className="settings-field">
          <span>{kind === 'question' ? 'נוסח השאלה' : 'תיאור המשימה'}</span>
          <textarea
            className="custom-content-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="כתבו כאן את התוכן המלא..."
          />
        </label>

        {formError && <p className="site-gate__error">{formError}</p>}

        <button type="button" className="primary-action pressable custom-content-add" onClick={handleAdd}>
          + הוספה לקטגוריה {getCategoryLabel(category)}
        </button>
      </div>

      {items.length > 0 && (
        <div className="custom-content-list">
          <span className="settings-label">התוכן שלכם ({items.length})</span>
          <ul className="custom-content-items">
            {items.map((item) => (
              <li key={item.id} className="custom-content-item">
                <div className="custom-content-item__meta">
                  <span>{item.kind === 'question' ? '❓' : '🎯'}</span>
                  <span>
                    {getCategoryIcon(item.category)} {getCategoryLabel(item.category)} · {LEVEL_LABELS[item.level]}
                  </span>
                  {item.questionGroup && <span className="custom-content-item__group">#{item.questionGroup}</span>}
                </div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <button
                  type="button"
                  className="secondary-action pressable custom-content-remove"
                  onClick={() => handleRemove(item.id)}
                >
                  מחק
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
