/**
 * Gents Hood Analytics & Tracking Layer
 * Supports Meta Pixel (fbq), Google Analytics 4 (gtag), and Facebook Conversions API (CAPI).
 * Strict TypeScript: zero any.
 */

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

export interface ViewContentParams {
  content_name: string;
  content_ids: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

export interface AddToCartParams {
  content_name: string;
  content_ids: string[];
  value: number;
  currency?: string;
}

export interface InitiateCheckoutParams {
  num_items: number;
  value: number;
  currency?: string;
}

export interface PurchaseParams {
  order_id: string;
  value: number;
  currency?: string;
  num_items: number;
}

declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      params?: Record<string, string | number | boolean | string[] | undefined>
    ) => void;
    gtag?: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: Record<string, string | number | boolean | unknown[] | undefined>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Dispatch Meta Pixel track event safely
 */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | string[] | undefined>
): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, params);
    } catch (e) {
      console.warn('[MetaPixel] Event track failed:', e);
    }
  }
}

/**
 * Dispatch Google Analytics 4 event safely
 */
export function trackGaEvent(
  action: string,
  params?: Record<string, string | number | boolean | unknown[] | undefined>
): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', action, params);
    } catch (e) {
      console.warn('[GA4] Event track failed:', e);
    }
  }
}

/**
 * Triggered on Product View Page
 */
export function trackViewContent(data: ViewContentParams): void {
  const currency = data.currency || 'BDT';
  trackMetaEvent('ViewContent', {
    content_name: data.content_name,
    content_ids: data.content_ids,
    content_type: data.content_type || 'product',
    value: data.value,
    currency,
  });

  trackGaEvent('view_item', {
    currency,
    value: data.value,
    items: data.content_ids.map((id) => ({
      item_id: id,
      item_name: data.content_name,
      price: data.value,
    })),
  });
}

/**
 * Triggered when customer clicks "Add to Cart" or "Order Now"
 */
export function trackAddToCart(data: AddToCartParams): void {
  const currency = data.currency || 'BDT';
  trackMetaEvent('AddToCart', {
    content_name: data.content_name,
    content_ids: data.content_ids,
    content_type: 'product',
    value: data.value,
    currency,
  });

  trackGaEvent('add_to_cart', {
    currency,
    value: data.value,
    items: data.content_ids.map((id) => ({
      item_id: id,
      item_name: data.content_name,
      price: data.value,
    })),
  });
}

/**
 * Triggered on Checkout page load
 */
export function trackInitiateCheckout(data: InitiateCheckoutParams): void {
  const currency = data.currency || 'BDT';
  trackMetaEvent('InitiateCheckout', {
    num_items: data.num_items,
    value: data.value,
    currency,
  });

  trackGaEvent('begin_checkout', {
    currency,
    value: data.value,
  });
}

/**
 * Triggered on Order Success / Confirmation page
 */
export function trackPurchase(data: PurchaseParams): void {
  const currency = data.currency || 'BDT';
  trackMetaEvent('Purchase', {
    content_type: 'product',
    value: data.value,
    currency,
    num_items: data.num_items,
  });

  trackGaEvent('purchase', {
    transaction_id: data.order_id,
    value: data.value,
    currency,
  });
}

/**
 * Server-side Conversions API (CAPI) helper.
 * Dispatches asynchronously to avoid blocking the HTTP response thread.
 */
export async function sendServerCapiEvent(
  eventName: string,
  eventData: {
    orderId?: string;
    value?: number;
    currency?: string;
    email?: string;
    phone?: string;
    clientIp?: string;
    userAgent?: string;
  }
): Promise<void> {
  const pixelId = process.env.FB_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    // CAPI credentials not configured; skip silently
    return;
  }

  try {
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            client_ip_address: eventData.clientIp,
            client_user_agent: eventData.userAgent,
            ...(eventData.phone ? { ph: [eventData.phone] } : {}),
            ...(eventData.email ? { em: [eventData.email] } : {}),
          },
          custom_data: {
            currency: eventData.currency || 'BDT',
            value: eventData.value,
            order_id: eventData.orderId,
          },
        },
      ],
    };

    // Fire and forget fetch
    fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.warn('[CAPI] Asynchronous dispatch failed:', err));
  } catch (err) {
    console.warn('[CAPI] Error constructing payload:', err);
  }
}
