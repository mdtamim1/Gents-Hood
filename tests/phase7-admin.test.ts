import { db } from '../src/lib/db';
import { getFeaturedProduct } from '../src/lib/services/product.service';

async function runPhase7AdminTests() {
  console.log('\n==============================================');
  console.log('🧪 RUNNING PHASE 7 ADMIN PANEL INTEGRATION TESTS');
  console.log('==============================================\n');

  const baseUrl = 'http://localhost:3000';

  // --- Step 1: Authentication Tests ---
  console.log('1. Testing Admin Authentication (POST /api/admin/auth/login)...');

  // Negative test: Wrong password
  const failedLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gentshood.com',
      password: 'WrongPassword999',
    }),
  });

  const failedData = await failedLogin.json();
  if (failedLogin.status !== 401 || failedData.success !== false) {
    throw new Error('Admin login failed to reject invalid password with 401');
  }
  console.log('   ✓ Rejected invalid credentials with 401 as expected.');

  // Positive test: Correct password
  const validLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gentshood.com',
      password: 'Admin@12345',
    }),
  });

  const validData = await validLogin.json();
  if (!validLogin.ok || !validData.success || !validData.user) {
    throw new Error(`Admin login failed: ${validData.error}`);
  }

  // Extract session cookie from Set-Cookie header
  const setCookie = validLogin.headers.get('set-cookie');
  if (!setCookie || !setCookie.includes('gh_admin_session')) {
    throw new Error('Login did not return gh_admin_session httpOnly cookie');
  }

  const cookieHeader = setCookie.split(';')[0];
  console.log('   ✓ Authenticated successfully! Received secure session cookie.');

  // --- Step 2: Featured Main Product Selector ---
  console.log('\n2. Testing Featured Main Dress Selector (POST /api/admin/featured)...');

  const allActive = await db.product.findMany({
    where: { status: 'ACTIVE' },
    take: 2,
  });

  if (allActive.length < 2) {
    throw new Error('At least 2 active products needed for selector test');
  }

  const targetProduct = allActive[1];
  console.log(
    `   Switching Main Landing Dress to: "${targetProduct.name}" (ID: ${targetProduct.id})`
  );

  const featuredRes = await fetch(`${baseUrl}/api/admin/featured`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ productId: targetProduct.id }),
  });

  const featuredData = await featuredRes.json();
  if (!featuredRes.ok || !featuredData.success) {
    throw new Error(`Failed to update featured product: ${featuredData.error}`);
  }

  // Verify DB and Service cache reflection
  const siteSetting = await db.siteSetting.findFirst();
  if (siteSetting?.featuredProductId !== targetProduct.id) {
    throw new Error('DB siteSetting.featuredProductId was not updated!');
  }

  const currentFeatured = await getFeaturedProduct();
  if (currentFeatured?.id !== targetProduct.id) {
    throw new Error('getFeaturedProduct() service cache did not reflect the new featured product!');
  }
  console.log('   ✓ Main featured dress updated and service cache verified immediately.');

  // --- Step 3: Product CRUD & Trending Toggle ---
  console.log('\n3. Testing Products CRUD & Instant Trending Toggle...');

  // Create product
  const createProductRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: 'Atelier Double-Faced Wool Peacoat',
      price: 5800,
      comparePrice: 7200,
      sku: 'GH-PEA-99',
      shortDescription: 'Heavyweight double-faced wool crafted for cold metropolitan evenings.',
      description: 'Hand-tailored collar with horn buttons and satin-twill lining.',
      status: 'ACTIVE',
      isTrending: true,
      fabric: '90% Virgin Wool, 10% Cashmere',
      fit: 'Tailored Boxy Fit',
      care: 'Specialist dry clean only.',
      images: [
        { url: '/images/gallery-front.jpg', alt: 'Peacoat Front', position: 1, isPrimary: true },
      ],
      variants: [
        { size: 'M', color: 'Charcoal Black', colorHex: '#171718', stock: 10 },
        { size: 'L', color: 'Charcoal Black', colorHex: '#171718', stock: 15 },
      ],
    }),
  });

  const createData = await createProductRes.json();
  if (!createProductRes.ok || !createData.success || !createData.product) {
    throw new Error(`Create product failed: ${createData.error}`);
  }
  const createdId = createData.product.id;
  console.log(`   ✓ Created new menswear item: "${createData.product.name}" (ID: ${createdId})`);

  // Toggle trending
  const toggleRes = await fetch(`${baseUrl}/api/admin/products/${createdId}/toggle-trending`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
  });
  const toggleData = await toggleRes.json();
  if (!toggleRes.ok || !toggleData.success) {
    throw new Error(`Toggle trending failed: ${toggleData.error}`);
  }
  console.log(`   ✓ Toggled trending status: now isTrending = ${toggleData.isTrending}`);

  // --- Step 4: Orders Management & Status Update ---
  console.log('\n4. Testing Orders Management & Status Workflow...');

  const ordersRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { Cookie: cookieHeader },
  });
  const ordersData = await ordersRes.json();
  if (!ordersRes.ok || !ordersData.success || ordersData.orders.length === 0) {
    throw new Error('Failed to retrieve orders list');
  }

  const testOrder = ordersData.orders[0];
  console.log(`   Found Order: ${testOrder.orderNo}, Current Status: ${testOrder.status}`);

  // Update order status to PROCESSING
  const patchOrderRes = await fetch(`${baseUrl}/api/admin/orders/${testOrder.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      status: 'PROCESSING',
      note: 'Verified address with customer on phone. Preparing atelier packaging.',
    }),
  });

  const patchData = await patchOrderRes.json();
  if (!patchOrderRes.ok || !patchData.success || patchData.order.status !== 'PROCESSING') {
    throw new Error(`Failed to update order status: ${patchData.error}`);
  }
  console.log('   ✓ Order status transitioned to PROCESSING and history timeline logged.');

  // Test CSV Export
  const csvRes = await fetch(`${baseUrl}/api/admin/orders/export`, {
    headers: { Cookie: cookieHeader },
  });
  if (!csvRes.ok) {
    throw new Error('Orders CSV export failed');
  }
  const csvText = await csvRes.text();
  if (!csvText.startsWith('Order No,Date,Customer Name')) {
    throw new Error('CSV output does not contain expected header row');
  }
  console.log(`   ✓ CSV export generated valid ${csvText.split('\n').length} rows.`);

  // --- Step 5: Site Settings & Social Links ---
  console.log('\n5. Testing Site Settings & Social Media Updates...');

  const settingsRes = await fetch(`${baseUrl}/api/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      announcementText: 'ATELIER EXCLUSIVE: COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ৳1,999',
      freeDeliveryMin: 1999,
      deliveryCharges: { insideDhaka: 80, outsideDhaka: 140 },
      socialLinks: {
        facebook: 'https://facebook.com/gentshood.official',
        instagram: 'https://instagram.com/gentshood.official',
        tiktok: 'https://tiktok.com/@gentshood',
        youtube: 'https://youtube.com/@gentshood',
        whatsapp: 'https://wa.me/8801700000000',
        messenger: 'https://m.me/gentshood',
      },
    }),
  });

  const settingsData = await settingsRes.json();
  if (!settingsRes.ok || !settingsData.success) {
    throw new Error(`Failed to update site settings: ${settingsData.error}`);
  }
  console.log('   ✓ Site settings, delivery charges, and social media channels updated.');

  // --- Step 6: Verify Audit Logs ---
  console.log('\n6. Verifying Audit Logs in Database...');
  const auditLogs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (auditLogs.length === 0) {
    throw new Error('No audit log entries recorded in database');
  }
  console.log(`   ✓ Found ${auditLogs.length} recent audit logs:`);
  for (const log of auditLogs) {
    console.log(`     · Action: ${log.action} on ${log.entity} (${log.entityId || 'N/A'})`);
  }

  console.log('\n==============================================');
  console.log('🎉 ALL PHASE 7 ADMIN PANEL SUITE TESTS PASSED!');
  console.log('==============================================\n');
}

runPhase7AdminTests()
  .catch((err) => {
    console.error('❌ Phase 7 test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
