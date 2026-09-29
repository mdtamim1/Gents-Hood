import http from 'k6/http';
import { check, sleep } from 'k6';

// -----------------------------------------------------------------------------
// k6 Load Test Configuration for Gents Hood
// Target: 500 Concurrent Browsing Visitors + 100 Concurrent Checkout Requests
// -----------------------------------------------------------------------------

export const options = {
  scenarios: {
    // Scenario 1: 500 Concurrent Visitors browsing landing and catalog
    store_browsing: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 250 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'browseStore',
    },
    // Scenario 2: 100 Concurrent Checkout attempts
    high_concurrency_checkout: {
      executor: 'per-vu-iterations',
      vus: 100,
      iterations: 1,
      startTime: '45s',
      maxDuration: '1m',
      exec: 'placeOrder',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export function browseStore() {
  // 1. Visit Landing Page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'home status is 200': (r) => r.status === 200,
    'home has Gents Hood brand': (r) => r.body.includes('GENTS HOOD'),
  });

  sleep(1);

  // 2. Browse Trending catalog
  const trendingRes = http.get(`${BASE_URL}/trending`);
  check(trendingRes, {
    'trending status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 3. View Product page
  const productRes = http.get(`${BASE_URL}/product/atelier-double-faced-wool-peacoat`);
  check(productRes, {
    'product status is 200': (r) => r.status === 200,
  });

  sleep(2);
}

export function placeOrder() {
  const payload = JSON.stringify({
    shippingName: `Load Tester ${__VU}`,
    shippingPhone: '01712345678',
    shippingDistrict: 'Dhaka',
    shippingArea: 'Gulshan',
    shippingAddress: 'House 12, Road 4',
    items: [
      {
        productId: 'clz1peacoat01',
        variantId: 'clz1var_m_charcoal',
        name: 'Atelier Double-Faced Wool Peacoat',
        price: 5200,
        qty: 1,
        size: 'M',
        color: 'Charcoal Black',
      },
    ],
    idempotencyKey: `LOADTEST-${__VU}-${Date.now()}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.0.${Math.floor(__VU / 256)}.${__VU % 256}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/orders`, payload, params);

  check(res, {
    'order accepted or gracefully rate-limited': (r) =>
      r.status === 201 || r.status === 400 || r.status === 429,
  });
}
