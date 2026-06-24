import { useState, type FormEvent } from 'react';

type SiteGateProps = {
  onUnlock: (password: string) => boolean;
};

export function SiteGate({ onUnlock }: SiteGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = onUnlock(password.trim());
    if (ok) return;
    setError(true);
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="site-gate" dir="rtl">
      <div className="site-gate__glow site-gate__glow--one" aria-hidden />
      <div className="site-gate__glow site-gate__glow--two" aria-hidden />

      <div className={`site-gate__card ${shake ? 'site-gate__card--shake' : ''}`}>
        <div className="site-gate__lock" aria-hidden>
          🔒
        </div>
        <p className="site-gate__badge">Couple Spin</p>
        <h1 className="site-gate__title">ספין זוגי</h1>
        <p className="site-gate__desc">האתר מוגן בסיסמה — הזינו סיסמה כדי להמשיך</p>

        <form className="site-gate__form" onSubmit={submit}>
          <label className="site-gate__label" htmlFor="site-gate-pass">
            סיסמה
          </label>
          <input
            id="site-gate-pass"
            type="password"
            className="site-gate__input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="הקלידו סיסמה..."
            autoComplete="current-password"
            autoFocus
          />
          {error && <p className="site-gate__error">סיסמה שגויה — נסו שוב</p>}
          <button type="submit" className="site-gate__submit pressable" disabled={!password.trim()}>
            כניסה לאתר
          </button>
        </form>

        <p className="site-gate__hint">הסיסמה נבדקת מול השרת · נדרשת בכל כניסה מחדש לאתר</p>
      </div>
    </div>
  );
}
