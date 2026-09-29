import { db } from '../src/lib/db';

async function runPhase6Tests() {
  console.log('\n==============================================');
  console.log('🧪 RUNNING PHASE 6 INTEGRATION & VERIFICATION TESTS');
  console.log('==============================================\n');

  const baseUrl = 'http://localhost:3000';

  // --- Test 1: Contact API validation ---
  console.log('1. Testing POST /api/contact validation...');
  const invalidContactRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'A', // too short
      email: 'invalid-email',
      subject: '',
      message: 'short',
    }),
  });

  const invalidContactData = await invalidContactRes.json();
  if (invalidContactRes.status !== 400 || invalidContactData.success !== false) {
    throw new Error('Contact API did not reject invalid submission with 400 status');
  }
  console.log('   ✓ Rejected invalid contact form with 400 as expected.');

  // Valid contact submission
  const validContactRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tamim Atelier Client',
      email: 'client@example.com',
      phone: '01712345678',
      subject: 'Inquiry regarding custom tailoring',
      message:
        'Hello Gents Hood, I would like to schedule an atelier fitting session this Thursday.',
    }),
  });

  const validContactData = await validContactRes.json();
  if (!validContactRes.ok || !validContactData.success) {
    throw new Error(`Contact form failed: ${validContactData.error}`);
  }
  console.log('   ✓ Valid contact submission accepted with 200 OK.');

  // --- Step 2: Ensure an order exists in DB to test tracking ---
  console.log('\n2. Retrieving existing order for tracking test...');
  const testOrder = await db.order.findFirst({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!testOrder) {
    throw new Error('No orders found in database to run tracking verification.');
  }

  console.log(`   Found Order: ${testOrder.orderNo}, Phone: ${testOrder.shippingPhone}`);

  // Test 3: Track Order - Negative test (Wrong phone number prevents data leak)
  console.log('\n3. Testing POST /api/orders/track security (wrong phone)...');
  const wrongTrackRes = await fetch(`${baseUrl}/api/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNo: testOrder.orderNo,
      phone: '01999999999', // Mismatched phone
    }),
  });

  const wrongTrackData = await wrongTrackRes.json();
  if (wrongTrackRes.status !== 404 || wrongTrackData.success !== false) {
    throw new Error('Track order did not protect data with 404 on mismatched phone');
  }
  console.log('   ✓ Security check passed: Mismatched phone returned generic 404 (no info leak).');

  // Test 4: Track Order - Positive test (Correct order number & phone)
  console.log('\n4. Testing POST /api/orders/track with valid credentials...');
  const validTrackRes = await fetch(`${baseUrl}/api/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNo: testOrder.orderNo,
      phone: testOrder.shippingPhone,
    }),
  });

  const validTrackData = await validTrackRes.json();
  if (!validTrackRes.ok || !validTrackData.success || !validTrackData.order) {
    throw new Error(`Valid track lookup failed: ${validTrackData.error}`);
  }

  console.log(`   ✓ Tracking succeeded! Status: ${validTrackData.order.status}`);
  console.log(
    `   ✓ Received timeline with ${validTrackData.order.statusHistory.length} status checkpoint(s).`
  );
  console.log(`   ✓ Item snapshot verified: "${validTrackData.order.items[0]?.name}"`);

  // Test 5: Account Orders Lookup
  console.log('\n5. Testing POST /api/account/orders customer portal lookup...');
  const accountRes = await fetch(`${baseUrl}/api/account/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testOrder.shippingPhone,
    }),
  });

  const accountData = await accountRes.json();
  if (!accountRes.ok || !accountData.success || !Array.isArray(accountData.orders)) {
    throw new Error(`Account lookup failed: ${accountData.error}`);
  }

  console.log(`   ✓ Account lookup returned ${accountData.orders.length} order(s) for phone.`);
  console.log(`   ✓ First order in history: ${accountData.orders[0].orderNo}`);

  console.log('\n==============================================');
  console.log('🎉 ALL PHASE 6 ENDPOINTS & VERIFICATION TESTS PASSED!');
  console.log('==============================================\n');
}

runPhase6Tests()
  .catch((err) => {
    console.error('❌ Phase 6 test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
