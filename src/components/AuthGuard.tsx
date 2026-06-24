import { type ReactNode } from 'react';
import { useSiteGate } from '../hooks/useSiteGate';
import { SiteGate } from './SiteGate';

type AuthGuardProps = {
  children: ReactNode;
};

/** Wraps the app — content is shown only after server-side password verification. */
export function AuthGuard({ children }: AuthGuardProps) {
  const { gateEnabled, unlocked, unlock, checking } = useSiteGate();

  if (gateEnabled && !unlocked) {
    return <SiteGate onUnlock={unlock} checking={checking} />;
  }

  return <>{children}</>;
}
