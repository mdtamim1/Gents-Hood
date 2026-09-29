'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'danger' | 'info' = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={twMerge(
              clsx(
                'animate-fade-in pointer-events-auto flex items-center justify-between rounded-[1px] border p-4 text-xs uppercase tracking-looser shadow-lg transition-all',
                toast.type === 'success' && 'border-line-inv bg-ink text-cream',
                toast.type === 'danger' && 'border-danger bg-danger text-cream',
                toast.type === 'info' && 'border-ink bg-cream text-ink'
              )
            )}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 p-1 hover:opacity-75 focus-visible:outline-none"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
