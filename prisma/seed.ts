import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Ensuring Gents Hood Real Product ---');

  const realProduct = await prisma.product.upsert({
    where: { slug: 'hunk-plus-premium-tailored-linen-cotton-long-sleeve-casual-shirt-for-men' },
    update: {
      name: 'Hunk Plus Premium Tailored Linen-Cotton Long Sleeve Casual Shirt for Men',
      shortDescription:
        'Premium textured breathable blend featuring tailored regular fit, spread collar, and chest signature embroidery.',
      description:
        'Crafted with a breathable, rich-textured weave, this long sleeve casual shirt blends modern versatility with timeless elegance. Designed with clean pleated sleeves, a sharp spread collar, and subtle tonal embroidery on the chest, it transitions seamlessly from relaxed office workdays to refined weekend evening wear.',
      price: 1200,
      comparePrice: 1550,
      sku: 'GH-HUN-PLU-PRE-91',
      status: 'ACTIVE',
      isTrending: true,
      fabric: 'Cotton-Linen Blend (Soft Textured Breathable Fabric)',
      fit: 'Structured tailored silhouette designed to provide comfortable chest room with clean, tapered shoulder lines and classic wrist-cuff draping.',
      care: 'Machine wash cold with like colors. Hang dry inside out. Warm iron if needed. Do not bleach.',
      cutDrape: 'Structured Tailored Fit / Tailored Regular',
      hardware: 'Tonal Button Closure, Pleated Cuffs, Spread Collar, Chest Embroidery',
      fitBadge: 'True to Size',
    },
    create: {
      name: 'Hunk Plus Premium Tailored Linen-Cotton Long Sleeve Casual Shirt for Men',
      slug: 'hunk-plus-premium-tailored-linen-cotton-long-sleeve-casual-shirt-for-men',
      shortDescription:
        'Premium textured breathable blend featuring tailored regular fit, spread collar, and chest signature embroidery.',
      description:
        'Crafted with a breathable, rich-textured weave, this long sleeve casual shirt blends modern versatility with timeless elegance. Designed with clean pleated sleeves, a sharp spread collar, and subtle tonal embroidery on the chest, it transitions seamlessly from relaxed office workdays to refined weekend evening wear.',
      price: 1200,
      comparePrice: 1550,
      sku: 'GH-HUN-PLU-PRE-91',
      status: 'ACTIVE',
      isTrending: true,
      trendingOrder: 0,
      fabric: 'Cotton-Linen Blend (Soft Textured Breathable Fabric)',
      fit: 'Structured tailored silhouette designed to provide comfortable chest room with clean, tapered shoulder lines and classic wrist-cuff draping.',
      care: 'Machine wash cold with like colors. Hang dry inside out. Warm iron if needed. Do not bleach.',
      cutDrape: 'Structured Tailored Fit / Tailored Regular',
      hardware: 'Tonal Button Closure, Pleated Cuffs, Spread Collar, Chest Embroidery',
      fitBadge: 'True to Size',
      images: {
        create: [
          {
            url: 'https://media.gentshood.com/products/product-1790933797238-hw42m9.webp',
            alt: 'hunk-plus-mens-burgundy-wine-formal-casual-shirt.webp',
            position: 0,
            isPrimary: true,
          },
          {
            url: 'https://media.gentshood.com/products/product-1790933935163-jqzo89.webp',
            alt: 'hunk-plus-mens-classic-white-linen-cotton-shirt.webp',
            position: 1,
            isPrimary: false,
            colorHex: '#FFFFFF',
          },
          {
            url: 'https://media.gentshood.com/products/product-1790934035009-4wlb9n.webp',
            alt: 'hunk-plus-mens-lavender-lilac-pastel-casual-shirt.webp',
            position: 2,
            isPrimary: false,
            colorHex: '#B79EB6',
          },
          {
            url: 'https://media.gentshood.com/products/product-1790934060047-i8zwse.webp',
            alt: 'hunk-plus-mens-burgundy-wine-formal-casual-shirt.webp',
            position: 3,
            isPrimary: false,
            colorHex: '#6B2335',
          },
          {
            url: 'https://media.gentshood.com/products/product-1790934085029-wu45zn.webp',
            alt: 'hunk-plus-mens-olive-green-casual-cotton-shirt.webp',
            position: 4,
            isPrimary: false,
            colorHex: '#4B5320',
          },
        ],
      },
      variants: {
        create: [
          {
            size: 'M',
            color: 'Wine',
            colorHex: '#6B2335',
            sku: 'HUNK-PLUS-PREMIUM-TAILORED-LINEN-COTTON-LONG-SLEEVE-CASUAL-SHIRT-FOR-MEN-M-WINE',
            stock: 15,
          },
          {
            size: 'L',
            color: 'Crisp White',
            colorHex: '#FFFFFF',
            sku: 'HUNK-PLUS-PREMIUM-TAILORED-LINEN-COTTON-LONG-SLEEVE-CASUAL-SHIRT-FOR-MEN-L-CRISP-WHITE',
            stock: 10,
          },
          {
            size: 'XL',
            color: 'Olive Green',
            colorHex: '#4B5320',
            sku: 'HUNK-PLUS-PREMIUM-TAILORED-LINEN-COTTON-LONG-SLEEVE-CASUAL-SHIRT-FOR-MEN-XL-OLIVE-GREEN',
            stock: 10,
          },
          {
            size: 'M',
            color: 'Heather Lilac',
            colorHex: '#B79EB6',
            sku: 'HUNK-PLUS-PREMIUM-TAILORED-LINEN-COTTON-LONG-SLEEVE-CASUAL-SHIRT-FOR-MEN-M-HEATHER-LILAC',
            stock: 10,
          },
        ],
      },
    },
  });

  console.log('--- Ensuring Site Settings ---');
  const existingSettings = await prisma.siteSetting.findFirst();
  if (!existingSettings) {
    await prisma.siteSetting.create({
      data: {
        featuredProductId: realProduct.id,
        announcementText:
          'LIMITED EDITION COLLECTION LIVE | CASH ON DELIVERY AVAILABLE | EASY 7-DAY EXCHANGE & RETURN',
        freeDeliveryMin: 5000,
        contactPhone: '01623-095187',
        contactEmail: 'gentshoodd@gmail.com',
        whatsapp: '01623-095187',
        address: 'Faridpur,Dhaka',
        socialLinks: JSON.stringify({
          facebook: 'https://www.facebook.com/share/1LuAVxyH4F/',
          instagram: 'https://www.instagram.com/gentshood.com.bd?stkn=MWdidzViY2g4ZzRwZA==',
          tiktok: 'https://www.tiktok.com/@gentshood?is_from_webapp=1&sender_device=pc',
          youtube: '',
          whatsapp: '',
          messenger: '',
        }),
        deliveryCharges: JSON.stringify({
          insideDhaka: 80,
          outsideDhaka: 140,
        }),
        heroTagline: 'Fashion That Moves With You',
        heroBackgroundWord: 'GENTS HOOD',
        trendingMarqueeText: 'BEST OF GENTS HOOD • PREMIUM COLLECTIONS',
        manifestoLine1: 'Signature Style for Modern Men.',
        manifestoLine2: 'Everyday Style, Made Exceptional.',
      },
    });
  }

  console.log('--- Ensuring Admin User ---');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gentshood.com';
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
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
  }

  console.log('✓ Seeding verified successfully with real production data!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
