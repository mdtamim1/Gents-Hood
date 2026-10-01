import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminAccess, hasPermission } from '@/lib/permissions';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

import { isR2Configured, uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Max file size: 10MB
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canUpload =
      auth.user.role === 'OWNER' ||
      hasPermission(auth.user, 'products') ||
      hasPermission(auth.user, 'settings');

    if (!canUpload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Products or Settings permission required to upload media',
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Use JPG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Read file bytes
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `product-${timestamp}-${random}.webp`;

    // Compress with sharp → WebP buffer
    // Keep aspect ratio, max width 1920px (so hero banners and gallery images stay crystal sharp), quality 85
    const webpBuffer = await sharp(buffer)
      .resize({
        width: 1920,
        withoutEnlargement: true, // don't upscale small images
        fit: 'inside',
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // 1. Direct Cloudflare R2 Upload (Production & Local)
    if (isR2Configured) {
      const r2Result = await uploadToR2(webpBuffer, `products/${filename}`, 'image/webp');
      return NextResponse.json({
        success: true,
        url: r2Result.url,
        filename,
      });
    }

    // 2. Fallback to local disk if R2 is not configured
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await fs.mkdir(uploadDir, { recursive: true });
    const outputPath = path.join(uploadDir, filename);
    await fs.writeFile(outputPath, webpBuffer);

    const publicUrl = `/uploads/products/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  }
}
