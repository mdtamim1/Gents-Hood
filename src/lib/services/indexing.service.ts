import * as jose from 'jose';
import { getSiteUrl } from '@/lib/constants/site';

const DEFAULT_INDEXNOW_KEY = 'b2b89d41e7a549e49c719e5f2081d4a9';

/**
 * Sends URL updates directly to the IndexNow network (Microsoft Bing, Yandex, Seznam, Naver, etc.)
 */
export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  try {
    const siteUrl = getSiteUrl();
    // Do not notify on localhost
    if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
      return false;
    }

    const host = new URL(siteUrl).host;
    const key = process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
    const keyLocation = `${siteUrl}/${key}.txt`;

    const payload = {
      host,
      key,
      keyLocation,
      urlList: urls.slice(0, 10000), // IndexNow supports up to 10k URLs per request
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URLs for instant indexing.`);
      return true;
    } else {
      const text = await res.text();
      console.warn(`[IndexNow] Request returned status ${res.status}:`, text);
      return false;
    }
  } catch (err) {
    console.warn('[IndexNow] Notification failed:', err);
    return false;
  }
}

/**
 * Sends URL notifications to Google Indexing API if Service Account credentials exist.
 */
export async function notifyGoogleIndexing(
  urls: string[],
  action: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<number> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();

  if (!clientEmail || !rawKey) {
    // Google Service Account not configured, gracefully skip
    return 0;
  }

  try {
    const siteUrl = getSiteUrl();
    if (siteUrl.includes('localhost')) return 0;

    // Normalize PEM key formatting (handling escaped newlines from environment variables)
    const formattedKey = rawKey.replace(/\\n/g, '\n');
    const privateKey = await jose.importPKCS8(formattedKey, 'RS256');

    // Sign JWT token for Google OAuth
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/indexing',
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.warn('[Google Indexing API] OAuth token fetch failed:', errorText);
      return 0;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;
    let successCount = 0;

    for (const url of urls) {
      try {
        const publishRes = await fetch(
          'https://indexing.googleapis.com/v3/urlNotifications:publish',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              url,
              type: action,
            }),
          }
        );

        if (publishRes.ok) {
          successCount++;
        } else {
          const err = await publishRes.text();
          console.warn(`[Google Indexing API] Failed to publish ${url}:`, err);
        }
      } catch (err) {
        console.warn(`[Google Indexing API] Error notifying ${url}:`, err);
      }
    }

    console.log(`[Google Indexing API] Notified ${successCount}/${urls.length} URLs.`);
    return successCount;
  } catch (error) {
    console.warn('[Google Indexing API] Notification failed:', error);
    return 0;
  }
}

/**
 * Universal auto-notify function.
 * Accepts paths (e.g. ['/', '/trending', '/product/slug']) or full URLs,
 * and broadcasts to IndexNow and Google Indexing API in background.
 */
export function autoNotifySearchEngines(pathsOrUrls: string | string[]): void {
  const siteUrl = getSiteUrl();
  const list = Array.isArray(pathsOrUrls) ? pathsOrUrls : [pathsOrUrls];

  const fullUrls = Array.from(
    new Set(
      list
        .map((item) => {
          if (!item) return '';
          if (item.startsWith('http://') || item.startsWith('https://')) return item;
          return `${siteUrl}${item.startsWith('/') ? '' : '/'}${item}`;
        })
        .filter(Boolean)
    )
  );

  if (fullUrls.length === 0) return;

  // Run asynchronously without blocking caller
  Promise.allSettled([
    notifyIndexNow(fullUrls),
    notifyGoogleIndexing(fullUrls, 'URL_UPDATED'),
  ]).catch((err) => {
    console.warn('[Search Engine Auto-Notify] Execution error:', err);
  });
}
