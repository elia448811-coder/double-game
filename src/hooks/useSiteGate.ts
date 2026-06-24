import { useCallback, useState } from 'react';
import {
  isSiteGateEnabled,
  readGateSession,
  verifySitePassword,
  writeGateSession,
} from '../utils/siteGate';

export function useSiteGate() {
  const gateEnabled = isSiteGateEnabled();
  const [unlocked, setUnlocked] = useState(() => !gateEnabled || readGateSession());

  const unlock = useCallback((password: string): boolean => {
    if (!gateEnabled) {
      setUnlocked(true);
      return true;
    }
    if (verifySitePassword(password)) {
      writeGateSession();
      setUnlocked(true);
      return true;
    }
    return false;
  }, [gateEnabled]);

  return { gateEnabled, unlocked, unlock };
}
