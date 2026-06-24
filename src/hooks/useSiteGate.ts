import { useCallback, useState } from 'react';
import { isSiteGateEnabled, verifySitePassword } from '../utils/siteGate';

export function useSiteGate() {
  const gateEnabled = isSiteGateEnabled();
  const [unlocked, setUnlocked] = useState(!gateEnabled);
  const [checking, setChecking] = useState(false);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    if (!gateEnabled) {
      setUnlocked(true);
      return true;
    }

    setChecking(true);
    try {
      const ok = await verifySitePassword(password);
      if (ok) setUnlocked(true);
      return ok;
    } finally {
      setChecking(false);
    }
  }, [gateEnabled]);

  return { gateEnabled, unlocked, unlock, checking };
}
