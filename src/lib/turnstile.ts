/**
 * Server-side Cloudflare Turnstile Verification Utility
 */

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In local development or if not configured, pass safely
  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      return { success: true };
    }
    return { success: false, error: 'Turnstile secret key is not configured' };
  }

  // Cloudflare test key bypass
  if (secretKey.includes('0000000000000000000000000000000AA')) {
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'Security verification is required. Please complete the captcha.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp && remoteIp !== '127.0.0.1') {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await response.json();
    if (!outcome.success) {
      console.warn('[Turnstile] Bot check rejected:', outcome['error-codes']);
      return { success: false, error: 'Security verification failed. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Turnstile] Error contacting Cloudflare:', error);
    // On unexpected network timeout to Cloudflare, fail safe in dev, strict in prod
    return {
      success: process.env.NODE_ENV !== 'production',
      error: 'Security verification service temporarily unreachable',
    };
  }
}
