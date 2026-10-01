'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 30 minutes of inactivity before automatic logout
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// Check interval every 15 seconds
const CHECK_INTERVAL_MS = 15 * 1000;

export function AdminIdleTimeout() {
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Events to track active human interaction
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const interval = setInterval(async () => {
      if (isLoggingOutRef.current) return;

      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= IDLE_TIMEOUT_MS) {
        isLoggingOutRef.current = true;
        try {
          await fetch('/api/admin/auth/logout', { method: 'POST' });
        } catch {
          // Ignore network errors on logout
        } finally {
          router.push('/admin/login?reason=idle_timeout');
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [router]);

  return null;
}
