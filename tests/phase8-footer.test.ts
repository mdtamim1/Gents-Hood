import { db } from '../src/lib/db';
import { findSubscriberByEmail } from '../src/lib/services/newsletter.service';

async function runPhase8FooterTests() {
  console.log('\n==============================================');
  console.log('🧪 RUNNING PHASE 8 ADVANCED FOOTER & NEWSLETTER TESTS');
  console.log('==============================================\n');

  const baseUrl = 'http://localhost:3000';

  // --- Step 1: Newsletter Validation ---
  console.log('1. Testing POST /api/newsletter/subscribe input validation...');

  const invalidRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });

  const invalidData = await invalidRes.json();
  if (invalidRes.status !== 400 || invalidData.success !== false) {
    throw new Error('Newsletter API did not reject invalid email with 400');
  }
  console.log('   ✓ Rejected invalid email format with 400 as expected.');

  // --- Step 2: Valid Subscription ---
  console.log('\n2. Testing POST /api/newsletter/subscribe valid submission...');
  const testEmail = `patron.${Date.now()}@example.com`;

  const validRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });

  const validData = await validRes.json();
  if (!validRes.ok || !validData.success) {
    throw new Error(`Newsletter subscription failed: ${validData.error}`);
  }
  console.log('   ✓ Newsletter subscription succeeded with 200 OK.');

  // Verify in database
  const record = await findSubscriberByEmail(testEmail);
  if (!record || !record.email.includes(testEmail)) {
    throw new Error('Subscriber was not saved to database!');
  }
  console.log(`   ✓ Verified record in DB Subscriber table: ID ${record.id}`);

  // --- Step 3: Duplicate Subscription Idempotency ---
  console.log('\n3. Testing duplicate subscription handling...');
  const duplicateRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });

  const duplicateData = await duplicateRes.json();
  if (!duplicateRes.ok || !duplicateData.success) {
    throw new Error('Duplicate subscription failed to handle gracefully');
  }
  console.log('   ✓ Duplicate subscription handled gracefully with friendly confirmation.');

  // --- Step 4: Verify Footer HTML & Social Links on Storefront ---
  console.log('\n4. Verifying Footer rendering and social media channels on storefront...');
  const pageRes = await fetch(`${baseUrl}/`);
  const pageHtml = await pageRes.text();

  if (!pageHtml.includes('GENTS HOOD') || !pageHtml.includes('Join the Hood')) {
    throw new Error('Storefront page does not contain footer architectural components');
  }
  console.log('   ✓ Verified "GENTS HOOD" architectural watermark and newsletter block in HTML.');

  console.log('\n==============================================');
  console.log('🎉 ALL PHASE 8 ADVANCED FOOTER TESTS PASSED!');
  console.log('==============================================\n');
}

runPhase8FooterTests()
  .catch((err) => {
    console.error('❌ Phase 8 test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
