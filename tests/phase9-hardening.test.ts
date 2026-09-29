import { rateLimit } from '../src/lib/rate-limit';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import {
  trackMetaEvent,
  trackGaEvent,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  sendServerCapiEvent,
} from '../src/lib/analytics';

async function runPhase9Tests() {
  console.log('--- Starting Phase 9: Hardening, SEO & Security Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Rate Limiter - Normal Allowance
  const testIp1 = `test_ip_${Date.now()}`;
  const res1 = await rateLimit(`order_${testIp1}`);
  assert(res1.success === true, 'Rate limiter allows initial request within limit');
  assert(
    res1.remaining === 4,
    `Rate limiter remaining count decrements properly (expected 4, got ${res1.remaining})`
  );

  // TEST 2: Rate Limiter - Exhaustion & Blocking
  for (let i = 0; i < 4; i++) {
    await rateLimit(`order_${testIp1}`);
  }
  const blockedRes = await rateLimit(`order_${testIp1}`);
  assert(blockedRes.success === false, 'Rate limiter blocks requests when threshold is exceeded');
  assert(blockedRes.remaining === 0, 'Rate limiter remaining is 0 when blocked');
  assert(blockedRes.reset > Date.now(), 'Rate limiter reset timestamp is set in the future');

  // TEST 3: Dynamic Sitemap Generation
  const siteEntries = await sitemap();
  assert(Array.isArray(siteEntries), 'Sitemap returns an array of URL entries');
  assert(siteEntries.length >= 7, `Sitemap has at least 7 routes (got ${siteEntries.length})`);

  const urls = siteEntries.map((e) => e.url);
  assert(
    urls.some((u) => u.endsWith('/') || !u.includes('/', 8)),
    'Sitemap includes homepage'
  );
  assert(
    urls.some((u) => u.includes('/trending')),
    'Sitemap includes /trending catalog'
  );
  assert(
    urls.some((u) => u.includes('/contact')),
    'Sitemap includes /contact'
  );
  assert(
    urls.some((u) => u.includes('/track-order')),
    'Sitemap includes /track-order'
  );
  assert(
    urls.some((u) => u.includes('/product/')),
    'Sitemap includes dynamic product routes'
  );

  // TEST 4: Robots.txt Rules
  const robotsConfig = robots();
  assert(Boolean(robotsConfig.rules), 'Robots config includes rules property');
  assert(Boolean(robotsConfig.sitemap), 'Robots config includes sitemap reference');

  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert(rules?.allow === '/', 'Robots allows root store path');
  const disallows = Array.isArray(rules?.disallow) ? rules?.disallow : [rules?.disallow];
  assert(disallows.includes('/admin/'), 'Robots disallows /admin/');
  assert(disallows.includes('/api/admin/'), 'Robots disallows /api/admin/');

  // TEST 5: Analytics Tracking Functions
  assert(typeof trackMetaEvent === 'function', 'trackMetaEvent is defined');
  assert(typeof trackGaEvent === 'function', 'trackGaEvent is defined');
  assert(typeof trackViewContent === 'function', 'trackViewContent is defined');
  assert(typeof trackAddToCart === 'function', 'trackAddToCart is defined');
  assert(typeof trackInitiateCheckout === 'function', 'trackInitiateCheckout is defined');
  assert(typeof trackPurchase === 'function', 'trackPurchase is defined');
  assert(typeof sendServerCapiEvent === 'function', 'sendServerCapiEvent is defined');

  // Test executing analytics functions in SSR / Node environment (must not throw)
  let analyticsNoError = true;
  try {
    trackViewContent({ content_name: 'Test Product', content_ids: ['prod-1'], value: 2500 });
    trackAddToCart({ content_name: 'Test Product', content_ids: ['prod-1'], value: 2500 });
    trackInitiateCheckout({ num_items: 2, value: 5000 });
    trackPurchase({ order_id: 'GH-2026-0001', value: 5000, num_items: 2 });
  } catch (e) {
    analyticsNoError = false;
    console.error('Analytics invocation threw:', e);
  }
  assert(
    analyticsNoError,
    'Analytics functions handle server-side invocation safely without window'
  );

  // TEST 6: Live HTTP Response Security Headers & Endpoints
  try {
    const liveRes = await fetch('http://localhost:3000/');
    if (liveRes.ok) {
      const csp = liveRes.headers.get('content-security-policy');
      const hsts = liveRes.headers.get('strict-transport-security');
      const xfo = liveRes.headers.get('x-frame-options');
      const xcto = liveRes.headers.get('x-content-type-options');
      const rp = liveRes.headers.get('referrer-policy');

      assert(
        Boolean(csp && csp.includes("default-src 'self'")),
        'Live server returns Content-Security-Policy'
      );
      assert(
        Boolean(hsts && hsts.includes('max-age=')),
        'Live server returns Strict-Transport-Security'
      );
      assert(Boolean(xfo), 'Live server returns X-Frame-Options');
      assert(xcto === 'nosniff', 'Live server returns X-Content-Type-Options: nosniff');
      assert(Boolean(rp), 'Live server returns Referrer-Policy');

      const homeHtml = await liveRes.text();
      assert(
        homeHtml.includes('schema.org') && homeHtml.includes('WebSite'),
        'Home page contains WebSite JSON-LD'
      );
      assert(
        homeHtml.includes('schema.org') && homeHtml.includes('Organization'),
        'Home page contains Organization JSON-LD'
      );
    }

    const liveProduct = await fetch(
      'http://localhost:3000/product/atelier-double-faced-wool-peacoat'
    );
    if (liveProduct.ok) {
      const prodHtml = await liveProduct.text();
      assert(
        prodHtml.includes('schema.org') && prodHtml.includes('Product'),
        'Product page contains Product JSON-LD schema'
      );
    }
  } catch (err) {
    console.warn('Live dev server fetch skipped or offline during unit test execution:', err);
  }

  console.log(`\nPhase 9 Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch((e) => {
  console.error('Phase 9 test execution crashed:', e);
  process.exit(1);
});
