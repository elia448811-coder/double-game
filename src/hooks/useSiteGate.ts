import { useCallback, useState } from 'react';
import { isSiteGateEnabled, verifySitePassword } from '../utils/siteGate';

export function useSiteGate() {
  const gateEnabled = isSiteGateEnabled();
  const [unlocked, setUnlocked] = useState(!gateEnabled);

  const unlock = useCallback((password: string): boolean => {
    if (!gateEnabled) {
      setUnlocked(true);
      return true;
    }
    if (verifySitePassword(password)) {
      setUnlocked(true);
      return true;
    }
    return false;
  }, [gateEnabled]);

  return { gateEnabled, unlocked, unlock };
}
