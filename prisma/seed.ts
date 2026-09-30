import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning existing records ---');
  await prisma.orderActivityLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.siteSetting.deleteMany({});
  await prisma.staffSession.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.adminUser.deleteMany({});

  console.log('--- Seeding Main Featured Product ---');
  const mainProduct = await prisma.product.create({
    data: {
      name: 'Structured City Overcoat',
      slug: 'structured-city-overcoat',
      shortDescription:
        'Engineered from custom heavy-weight milled twill featuring relaxed sculpted shoulders and a modern architectural collar.',
      description:
        'Designed for tailored modern versatility. Engineered from custom heavy-weight milled twill featuring relaxed drop shoulders, deep welt pockets, and an architectural storm collar. Built to endure cold city breezes while maintaining fluid effortless silhouette.',
      price: 3650,
      comparePrice: 4500,
      sku: 'GH-COT-01',
      status: 'ACTIVE',
      isTrending: true,
      trendingOrder: 1,
      fabric: '65% Premium Combed Cotton, 35% Wool Blend (420 GSM)',
      fit: 'Relaxed contemporary silhouette, true to size',
      care: 'Professional dry clean or gentle cold hand wash. Do not tumble dry.',
      sizeChartJson: JSON.stringify({
        units: 'inches',
        headers: ['Size', 'Chest', 'Length', 'Shoulder', 'Sleeve'],
        rows: [
          { size: 'S', chest: 40, length: 29.5, shoulder: 18.5, sleeve: 24.5 },
          { size: 'M', chest: 42, length: 30.5, shoulder: 19.2, sleeve: 25.0 },
          { size: 'L', chest: 44, length: 31.5, shoulder: 20.0, sleeve: 25.5 },
          { size: 'XL', chest: 46, length: 32.5, shoulder: 20.8, sleeve: 26.0 },
          { size: 'XXL', chest: 48, length: 33.5, shoulder: 21.5, sleeve: 26.5 },
        ],
      }),
      seoTitle: 'Structured City Overcoat — Gents Hood Premium Menswear',
      seoDescription:
        'High-density cotton-wool milled overcoat with structured drape. Fast delivery across Bangladesh.',
      images: {
        create: [
          {
            url: '/images/new-vibes-main.jpg',
            alt: 'Front Lookbook Perspective',
            position: 1,
            isPrimary: true,
          },
          {
            url: '/images/gallery-front.jpg',
            alt: 'Tailored Silhouette Front View',
            position: 2,
            isPrimary: false,
          },
          {
            url: '/images/gallery-detail.jpg',
            alt: 'Fabric Weave & Button Close-up',
            position: 3,
            isPrimary: false,
          },
          {
            url: '/images/gallery-lifestyle.jpg',
            alt: 'Editorial Lifestyle Drape',
            position: 4,
            isPrimary: false,
          },
          {
            url: '/images/hero-model.png',
            alt: 'Full Body Cutout Stance',
            position: 5,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          // Charcoal Black
          {
            size: 'S',
            color: 'Charcoal Black',
            colorHex: '#171718',
            stock: 8,
            sku: 'GH-COT-01-BLK-S',
          },
          {
            size: 'M',
            color: 'Charcoal Black',
            colorHex: '#171718',
            stock: 12,
            sku: 'GH-COT-01-BLK-M',
          },
          {
            size: 'L',
            color: 'Charcoal Black',
            colorHex: '#171718',
            stock: 10,
            sku: 'GH-COT-01-BLK-L',
          },
          {
            size: 'XL',
            color: 'Charcoal Black',
            colorHex: '#171718',
            stock: 5,
            sku: 'GH-COT-01-BLK-XL',
          },
          // Deep Slate
          { size: 'S', color: 'Deep Slate', colorHex: '#2A2E33', stock: 6, sku: 'GH-COT-01-SLT-S' },
          { size: 'M', color: 'Deep Slate', colorHex: '#2A2E33', stock: 8, sku: 'GH-COT-01-SLT-M' },
          { size: 'L', color: 'Deep Slate', colorHex: '#2A2E33', stock: 7, sku: 'GH-COT-01-SLT-L' },
          {
            size: 'XL',
            color: 'Deep Slate',
            colorHex: '#2A2E33',
            stock: 4,
            sku: 'GH-COT-01-SLT-XL',
          },
          // Muted Taupe
          {
            size: 'S',
            color: 'Muted Taupe',
            colorHex: '#5E5A54',
            stock: 5,
            sku: 'GH-COT-01-TPE-S',
          },
          {
            size: 'M',
            color: 'Muted Taupe',
            colorHex: '#5E5A54',
            stock: 7,
            sku: 'GH-COT-01-TPE-M',
          },
          {
            size: 'L',
            color: 'Muted Taupe',
            colorHex: '#5E5A54',
            stock: 6,
            sku: 'GH-COT-01-TPE-L',
          },
          {
            size: 'XL',
            color: 'Muted Taupe',
            colorHex: '#5E5A54',
            stock: 3,
            sku: 'GH-COT-01-TPE-XL',
          },
        ],
      },
    },
  });

  console.log('--- Seeding 8 Trending Products ---');
  const trendingData = [
    {
      name: 'Minimalist Heavyweight Boxy Tee',
      slug: 'minimalist-heavyweight-boxy-tee',
      shortDescription: '280 GSM heavyweight cotton jersey with tailored ribbed collar.',
      price: 1450,
      comparePrice: 1800,
      sku: 'GH-TEE-01',
      order: 2,
    },
    {
      name: 'Pleated Wide-Leg Wool Trousers',
      slug: 'pleated-wide-leg-wool-trousers',
      shortDescription: 'Double front pleats with sharp center crease and tailored drape.',
      price: 2850,
      comparePrice: 3400,
      sku: 'GH-TRS-02',
      order: 3,
    },
    {
      name: 'Relaxed Drop-Shoulder Fleece Hoodie',
      slug: 'relaxed-drop-shoulder-fleece-hoodie',
      shortDescription: '450 GSM brush-back organic cotton fleece with double-lined hood.',
      price: 2650,
      comparePrice: 3200,
      sku: 'GH-HOD-03',
      order: 4,
    },
    {
      name: 'Architectural Utility Field Jacket',
      slug: 'architectural-utility-field-jacket',
      shortDescription: 'Water-repellent technical canvas with magnetic closures and storm cuffs.',
      price: 4250,
      comparePrice: 5200,
      sku: 'GH-JKT-04',
      order: 5,
    },
    {
      name: 'Double-Breasted Structured Blazer',
      slug: 'double-breasted-structured-blazer',
      shortDescription: 'Sharp peak lapels with subtle shoulder pads and silk twill lining.',
      price: 5450,
      comparePrice: 6500,
      sku: 'GH-BLZ-05',
      order: 6,
    },
    {
      name: 'Raw Hem Oversized Denim Shirt',
      slug: 'raw-hem-oversized-denim-shirt',
      shortDescription: '12oz washed indigo cotton twill with distressed hems.',
      price: 2250,
      comparePrice: 2750,
      sku: 'GH-SHR-06',
      order: 7,
    },
    {
      name: 'Cashmere-Touch Knit Crewneck',
      slug: 'cashmere-touch-knit-crewneck',
      shortDescription: 'Fine-gauge merino blend knit designed for lightweight seasonal warmth.',
      price: 2950,
      comparePrice: 3600,
      sku: 'GH-KNT-07',
      order: 8,
    },
    {
      name: 'Tailored Minimalist Cargo Pant',
      slug: 'tailored-minimalist-cargo-pant',
      shortDescription: 'Streamlined low-profile pockets with adjustable toggle ankles.',
      price: 2550,
      comparePrice: 3100,
      sku: 'GH-CRG-08',
      order: 9,
    },
  ];

  for (const item of trendingData) {
    await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: `${item.shortDescription} Engineered to the rigorous standards of Gents Hood modern menswear.`,
        price: item.price,
        comparePrice: item.comparePrice,
        sku: item.sku,
        status: 'ACTIVE',
        isTrending: true,
        trendingOrder: item.order,
        fabric: 'Premium 100% Milled Cotton / Blend',
        fit: 'Contemporary Relaxed Fit',
        care: 'Machine wash cold with like colors.',
        images: {
          create: [
            {
              url: '/images/gallery-front.jpg',
              alt: `${item.name} Front`,
              position: 1,
              isPrimary: true,
            },
            {
              url: '/images/gallery-detail.jpg',
              alt: `${item.name} Detail`,
              position: 2,
              isPrimary: false,
            },
          ],
        },
        variants: {
          create: [
            {
              size: 'M',
              color: 'Charcoal Black',
              colorHex: '#171718',
              stock: 15,
              sku: `${item.sku}-M`,
            },
            {
              size: 'L',
              color: 'Charcoal Black',
              colorHex: '#171718',
              stock: 12,
              sku: `${item.sku}-L`,
            },
            {
              size: 'XL',
              color: 'Charcoal Black',
              colorHex: '#171718',
              stock: 8,
              sku: `${item.sku}-XL`,
            },
          ],
        },
      },
    });
  }

  console.log('--- Seeding Site Settings ---');
  await prisma.siteSetting.create({
    data: {
      featuredProductId: mainProduct.id,
      announcementText: 'FREE DELIVERY ON ORDERS ABOVE ৳1,999',
      freeDeliveryMin: 1999,
      contactPhone: '+8801700000000',
      contactEmail: 'contact@gentshood.com',
      whatsapp: '+8801700000000',
      address: 'Gulshan 2, Dhaka, Bangladesh',
      heroTagline: 'Fashion That Moves With You',
      heroBackgroundWord: 'GENTS HOOD',
      deliveryCharges: JSON.stringify({
        insideDhaka: 70,
        outsideDhaka: 130,
      }),
      socialLinks: JSON.stringify({
        facebook: 'https://facebook.com/gentshood',
        instagram: 'https://instagram.com/gentshood',
        tiktok: 'https://tiktok.com/@gentshood',
        youtube: 'https://youtube.com/@gentshood',
        whatsapp: 'https://wa.me/8801700000000',
        messenger: 'https://m.me/gentshood',
      }),
    },
  });

  console.log('--- Seeding Admin User ---');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gentshood.com';
  const hashedPassword = await bcrypt.hash('ADMIN2020', 10);
  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      name: 'Super Admin',
      passwordHash: hashedPassword,
      role: 'OWNER',
      isActive: true,
      displayColor: '#6366f1',
      permissions: JSON.stringify({
        orders: true,
        products: true,
        customers: true,
        settings: true,
        analytics: true,
      }),
    },
  });

  console.log('✓ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
