import { db } from '../src/lib/db';

async function testFullFlow() {
  console.log('\n==============================================');
  console.log('🧪 RUNNING PHASE 5 END-TO-END CHECKOUT FLOW TEST');
  console.log('==============================================\n');

  // Step 1: Select product and variant
  const product = await db.product.findUnique({
    where: { slug: 'structured-city-overcoat' },
    include: { variants: true },
  });

  if (!product || product.variants.length === 0) {
    throw new Error('Test product not found');
  }

  const variant = product.variants[0];
  const initialStock = variant.stock;
  console.log(`1. Selected Product: "${product.name}", Variant: ${variant.size}/${variant.color}`);
  console.log(`   Initial Variant Stock: ${initialStock}`);

  // Step 2: Simulate Checkout Form submission via POST /api/orders
  const idempotencyKey = `E2E-PHASE5-${Date.now()}`;
  const payload = {
    shippingName: 'Tamim End-to-End Buyer',
    shippingPhone: '01711223344',
    shippingDistrict: 'Dhaka',
    shippingArea: 'Gulshan 2',
    shippingAddress: 'House 45, Road 11',
    note: 'Call before delivery',
    idempotencyKey,
    paymentMethod: 'COD',
    items: [
      {
        productId: product.id,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        quantity: 1,
      },
    ],
  };

  console.log('\n2. Submitting POST request to /api/orders...');
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(`Order placement failed: ${data.error || res.statusText}`);
  }

  const orderNo = data.order.orderNo;
  console.log(`✓ Order placed successfully! Order Number: ${orderNo}`);
  console.log(
    `  Subtotal: ৳${data.order.subtotal}, Delivery: ৳${data.order.deliveryCharge}, Total: ৳${data.order.total}`
  );

  // Step 3: Verify DB records (Order + Items + StatusHistory)
  console.log('\n3. Verifying database state...');
  const createdOrder = await db.order.findUnique({
    where: { orderNo },
    include: { items: true, statusHistory: true },
  });

  if (!createdOrder) {
    throw new Error('FAIL: Order record missing in database!');
  }
  console.log(`✓ DB Order record found (Status: ${createdOrder.status})`);

  if (createdOrder.items.length !== 1 || createdOrder.items[0].nameSnapshot !== product.name) {
    throw new Error('FAIL: Order items snapshot incorrect!');
  }
  console.log(
    `✓ DB Order items snapshot verified: "${createdOrder.items[0].nameSnapshot}" (Price: ৳${createdOrder.items[0].priceSnapshot})`
  );

  if (
    createdOrder.statusHistory.length === 0 ||
    createdOrder.statusHistory[0].status !== 'PENDING'
  ) {
    throw new Error('FAIL: Order status history missing or not PENDING!');
  }
  console.log(
    `✓ DB Order status history verified (Initial: ${createdOrder.statusHistory[0].status})`
  );

  // Step 4: Verify stock decrement
  const updatedVariant = await db.productVariant.findUnique({
    where: { id: variant.id },
  });

  if (!updatedVariant || updatedVariant.stock !== initialStock - 1) {
    throw new Error(`FAIL: Expected stock ${initialStock - 1}, got ${updatedVariant?.stock}`);
  }
  console.log(`✓ Stock successfully decremented from ${initialStock} to ${updatedVariant.stock}`);

  // Step 5: Test Double-Click / Idempotency protection
  console.log('\n4. Testing duplicate submission with same idempotency key (Double-click test)...');
  const duplicateRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // Exact same key
  });

  const duplicateData = await duplicateRes.json();
  if (duplicateData.order.orderNo !== orderNo) {
    throw new Error('FAIL: Duplicate submission created a new order!');
  }

  const stockAfterDouble = await db.productVariant.findUnique({
    where: { id: variant.id },
  });

  if (stockAfterDouble?.stock !== updatedVariant.stock) {
    throw new Error('FAIL: Stock was decremented twice!');
  }
  console.log(
    '✓ Idempotency protected: Returned existing order without creating duplicate or double-decrementing stock.'
  );

  // Step 6: Verify /order-success/[orderNo] renders cleanly
  console.log('\n5. Verifying /order-success page endpoint response...');
  const successRes = await fetch(`http://localhost:3000/order-success/${orderNo}`);
  if (successRes.status !== 200) {
    throw new Error(`FAIL: /order-success/${orderNo} returned status ${successRes.status}`);
  }
  console.log(`✓ /order-success/${orderNo} responded with HTTP 200 OK.`);

  console.log('\n🎉 ALL PHASE 5 END-TO-END FLOW TESTS COMPLETED SUCCESSFULLY!\n');
}

testFullFlow()
  .catch((err) => {
    console.error('Flow test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
