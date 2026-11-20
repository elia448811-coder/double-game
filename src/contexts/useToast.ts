import { createContext, useContext } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export type ToastInput = {
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
