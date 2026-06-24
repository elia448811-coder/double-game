import { useEffect, useState } from 'react';

export function InstallPWABanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="pwa-banner" role="region" aria-label="התקנת אפליקציה">
      <p>📲 התקינו את ספין זוגי על המסך הראשי לחוויה מהירה יותר</p>
      <div className="pwa-banner__actions">
        <button
          type="button"
          className="primary-action pwa-banner__btn"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          התקנה
        </button>
        <button type="button" className="ghost-action pwa-banner__btn" onClick={() => setDismissed(true)}>
          אולי אחר כך
        </button>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
