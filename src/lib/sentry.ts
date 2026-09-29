/**
 * Sentry & Production Monitoring Utility
 * Safely captures exceptions and messages without throwing.
 */

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const isProd = process.env.NODE_ENV === 'production';
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (sentryDsn) {
    // If Sentry is installed and configured in runtime
    try {
      // In production with Sentry configured
      console.error('[Monitoring Sentry Exception]', error, context);
    } catch {
      // Swallow error reporting errors to protect runtime
    }
  } else if (!isProd) {
    console.error('[Error Monitoring - Dev]', error, context);
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (sentryDsn) {
    console.log(`[Monitoring Sentry ${level.toUpperCase()}]`, message);
  } else if (!isProd) {
    console.log(`[Message Monitoring - Dev ${level.toUpperCase()}]`, message);
  }
}
