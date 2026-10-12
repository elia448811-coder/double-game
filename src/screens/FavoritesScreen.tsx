import { useState } from 'react';
import { AgeGateModal } from '../components/AgeGateModal';
import { ContentArtwork } from '../components/ContentArtwork';
import { RadioGroup } from '../components/RadioGroup';
import { getAllContent } from '../data/allContent';
import { getContentArtworkKey } from '../data/contentArtwork';
import { getCategoryLabel } from '../utils/adminCategories';
import { polishPrompt } from '../utils/polishPrompt';
import { isTaskHidden, listFavorites, taskAllowedByBoundaries, toggleFavorite } from '../utils/privacy';
import type { ContentMode } from '../types/game';

type Props = {
  matureAgeConfirmed: boolean;
  onConfirmMatureAge: () => void;
  onStart: (ids: string[], mature: boolean, contentMode: ContentMode) => void;
  onBack: () => void;
};

export function FavoritesScreen({ matureAgeConfirmed, onConfirmMatureAge, onStart, onBack }: Props) {
  const [, refreshFavorites] = useState(0);
  const ids = listFavorites();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [mature, setMature] = useState(false);
  const [ageGate, setAgeGate] = useState(false);
  const [limit, setLimit] = useState(24);
  const [notice, setNotice] = useState('');
  const favoriteIds = new Set(ids);
  const search = query.trim().toLocaleLowerCase('he');
  const cards = getAllContent().filter((item) => favoriteIds.has(item.id) && !isTaskHidden(item.id) &&
    taskAllowedByBoundaries(item) && (item.category === 'spicy') === mature && (!mature || matureAgeConfirmed) &&
    (kind === 'all' || (item.kind ?? 'task') === kind) &&
    (!search || `${item.title} ${item.description}`.toLocaleLowerCase('he').includes(search)));
  return (
    <section className="page-screen flow-screen favorites-screen">
      <AgeGateModal open={ageGate} onCancel={() => setAgeGate(false)} onConfirm={() => {
        onConfirmMatureAge(); setMature(true); setAgeGate(false); setLimit(24);
      }} />
      <div className="flow-card favorites-shell">
        <header className="flow-header">
          <button type="button" className="icon-btn" onClick={onBack} aria-label="חזרה">→</button>
          <div><p className="flow-kicker">שמרתם לערב הבא</p><h1 className="flow-title">המועדפים שלכם</h1></div>
        </header>
        <p className="flow-desc">חזרו לשאלות ולמשימות שאהבתם, או הרכיבו מהן ערב. הרשימה מכבדת את גבולות התוכן שלכם.</p>
        <div className="favorites-tools">
          <label className="setup-field"><span>חיפוש במועדפים</span>
            <input type="search" className="setup-field__input" value={query} placeholder="חפשו מילה או נושא"
              onChange={(event) => { setQuery(event.target.value); setLimit(24); }} />
          </label>
          <RadioGroup label="סוג המועדפים" value={kind} options={[
            { value: 'all', label: 'הכל' }, { value: 'question', label: 'שאלות' }, { value: 'task', label: 'משימות' },
          ]} onChange={(value) => { setKind(value); setLimit(24); }} />
          <RadioGroup label="תוכן במועדפים" value={mature ? 'mature' : 'regular'} options={[
            { value: 'regular', label: 'תוכן רגיל' }, { value: 'mature', label: '18+' },
          ]} onChange={(value) => {
            if (value === 'mature' && !matureAgeConfirmed) setAgeGate(true);
            else { setMature(value === 'mature'); setLimit(24); }
          }} />
        </div>
        <div className="favorites-start">
          <p aria-live="polite">{cards.length} {cards.length === 1 ? 'פריט ברשימה' : 'פריטים ברשימה'}</p>
          <button type="button" className="cta-button pressable" disabled={cards.length === 0}
            onClick={() => onStart(cards.map((item) => item.id), mature,
              cards.every((item) => item.kind === 'question') ? 'questions' : cards.every((item) => item.kind !== 'question') ? 'tasks' : 'mixed')}>התחילו עם הרשימה הזו</button>
        </div>
        {notice && <p className="history-hint" role="status">{notice}</p>}
        {cards.length === 0 ? (
          <div className="favorites-empty">
            <h2>{ids.length ? 'אין פריטים שמתאימים לבחירה הזו' : 'המועדפים שלכם מתחילים כאן'}</h2>
            <p>{ids.length ? 'נסו חיפוש אחר או שנו את סוג התוכן. פריטים שהוסתרו או שאינם מתאימים לגבולות שלכם אינם מוצגים.' : 'במהלך המשחק פתחו את האפשרויות הנוספות בכרטיס ושמרו שאלה או משימה למועדפים.'}</p>
            <button type="button" className="secondary-action pressable" onClick={onBack}>חזרה למסך הראשי</button>
          </div>
        ) : (
          <div className="favorites-grid">
            {cards.slice(0, limit).map((item) => (
              <article className="favorite-card" key={item.id}>
                <ContentArtwork artwork={getContentArtworkKey(item)} />
                <div className="favorite-card__body">
                  <p className="flow-kicker">{item.kind === 'question' ? 'שאלה' : 'משימה'} · {getCategoryLabel(item.category)}</p>
                  <h2>{polishPrompt(item.title)}</h2>
                  <p>{polishPrompt(item.description)}</p>
                  <button type="button" className="secondary-action pressable" aria-label={`הסרת ${polishPrompt(item.title)} מהמועדפים`}
                    onClick={() => { toggleFavorite(item.id); refreshFavorites((value) => value + 1); setNotice('הפריט הוסר מהמועדפים.'); }}>הסרה מהמועדפים</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {cards.length > limit && <button type="button" className="secondary-action pressable favorites-more" onClick={() => setLimit((value) => value + 24)}>הצגת מועדפים נוספים</button>}
      </div>
    </section>
  );
}
