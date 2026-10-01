'use client';

import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err?: unknown) => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          retry?: 'auto' | 'never';
          'refresh-expired'?: 'auto' | 'manual' | 'never';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ onVerify, onExpire, onError, className = '' }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFLI5XCfK5V9ouPf';

  // Keep latest callbacks in refs so parent re-renders NEVER cause widget destruction
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let isCancelled = false;
    let pollInterval: NodeJS.Timeout | null = null;

    const renderWidget = () => {
      if (isCancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // Already rendered! Do not re-render or blink!

      try {
        // Clear any old child nodes to avoid duplicate iframe stacking
        containerRef.current.innerHTML = '';

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (token: string) => {
            if (!isCancelled) {
              onVerifyRef.current?.(token);
            }
          },
          'expired-callback': () => {
            if (!isCancelled) {
              onExpireRef.current?.();
            }
          },
          'error-callback': (err: unknown) => {
            console.warn('[Turnstile] Challenge error:', err);
            if (!isCancelled) {
              onErrorRef.current?.(err);
            }
          },
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.warn('[Turnstile] Render error:', e);
      }
    };

    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener('load', renderWidget);
      // Fallback interval in case script loaded before event listener attached
      pollInterval = setInterval(() => {
        if (window.turnstile) {
          if (pollInterval) clearInterval(pollInterval);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (script) script.removeEventListener('load', renderWidget);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]); // ONLY depend on siteKey! Never on callbacks!

  return (
    <div className={`my-2 flex justify-center ${className}`}>
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
